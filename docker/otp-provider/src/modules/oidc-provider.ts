import { Client, ClientMetadata, Configuration, errors, KoaContextWithOIDC } from 'oidc-provider';
import { config } from '../config';
import SequelizeAdapter from './sequelize/adapter';
import Keygrip from 'keygrip';
import { isOrigin, hashEmail } from '../utils/helpers';
import { getClients } from './sequelize/queries/client';
import type { Response } from 'express';
import app from '../app';

const { JWKS, COOKIE_SECRETS } = config;

const jwks = JWKS || {};

const corsProp = 'allowedCorsOrigins';

export const getConfig = (): Configuration => {
  return {
    claims: {
      openid: ['sub', 'otp_guid'],
      email: ['email'],
    },
    // Overrride node-oidc default page with the EJS error template
    renderError: async (ctx, out, error) => {
      app.render(
        'error',
        {
          title: 'statusCode' in error ? error.statusCode : 'Unknown Error',
          message:
            'error_description' in error ? error.error_description : 'The server has encountered an unknown error.',
        },
        (_, html) => {
          ctx.type = 'text/html';
          ctx.body = html;
        },
      );
    },
    pkce: {
      required: (_ctx: KoaContextWithOIDC, client: Client) => {
        // Require PKCE for all clients except those using 'none' client authentication
        return Boolean(!client.clientSecret && client.grantTypes?.includes('authorization_code'));
      },
    },
    jwks,
    adapter: SequelizeAdapter,
    cookies: {
      keys: new Keygrip(COOKIE_SECRETS!?.split(','), 'sha256', 'base64'),
    },
    clientAuthMethods: ['client_secret_basic', 'client_secret_post', 'none'],
    issueRefreshToken() {
      return true;
    },
    features: {
      claimsParameter: { enabled: true },
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
          <script nonce="${(ctx.res as Response)?.locals?.cspNonce}">
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
        getResourceServerInfo: async (_ctx, _resourceIndicator, client) => {
          return {
            scope: client?.scope as string,
            accessTokenFormat: 'jwt',
            accessTokenTTL: 5, // expire in 5 seconds
            jwt: {
              sign: {
                alg: 'RS256',
              },
            },
          };
        },
        defaultResource: async (_ctx, client, _oneOf) => {
          return client?.clientUri as string;
        },
        useGrantedResource: async (_ctx, _model) => {
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
      // Session defines how long the session object (i.e., the user login state) is stored and valid.
      Session: 36000, // 10 hours
      AccessToken: 300, // 5 minutes
      AuthorizationCode: 60, // 1 minute
      RefreshToken: 1800, // 30 minutes
      Interaction: 1800, // 30 minutes
      IdToken: 300, // 5 minutes
      //Grant controls how long the authorization grant (which includes tokens and scopes) is valid. This affects token reuse and refresh behavior.
      Grant: 36000, // 10 hours - client session max
      DeviceCode: 300, // 5 minutes
      InitialAccessToken: 300, // 5 minutes
      RegistrationAccessToken: 300, // 5 minutes
    },
    findAccount: async (_ctx, sub) => {
      return {
        accountId: sub,
        async claims() {
          return {
            sub,
            otp_guid: hashEmail(sub),
            email: sub,
          };
        },
      };
    },
    clientBasedCORS: (_ctx, origin, client) => {
      // Allow all origins; you can add logic here to restrict origins based on client if needed
      if (client && typeof client === 'object' && Array.isArray((client as any)[corsProp])) {
        return ((client as any)[corsProp] as string[]).includes(origin);
      }
      return false;
    },
  };
};

export const getOidcClients = async (): Promise<ClientMetadata[]> => {
  const rawClients = await getClients([
    'clientId',
    'clientSecret',
    'grantTypes',
    'redirectUris',
    'scope',
    'responseTypes',
    'clientUri',
    'postLogoutRedirectUris',
    'tokenEndpointAuthMethod',
  ]);
  return rawClients.map((row: any) => {
    const client: ClientMetadata = {
      client_id: row.clientId,
      grant_types: row.grantTypes,
      redirect_uris: row.redirectUris,
      scope: row.scope,
      response_types: row.responseTypes,
      client_uri: row.clientUri,
      post_logout_redirect_uris: row.postLogoutRedirectUris,
      token_endpoint_auth_method: row.tokenEndpointAuthMethod || 'none',
    };
    if (row?.clientSecret) client.client_secret = row?.clientSecret;
    return client;
  });
};
