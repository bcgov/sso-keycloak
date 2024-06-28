const _ = require('lodash');
const async = require('async');
const axios = require('axios');
const { getAdminClient, log, getPgClient, sendRcNotification, handleError, deleteLegacyData } = require('./helpers');
const jwt = require('jsonwebtoken');
const { ConfidentialClientApplication } = require('@azure/msal-node');

const MS_GRAPH_URL = 'https://graph.microsoft.com';
const MS_GRAPH_IDIR_GUID_ATTRIBUTE = 'onPremisesExtensionAttributes/extensionAttribute12';

require('dotenv').config();

let devMsalInstance;
let testMsalInstance;
let prodMsalInstance;

let msTokenCache = {
  dev: {
    token: '',
    decoded: null
  },
  test: {
    token: '',
    decoded: null
  },
  prod: {
    token: '',
    decoded: null
  }
};

async function getAzureAccessToken(env) {
  try {
    const currentTime = Math.floor(Date.now() / 1000);
    if (msTokenCache[env].decoded && msTokenCache[env].decoded?.exp > currentTime) {
      return msTokenCache[env].token;
    }
    const request = {
      scopes: [`${MS_GRAPH_URL}/.default`]
    };

    let msalInstance;
    switch (env) {
      case 'dev':
        msalInstance =
          devMsalInstance ||
          new ConfidentialClientApplication({
            auth: {
              authority: process.env.MS_GRAPH_API_AUTHORITY_DEV || '',
              clientId: process.env.MS_GRAPH_API_CLIENT_ID_DEV || '',
              clientSecret: process.env.MS_GRAPH_API_CLIENT_SECRET_DEV || ''
            }
          });
        break;
      case 'test':
        msalInstance =
          testMsalInstance ||
          new ConfidentialClientApplication({
            auth: {
              authority: process.env.MS_GRAPH_API_AUTHORITY_TEST || '',
              clientId: process.env.MS_GRAPH_API_CLIENT_ID_TEST || '',
              clientSecret: process.env.MS_GRAPH_API_CLIENT_SECRET_TEST || ''
            }
          });
        break;
      case 'prod':
        msalInstance =
          prodMsalInstance ||
          new ConfidentialClientApplication({
            auth: {
              authority: process.env.MS_GRAPH_API_AUTHORITY_PROD || '',
              clientId: process.env.MS_GRAPH_API_CLIENT_ID_PROD || '',
              clientSecret: process.env.MS_GRAPH_API_CLIENT_SECRET_PROD || ''
            }
          });
        break;
    }
    const response = await msalInstance.acquireTokenByClientCredential(request);
    msTokenCache[env].token = response.accessToken;
    msTokenCache[env].decoded = jwt.decode(response.accessToken);
    return response.accessToken;
  } catch (error) {
    console.error(error);
    throw new Error('Error acquiring access token');
  }
}

async function checkUserExistsAtIDIM({ property = MS_GRAPH_IDIR_GUID_ATTRIBUTE, matchKey = '', env }) {
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
    if (result && result.data?.value?.length === 0) {
      return 'notexists';
    }
    if (result && result.data?.value?.length > 0) {
      return 'exists';
    }
    console.error(`unexpected response from ms graph:  ${result}`);
    return 'error';
  } catch (error) {
    console.log(error?.response?.data || error);
    throw new Error(error);
  }
}

async function getUserRolesMappings(adminClient, userId) {
  try {
    const clientRoles = [];
    const roleMappings = await adminClient.users.listRoleMappings({ realm: 'standard', id: userId });
    const realmRoles = roleMappings.realmMappings ? roleMappings.realmMappings.map((map) => map.name) : [];
    if (roleMappings.clientMappings) {
      for (const map in roleMappings.clientMappings) {
        clientRoles.push({
          client: roleMappings.clientMappings[map].client,
          roles: roleMappings.clientMappings[map].mappings.map((role) => role.name)
        });
      }
    }
    return { realmRoles, clientRoles };
  } catch (err) {
    console.error(err);
    throw new Error(`cannot fetch roles of user ${userId}`);
  }
}

async function removeUserFromCssApp(userData, clientData) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: process.env.CSS_API_AUTH_SECRET
    };
    userData.clientData = clientData;
    const res = await axios.post(`${process.env.CSS_API_URL}/delete-inactive-idir-users`, userData, { headers });
    return res.status === 200;
  } catch (err) {
    handleError(err);
    return false;
  }
}

