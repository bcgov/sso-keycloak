import { parallel, reflectAll } from 'async';
import { getPgClient, sendRcNotification, deleteLegacyData } from './helpers.js';
import { decode } from 'jsonwebtoken';
import { ConfidentialClientApplication } from '@azure/msal-node';
import axios from 'axios';
import { removeStaleUsersByEnv, initializeUsersExportFile } from './utils/inactive-user-helpers.js';

/** @typedef {import('@keycloak/keycloak-admin-client/lib/defs/userRepresentation.js').default} UserRepresentation */
/** @typedef {import('@keycloak/keycloak-admin-client/lib/client.js').KeycloakAdminClient} KeycloakAdminClient */

const MS_GRAPH_URL = 'https://graph.microsoft.com';
const MS_GRAPH_IDIR_GUID_ATTRIBUTE = 'onPremisesExtensionAttributes/extensionAttribute12';

const INSERT_SQL =
  'INSERT INTO kc_deleted_idir_mfa_users (environment, user_id, username, email, first_name, last_name, attributes, realm_roles, client_roles, css_app_deleted) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)';

let devMsalInstance = new ConfidentialClientApplication({
  auth: {
    authority: process.env.MS_GRAPH_API_AUTHORITY_DEV || '',
    clientId: process.env.MS_GRAPH_API_CLIENT_ID_DEV || '',
    clientSecret: process.env.MS_GRAPH_API_CLIENT_SECRET_DEV || ''
  }
});

let testMsalInstance = new ConfidentialClientApplication({
  auth: {
    authority: process.env.MS_GRAPH_API_AUTHORITY_TEST || '',
    clientId: process.env.MS_GRAPH_API_CLIENT_ID_TEST || '',
    clientSecret: process.env.MS_GRAPH_API_CLIENT_SECRET_TEST || ''
  }
});

let prodMsalInstance = new ConfidentialClientApplication({
  auth: {
    authority: process.env.MS_GRAPH_API_AUTHORITY_PROD || '',
    clientId: process.env.MS_GRAPH_API_CLIENT_ID_PROD || '',
    clientSecret: process.env.MS_GRAPH_API_CLIENT_SECRET_PROD || ''
  }
});

let msTokenCache = {
  dev: { token: '', decoded: null },
  test: { token: '', decoded: null },
  prod: { token: '', decoded: null }
};

/**
 * @param {string} env - Environment name (e.g. 'dev', 'test', 'prod')
 * @returns {Promise<string>} - Returns the access token for the specified environment
 */
async function getAzureAccessToken(env) {
  if (!msTokenCache[env]) {
    throw new Error(`Invalid environment: ${env}`);
  }
  try {
    const currentTime = Math.floor(Date.now() / 1000);
    if (msTokenCache[env].decoded && msTokenCache[env].decoded?.exp > currentTime) {
      return msTokenCache[env].token;
    }
    const request = { scopes: [`${MS_GRAPH_URL}/.default`] };

    let msalInstance;
    if (env === 'dev') {
      msalInstance = devMsalInstance;
    } else if (env === 'test') {
      msalInstance = testMsalInstance;
    } else {
      msalInstance = prodMsalInstance;
    }

    const response = await msalInstance.acquireTokenByClientCredential(request);
    msTokenCache[env].token = response.accessToken;
    msTokenCache[env].decoded = decode(response.accessToken);
    return response.accessToken;
  } catch (error) {
    console.error(error);
    throw new Error('Error acquiring access token', { cause: error });
  }
}

/**
 * @param {string} property - The property to filter by in the MS Graph API (e.g. 'onPremisesExtensionAttributes/extensionAttribute12')
 * @param {string} matchKey - The value to match against the specified property
 * @param {string} env - Environment name (e.g. 'dev', 'test', 'prod')
 * @returns {Promise<string>} - Returns 'exists' if the user exists, 'notexists' if the user does not exist, or 'error' if there was an error
 */
async function checkUserExistsAtEntra({ property = MS_GRAPH_IDIR_GUID_ATTRIBUTE, matchKey = '', env }) {
  try {
    const accessToken = await getAzureAccessToken(env);
    const options = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ConsistencyLevel: 'eventual'
      }
    };

    const url = `${MS_GRAPH_URL}/v1.0/users?$filter=${property} eq '${matchKey}'&$count=true`;
    const result = await axios.get(url, options);
    if (result.data?.value?.length === 0) {
      return 'notexists';
    }
    if (result.data?.value?.length > 0) {
      return 'exists';
    }
    console.error(`unexpected response from ms graph:  ${JSON.stringify(result)}`);
    return 'error';
  } catch (error) {
    console.error(error?.response?.data || error);
    throw new Error(error?.message || String(error), { cause: error });
  }
}

/**
 * @param {UserRepresentation} user - Keycloak user object
 * @returns {Promise<boolean>} - Returns true if the user should be skipped, false otherwise
 */
async function shouldSkipUser(user) {
  const idirUserGuid = String(user?.attributes?.idir_user_guid || '').toLowerCase();
  return !idirUserGuid;
}

/**
 * @param {UserRepresentation} user - Keycloak user object
 * @param {KeycloakAdminClient} adminClient - Keycloak admin client instance
 * @param {string} env - Environment name (e.g. 'dev', 'test', 'prod')
 * @returns {Promise<boolean>} - Returns true if the user should be deleted, false otherwise
 */
async function shouldDeleteUser(user, adminClient, env) {
  const idirUserGuid = String(user?.attributes?.idir_user_guid || '').toLowerCase();
  const userExists = await checkUserExistsAtEntra({ matchKey: idirUserGuid, env });
  if (userExists === 'error') {
    console.error(`[shouldDeleteUser] MS Graph check returned an error for user ${user.username} — skipping deletion`);
    return false;
  }
  return userExists === 'notexists';
}

async function main() {
  await initializeUsersExportFile();

  const opts = {
    realm: 'azureidir',
    insertSql: INSERT_SQL,
    shouldSkip: shouldSkipUser,
    shouldDelete: shouldDeleteUser
  };
  parallel(
    reflectAll([
      function (cb) {
        removeStaleUsersByEnv('dev', getPgClient(), 'dev', 0, cb, opts);
      },
      function (cb) {
        removeStaleUsersByEnv('test', getPgClient(), 'test', 0, cb, opts);
      },
      function (cb) {
        removeStaleUsersByEnv('prod', getPgClient(), 'prod-01', 0, cb, opts);
      },
      function (cb) {
        removeStaleUsersByEnv('prod', getPgClient(), 'prod-02', 10000, cb, opts);
      },
      function (cb) {
        removeStaleUsersByEnv('prod', getPgClient(), 'prod-03', 20000, cb, opts);
      },
      function (cb) {
        removeStaleUsersByEnv('prod', getPgClient(), 'prod-04', 30000, cb, opts);
      },
      function (cb) {
        removeStaleUsersByEnv('prod', getPgClient(), 'prod-05', 40000, cb, opts);
      }
    ]),
    async function (_, results) {
      const hasError = results.find((r) => r.error);
      const textContent = hasError ? 'Failed to remove' : 'Successfully removed';

      await sendRcNotification(
        'cron-remove-inactive-idir-mfa-users',
        `**[${process.env.NAMESPACE}] ${textContent} inactive IDIR MFA users** \n\n` +
          results.map((r) => JSON.stringify(r)).join('\n\n'),
        hasError
      );
    }
  );
  await deleteLegacyData('kc_deleted_idir_mfa_users', process.env.INACTIVE_IDIR_USERS_RETENTION_DAYS || 60);
}

await main();
