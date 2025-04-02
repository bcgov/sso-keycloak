import express from 'express';
import Provider, { Configuration, ResponseType } from 'oidc-provider';
import { setRoutes } from './routes.ts';
import { dirname } from 'desm';
import * as path from 'node:path';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import cors from 'cors';

const __dirname = dirname(import.meta.url);

const app = express();

app.use(express.static(__dirname + '/public'));

const PORT = 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.set('trust proxy', true);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded());

// parse application/json
app.use(bodyParser.json());

app.use(morgan('combined'));

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

const provider = new Provider(`http://localhost:${PORT}`, clientsConfig);

app.use('/', await setRoutes(provider));

app.use(provider.callback());

app.listen(PORT, () => {
  console.log(`OIDC Provider is running on http://localhost:${PORT}`);
});