async function removeUserFromKc(adminClient, id) {
  try {
    await adminClient.users.del({ realm: 'standard', id });
  } catch (err) {
    console.error(err);
  }
}

async function removeStaleUsersByEnv(env = 'dev', pgClient, runnerName, startFrom, callback) {
  try {
    let deletedUserCount = 0;
    await pgClient.connect();
    const text =
      'INSERT INTO kc_deleted_users (environment, user_id, username, email, first_name, last_name, attributes, realm_roles, client_roles, css_app_deleted) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)';
    const adminClient = await getAdminClient(env);
    if (!adminClient) throw new Error(`could not get the admin client for ${env}`);

    const max = 100;
    let first = startFrom;
    let total = 0;

    while (true) {
      const users = await adminClient.users.find({ realm: 'standard', username: '@idir', first, max });
      const count = users.length;
      total += count;

      for (let x = 0; x < users.length; x++) {
        const { id, username } = users[x];
        const idirUserGuid = String(users[x]?.attributes?.idir_user_guid || '').toLowerCase();
        if (!idirUserGuid) continue;
        const displayName = String(users[x]?.attributes?.display_name || '').toLowerCase();
        // ignore the users with `hold` in their displayname
        if (displayName && displayName.startsWith('hold -')) continue;
        log(`[${runnerName}] processing user ${username}`);
        if (username.includes('@idir')) {
          const userExistsAtWb = await checkUserExistsAtIDIM({
            property: MS_GRAPH_IDIR_GUID_ATTRIBUTE,
            matchKey: idirUserGuid,
            env
          });
          if (userExistsAtWb === 'notexists') {
            const { realmRoles, clientRoles } = await getUserRolesMappings(adminClient, id);
            await removeUserFromKc(adminClient, id);
            const userDeletedAtCss = await removeUserFromCssApp(users[x], clientRoles);
            const values = [
              env,
              id,
              username,
              users[x].email || '',
              users[x].firstName || '',
              users[x].lastName || '',
              JSON.stringify(users[x].attributes) || '',
              realmRoles,
              clientRoles.map((r) => JSON.stringify(r)),
              userDeletedAtCss
            ];
            await pgClient.query({ text, values });
            deletedUserCount++;
            log(`[${runnerName}] ${username} has been deleted from ${env} environment`);
          } else continue;
        }
      }

      // each runner can process records up to 10000
      if (count < max || total === 10000) break;

      // max 50 users can be deleted by a runner at a time
      if (deletedUserCount > 50) break;

      await adminClient.reauth();
      first = first + max;
      log(`[${runnerName}] completed processing ${first} users`);
    }
    await pgClient.end();
    log(`[${runnerName}] ${total} users processed.`);
    callback(null, { runnerName, processed: total, deleteCount: deletedUserCount });
  } catch (err) {
    handleError(err);
    callback(JSON.stringify(err?.message || err?.response?.data || err), { runnerName });
  } finally {
    await pgClient.end();
  }
}

async function main() {
  async.parallel(
    async.reflectAll([
      function (cb) {
        removeStaleUsersByEnv('dev', getPgClient(), 'dev', 0, cb);
      },
      function (cb) {
        removeStaleUsersByEnv('test', getPgClient(), 'test', 0, cb);
      },
      function (cb) {
        removeStaleUsersByEnv('prod', getPgClient(), 'prod-01', 0, cb);
      },
      function (cb) {
        removeStaleUsersByEnv('prod', getPgClient(), 'prod-02', 10000, cb);
      },
      function (cb) {
        removeStaleUsersByEnv('prod', getPgClient(), 'prod-03', 20000, cb);
      },
      function (cb) {
        removeStaleUsersByEnv('prod', getPgClient(), 'prod-04', 30000, cb);
      },
      function (cb) {
        removeStaleUsersByEnv('prod', getPgClient(), 'prod-05', 40000, cb);
      }
    ]),
    async function (_, results) {
      const hasError = results.find((r) => r.error);
      const textContent = hasError ? 'Failed to remove' : 'Successfully removed';

      await sendRcNotification(
        'cron-remove-inactive-users',
        `**[${process.env.NAMESPACE}] ${textContent} inactive users** \n\n` +
          results.map((r) => JSON.stringify(r)).join('\n\n'),
        hasError
      );
    }
  );
  await deleteLegacyData('kc_deleted_users', process.env.INACTIVE_IDIR_USERS_RETENTION_DAYS || 60);
}

main();
