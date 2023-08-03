const _ = require('lodash');
const { Client } = require('pg');
const format = require('pg-format');
const KcAdminClient = require('keycloak-admin').default;
const { promisify } = require('util');
const { parseString } = require('xml2js');
const jws = require('jws');
const soapRequest = require('easy-soap-request');
const async = require('async');
const axios = require('axios');

require('dotenv').config();

const removeTrailingSlash = (url) => (url.endsWith('/') ? url.slice(0, -1) : url);

const envs = {
  dev: {
    url: removeTrailingSlash(process.env.DEV_KEYCLOAK_URL || 'https://dev.loginproxy.gov.bc.ca'),
    clientId: process.env.DEV_KEYCLOAK_CLIENT_ID || 'script-cli',
    clientSecret: process.env.DEV_KEYCLOAK_CLIENT_SECRET,
  },
  test: {
    url: removeTrailingSlash(process.env.TEST_KEYCLOAK_URL || 'https://test.loginproxy.gov.bc.ca'),
    clientId: process.env.TEST_KEYCLOAK_CLIENT_ID || 'script-cli',
    clientSecret: process.env.TEST_KEYCLOAK_CLIENT_SECRET,
  },
  prod: {
    url: removeTrailingSlash(process.env.PROD_KEYCLOAK_URL || 'https://loginproxy.gov.bc.ca'),
    clientId: process.env.PROD_KEYCLOAK_CLIENT_ID || 'script-cli',
    clientSecret: process.env.PROD_KEYCLOAK_CLIENT_SECRET,
  },
};

const ONE_MIN = 60 * 1000;

const log = (msg) => console.log(`[${new Date().toLocaleString()}] ${msg}`);

const getPgClient = () => {
  return new Client({
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    //ssl: { rejectUnauthorized: false },
  });
};

const parseStringSync = promisify(parseString);

const parseAccount = (data) => {
  const guid = _.get(data, 'guid.0.value.0');
  const userId = _.get(data, 'userId.0.value.0');
  const displayName = _.get(data, 'displayName.0.value.0');

  const baseContact = _.get(data, 'contact.0');
  const contact = {
    email: _.get(baseContact, 'email.0.value.0'),
    telephone: _.get(baseContact, 'telephone.0.value.0'),
    preference: _.get(baseContact, 'preference.0.value.0'),
  };

  const baseIndividualIdentity = _.get(data, 'individualIdentity.0');
  const baseName = _.get(baseIndividualIdentity, 'name.0');

  const individualIdentity = {
    name: {
      firstname: _.get(baseName, 'firstname.0.value.0'),
      middleName: _.get(baseName, 'middleName.0.value.0'),
      otherMiddleName: _.get(baseName, 'otherMiddleName.0.value.0'),
      surname: _.get(baseName, 'surname.0.value.0'),
      initials: _.get(baseName, 'initials.0.value.0'),
    },
    dateOfBirth: _.get(baseIndividualIdentity, 'dateOfBirth.0.value.0'),
  };

  const baseInternalIdentity = _.get(data, 'internalIdentity.0');
  const internalIdentity = {
    title: _.get(baseInternalIdentity, 'title.0.value.0'),
    company: _.get(baseInternalIdentity, 'company.0.value.0'),
    organizationCode: _.get(baseInternalIdentity, 'organizationCode.0.value.0'),
    department: _.get(baseInternalIdentity, 'department.0.value.0'),
    office: _.get(baseInternalIdentity, 'office.0.value.0'),
    description: _.get(baseInternalIdentity, 'description.0.value.0'),
    employeeId: _.get(baseInternalIdentity, 'employeeId.0.value.0'),
  };

  return {
    guid,
    userId,
    displayName,
    email: contact.email,
    firstName: individualIdentity.name.firstname,
    lastName: individualIdentity.name.surname,
  };
};

function getWebServiceInfo({ env = 'dev' }) {
  const requestHeaders = {
    'Content-Type': 'text/xml;charset=UTF-8',
    authorization: `Basic ${process.env.BCEID_SERVICE_BASIC_AUTH}`,
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
    serviceUrl = 'https://gws2.test.bceid.ca';
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
    limit = 1,
  },
  requestType = 'searchInternalAccount',
) => {
  if (requestType === 'getAccountDetail')
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
  else
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
};

