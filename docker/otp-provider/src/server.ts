import express, { Request, Response, NextFunction } from 'express';
import Provider, { ClientMetadata, Configuration, errors } from 'oidc-provider';
import { setRoutes } from './routes';
import * as path from 'node:path';
import cors from 'cors';
import { generateEvents } from './events';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getClients } from './utils/queries';
import helmet from 'helmet';
import { config } from './config';
import { createMigrator } from './modules/sequelize/umzug';
import logger from './modules/winston.config';
import SequelizeAdapter from './modules/sequelize/adapter';
import Keygrip from 'keygrip';
import { isOrigin } from './utils/helpers';
import * as crypto from 'crypto';

const { NODE_ENV, APP_URL, JWKS, CORS_ORIGINS } = config;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const jwks = JWKS || {};

const app = express();

const cspNonce = crypto.randomBytes(16).toString('base64'); // Generate a nonce for CSP

const directives = helmet.contentSecurityPolicy.getDefaultDirectives();
delete directives['form-action'];

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        ...directives,
        'script-src': ["'self'", `'nonce-${cspNonce}'`],
      },
    },
  }),
);

if (NODE_ENV === 'production') {
  app.set('trust proxy', true);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/public'));

const PORT = 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(
  cors({
    origin: NODE_ENV === 'production' ? CORS_ORIGINS.split(',').map((origin) => origin.trim()) : '*',
    methods: ['GET', 'POST'],
  }),
);

app.disable('x-powered-by');

const corsProp = 'allowedCorsOrigins';

const clientsConfig: Configuration = {
  jwks,
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
          <script nonce="${cspNonce}">
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
    properties: ['clientUri', corsProp], //using the clienturi property as the resource indicator
    validator(_, key, value, metadata) {
      if (key === corsProp) {
        // set default (no CORS)
        if (value === undefined) {
          metadata[corsProp] = [];
          return;
        }
        // validate an array of Origin strings
        if (!Array.isArray(value) || !value.every(isOrigin)) {
          throw new errors.InvalidClientMetadata(`${corsProp} must be an array of origins`);
        }
      }
    },
  },
  ttl: {
    Session: 36000, // 10 hours
    AccessToken: 300, // 5 minutes
    AuthorizationCode: 60, // 1 minute
    RefreshToken: 1800, // 30 minutes
    Interaction: 300, // 5 minutes
    IdToken: 300, // 5 minutes
    Grant: 36000, // 10 hours
    DeviceCode: 300, // 5 minutes
    InitialAccessToken: 300, // 5 minutes
    RegistrationAccessToken: 300, // 5 minutes
  },
  findAccount: async (ctx, incomingEmail) => {
    return {
      accountId: incomingEmail,
      async claims() {
        return {
          sub: incomingEmail,
        };
      },
    };
  },
  clientBasedCORS: (ctx, origin, client) => {
    // Allow all origins; you can add logic here to restrict origins based on client if needed
    if (client && typeof client === 'object' && Array.isArray((client as any)[corsProp])) {
      return ((client as any)[corsProp] as string[]).includes(origin);
    }
    return false;
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

  if (NODE_ENV === 'production') provider.proxy = true; // Enable proxy support for the provider

  generateEvents(provider);

  app.listen(PORT, () => {
    console.log(`OIDC Provider is running on ${APP_URL}`);
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Error occurred:', err);
    let errorMessage = 'Internal Server Error';
    if (err?.error === 'invalid_request') {
      errorMessage = 'Invalid or expired session found so please login again';
    }
    res.render('error', {
      error: errorMessage,
    });
  });
})();
