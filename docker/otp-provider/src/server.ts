import express, { Request, Response, NextFunction } from 'express';
import Provider, { ClientMetadata, Configuration } from 'oidc-provider';
import { setRoutes } from './routes';
import * as path from 'node:path';
import cors from 'cors';
import { generateEvents } from './events';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getClients } from './utils/queries';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { createMigrator } from './modules/sequelize/umzug';
import logger from './modules/winston.config';
import SequelizeAdapter from './modules/sequelize/adapter';
import Keygrip from 'keygrip';

const { APP_URL } = config;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(helmet());

app.use(express.static(__dirname + '/public'));

const PORT = 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.set('trust proxy', true);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST'],
  }),
);

app.disable('x-powered-by');

app.use(
  rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100,
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
  }),
);

const clientsConfig: Configuration = {
  adapter: SequelizeAdapter,
  cookies: {
    keys: new Keygrip(process.env.COOKIE_SECRETS!?.split(','), 'sha256', 'base64'),
  },
  clientAuthMethods: ['client_secret_basic', 'client_secret_post', 'none'],
  issueRefreshToken() {
    return true;
  },
  features: {
    revocation: { enabled: true },
    devInteractions: { enabled: false },
    introspection: { enabled: true },
    userinfo: { enabled: false },
    rpInitiatedLogout: {
      enabled: true,
      logoutSource: async (ctx, form) => {
        // auto submit to skip the logout confirmation page
        form = form.replace('</form>', '<input type="hidden" name="logout" value="yes"/></form>');
        ctx.body = `
  <!DOCTYPE html>
  <head>
    <script>
      document.addEventListener('DOMContentLoaded', function () { document.forms[0].submit() });
    </script>
  </head>
  <body>
    ${form}
    <noscript>
      <button autofocus type="submit" form="op.logoutForm" value="yes" name="logout">Continue</button>
    </noscript>
  </body>
  </html>
`;
      },
    },
    resourceIndicators: {
      enabled: true,
      getResourceServerInfo: async (ctx, resourceIndicator, client) => {
        return {
          scope: client?.scope as string,
          accessTokenFormat: 'jwt',
          accessTokenTTL: 300,
          jwt: {
            sign: {
              alg: 'RS256',
            },
          },
        };
      },
      defaultResource: async (ctx, client, oneOf) => {
        return client?.clientUri as string;
      },
      useGrantedResource: async (ctx, model) => {
        return true;
      },
    },
  },
  scopes: ['openid', 'email'], // scopes allowed for a client
  extraClientMetadata: {
    properties: ['clientUri'], //using the clienturi property as the resource indicator
  },
  ttl: {
    Session: 36000, // 10 hours
    AccessToken: 300, // 5 minutes
    AuthorizationCode: 60, // 1 minute
    RefreshToken: 1800, // 30 minutes
    Interaction: 300, // 5 minutes
    IdToken: 300, // 5 minutes
  },
};

(async () => {
  try {
    const migrator = await createMigrator(logger);
    console.log('Migrating pending migrations:', await migrator.pending());
    await migrator.up();
    console.log('Database migration completed');
  } catch (err) {
    console.error('Error during database migration:', err);
  }

  const rawClients = await getClients([
    'clientId',
    'clientSecret',
    'grantTypes',
    'redirectUris',
    'scope',
    'responseTypes',
    'clientUri',
    'postLogoutRedirectUris',
  ]);
  const clients: ClientMetadata[] = rawClients.map((row: any) => ({
    client_id: row.clientId,
    client_secret: row.clientSecret,
    grant_types: row.grantTypes,
    redirect_uris: row.redirectUris,
    scope: row.scope,
    response_types: row.responseTypes,
    client_uri: row.clientUri,
    post_logout_redirect_uris: row.postLogoutRedirectUris,
  }));
  const provider = new Provider(APP_URL, {
    ...clientsConfig,
    clients,
  });
  const routes = await setRoutes(provider);
  app.use('/', routes);
  app.use(provider.callback());
  generateEvents(provider);

  app.listen(PORT, () => {
    console.log(`OIDC Provider is running on ${APP_URL}`);
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    let errorMessage = 'Internal Server Error';
    if (err?.error === 'invalid_request') {
      errorMessage = 'Invalid or expired session found so please login again';
    }
    res.render('error', {
      error: errorMessage,
    });
  });
})();