async function checkUserExistsAtIDIM({ property = 'userGuid', matchKey = '', env = 'prod' }) {
  const { requestHeaders, requesterIdirGuid, serviceUrl, serviceId } = getWebServiceInfo({ env });
  const xml = generateXML({ property, matchKey, serviceId, requesterIdirGuid }, 'getAccountDetail');

  try {
    const response = await axios.post(`${serviceUrl}/webservices/client/V10/BCeIDService.asmx?WSDL`, xml, {
      headers: requestHeaders,
      timeout: 10000,
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

function handleError(error) {
  if (error.isAxiosError) {
    console.error((error.response && error.response.data) || error);
  } else {
    console.error(error);
  }
}

async function getUserRolesMappings(adminClient, userId) {
  try {
    const clientRoles = [];
    const roleMappings = await adminClient.users.listRoleMappings({ realm: 'standard', id: userId });
    const realmRoles = roleMappings.realmMappings ? roleMappings.realmMappings.map((map) => map.name) : [];
    if (roleMappings.clientMappings) {
      for (let map in roleMappings.clientMappings) {
        clientRoles.push({
          client: roleMappings.clientMappings[map].client,
          roles: roleMappings.clientMappings[map].mappings.map((role) => role.name),
        });
      }
    }
    return { realmRoles, clientRoles };
  } catch (err) {
    console.error(err);
    throw new Error(`cannot fetch roles of user ${userId}`);
  }
}

async function getAdminClient(env = 'dev') {
  try {
    const config = envs[env];
    if (!config) throw Error(`invalid env ${env}`);

    const kcAdminClient = new KcAdminClient({
      baseUrl: `${config.url}/auth`,
      realmName: 'master',
      requestConfig: {
        /* Axios request config options https://github.com/axios/axios#request-config */
        timeout: 60000,
      },
    });

    let decodedToken;

    const auth = async () => {
      await kcAdminClient.auth({
        grantType: 'client_credentials',
        clientId: config.clientId,
        clientSecret: config.clientSecret,
      });

      decodedToken = jws.decode(kcAdminClient.accessToken);
    };

    const refreshAsNeeded = async () => {
      const expiresIn = decodedToken.payload.exp * 1000 - Date.now();
      log(expiresIn < ONE_MIN);
      if (expiresIn < ONE_MIN) await auth();
    };

    kcAdminClient.reauth = auth;
    kcAdminClient.refreshAsNeeded = refreshAsNeeded;
    kcAdminClient.url = config.url;

    await auth();
    return kcAdminClient;
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function removeUserFromCssApp(userData, clientData) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: process.env.CSS_API_AUTH_SECRET,
    };
    userData.clientData = clientData;
    const res = await axios.post(`${process.env.CSS_API_URL}/delete-inactive-idir-users`, userData, { headers });
    return res.status === 200 ? true : false;
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
        const idir_user_guid = String(users[x]?.attributes?.idir_user_guid || '').toLowerCase();
        if (!idir_user_guid) continue;
        const displayName = String(users[x]?.attributes?.display_name || '').toLowerCase();
        // ignore the users with `hold` in their displayname
        if (displayName && displayName.startsWith('hold -')) continue;
        log(`[${runnerName}] processing user ${username}`);
        if (username.includes('@idir')) {
          const userExistsAtWb = await checkUserExistsAtIDIM({ property: 'userGuid', matchKey: idir_user_guid, env });
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
              userDeletedAtCss,
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
    callback(err);
  } finally {
    await pgClient.end();
  }
}

async function sendRcNotification(message, err) {
  try {
    const headers = { Accept: 'application/json' };
    const statusCode = err ? 'ERROR' : '';
    await axios.post(
      process.env.RC_WEBHOOK,
      { projectName: 'cron-remove-inactive-users', message, statusCode },
      { headers },
    );
  } catch (err) {
    console.error(err);
  }
}

function main() {
  async.parallel(
    [
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
      },
    ],
    async function (err, results) {
      if (err) {
        console.error(err.message);
        await sendRcNotification('**Failed to remove inactive users** \n\n' + err.message, true);
      } else {
        const a = results.map((res) => JSON.stringify(res));
        await sendRcNotification('**Successfully removed inactive users** \n\n' + a.join('\n\n'), false);
      }
    },
  );
}

main();
