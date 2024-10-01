const _ = require('lodash');
const async = require('async');
const { promisify } = require('util');
const axios = require('axios');
const { parseString } = require('xml2js');
const { getAdminClient, log, getPgClient, sendRcNotification, handleError, deleteLegacyData } = require('./helpers');
const jwt = require('jsonwebtoken');
const { ConfidentialClientApplication } = require('@azure/msal-node');

const MS_GRAPH_URL = 'https://graph.microsoft.com';
const MS_GRAPH_IDIR_GUID_ATTRIBUTE = 'onPremisesExtensionAttributes/extensionAttribute12';

require('dotenv').config();

// NOTE: this is per runner, e.g with 5 in prod 50 is the total user deletion limit
const MAX_DELETED_USERS_PER_RUNNER = 30;

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

/*
  This function checks existence using MS Graph. Currently has issues with being out of sync with IDIM, so is unused.
  Keeping the function in case the sync issue can be resolved.
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

const parseStringSync = promisify(parseString);

function getWebServiceInfo({ env = 'dev' }) {
  const requestHeaders = {
    'Content-Type': 'text/xml;charset=UTF-8',
    authorization: `Basic ${process.env.BCEID_SERVICE_BASIC_AUTH}`
  };

  const requesterIdirGuid = process.env.BCEID_REQUESTER_IDIR_GUID || '';

  let serviceUrl = '';
  let serviceId = '';
  if (env === 'dev') {
    serviceUrl = 'https://gws2.development.bceid.ca';
    serviceId = process.env.BCEID_SERVICE_ID_DEV || '';
  } else if (env === 'test') {
    serviceUrl = 'https://gws2.test.bceid.ca';
    serviceId = process.env.BCEID_SERVICE_ID_TEST || '';
  } else if (env === 'prod') {
    serviceUrl = 'https://gws2.bceid.ca';
    serviceId = process.env.BCEID_SERVICE_ID_PROD || '';
  }

  return { requestHeaders, requesterIdirGuid, serviceUrl, serviceId };
}

const generateXML = (
  {
    property = 'userId',
    matchKey = '',
    matchType = 'Exact',
    serviceId = '',
    requesterIdirGuid = '',
    page = 1,
    limit = 1
  },
  requestType = 'searchInternalAccount'
) => {
  if (requestType === 'getAccountDetail') {
    return `<?xml version="1.0" encoding="UTF-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:V10="http://www.bceid.ca/webservices/Client/V10/">
        <soapenv:Header />
        <soapenv:Body>
            <V10:getAccountDetail>
             <V10:accountDetailRequest>
                <V10:onlineServiceId>${serviceId}</V10:onlineServiceId>
                <V10:requesterAccountTypeCode>Internal</V10:requesterAccountTypeCode>
                <V10:requesterUserGuid>${requesterIdirGuid}</V10:requesterUserGuid>
                <V10:${property}>${matchKey}</V10:${property}>
                <V10:accountTypeCode>Internal</V10:accountTypeCode>
             </V10:accountDetailRequest>
          </V10:getAccountDetail>
        </soapenv:Body>
    </soapenv:Envelope>`;
  } else {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:V10="http://www.bceid.ca/webservices/Client/V10/">
    <soapenv:Header />
    <soapenv:Body>
        <V10:searchInternalAccount>
            <V10:internalAccountSearchRequest>
                <V10:onlineServiceId>${serviceId}</V10:onlineServiceId>
                <V10:requesterAccountTypeCode>Internal</V10:requesterAccountTypeCode>
                <V10:requesterUserGuid>${requesterIdirGuid}</V10:requesterUserGuid>
                <requesterAccountTypeCode>Internal</requesterAccountTypeCode>
                <V10:pagination>
                    <V10:pageSizeMaximum>${String(limit || 100)}</V10:pageSizeMaximum>
                    <V10:pageIndex>${String(page || 1)}</V10:pageIndex>
                </V10:pagination>
                <V10:sort>
                    <V10:direction>Ascending</V10:direction>
                    <V10:onProperty>UserId</V10:onProperty>
                </V10:sort>
                <V10:accountMatch>
                    <V10:${property}>
                       <V10:value>${matchKey}</V10:value>
                       <V10:matchPropertyUsing>${matchType}</V10:matchPropertyUsing>
                    </V10:${property}>
                 </V10:accountMatch>
            </V10:internalAccountSearchRequest>
        </V10:searchInternalAccount>
    </soapenv:Body>
</soapenv:Envelope>`;
  }
};

async function checkUserExistsAtIDIM({ property = 'userGuid', matchKey = '', env = 'prod' }) {
  const { requestHeaders, requesterIdirGuid, serviceUrl, serviceId } = getWebServiceInfo({ env });
  const xml = generateXML({ property, matchKey, serviceId, requesterIdirGuid }, 'getAccountDetail');

  try {
    const response = await axios.post(`${serviceUrl}/webservices/client/V10/BCeIDService.asmx?WSDL`, xml, {
      headers: requestHeaders,
      timeout: 10000
    });

    const { data: body } = response;

    const result = await parseStringSync(body);
    const data = _.get(result, 'soap:Envelope.soap:Body.0.getAccountDetailResponse.0.getAccountDetailResult.0');
    if (!data) throw Error('no data');

    const status = _.get(data, 'code.0');
    const failureCode = _.get(data, 'failureCode.0');
    const failMessage = _.get(data, 'message.0');
    if (status === 'Success' && failureCode === 'Void') {
      return 'exists';
    } else if (status === 'Failed' && failureCode === 'NoResults') {
      return 'notexists';
    } else {
      log(`${env}: [${status}][${failureCode}] ${property}: ${matchKey}: ${String(failMessage)})`);
    }
    return 'error';
  } catch (error) {
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

            if (deletedUserCount > MAX_DELETED_USERS_PER_RUNNER) break;
          } else continue;
        }
      }

      // each runner can process records up to 10000
      if (count < max || total === 10000) break;

      // max 50 users can be deleted by a runner at a time
      if (deletedUserCount > MAX_DELETED_USERS_PER_RUNNER) break;

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
