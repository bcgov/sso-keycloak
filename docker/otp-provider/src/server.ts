import express, { Request, Response, NextFunction } from 'express';
import Provider, { Configuration, ResponseType } from 'oidc-provider';
import { setRoutes } from './routes';
import * as path from 'node:path';
import cors from 'cors';
import { generateEvents } from './events';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(express.static(__dirname + '/public'));

const PORT = 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.set('trust proxy', true);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

const clients = [
  {
    client_id: 'conf-client',
    client_secret: 'secret',
    grant_types: ['authorization_code', 'refresh_token'],
    redirect_uris: ['http://localhost:3001'],
    scope: 'openid email',
    response_types: ['code'] as ResponseType[],
    clientUri: 'http://localhost:3001',
    post_logout_redirect_uris: ['http://localhost:3001'],
  },
];

const clientsConfig: Configuration = {
  clientAuthMethods: ['client_secret_basic', 'client_secret_post', 'none'],
  clients,
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
  const provider = new Provider(`http://localhost:${PORT}`, clientsConfig);
  const routes = await setRoutes(provider);
  app.use('/', routes);
  app.use(provider.callback());
  generateEvents(provider);
})();

app.listen(PORT, () => {
  console.log(`OIDC Provider is running on http://localhost:${PORT}`);
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
