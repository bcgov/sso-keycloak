const KcAdminClient = require('keycloak-admin').default;
const jws = require('jws');
const { Client } = require('pg');
const axios = require('axios');

require('dotenv').config();

const removeTrailingSlash = (url) => {
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const envs = {
  dev: {
    url: removeTrailingSlash(process.env.DEV_KEYCLOAK_URL || 'https://dev.loginproxy.gov.bc.ca'),
    clientId: process.env.DEV_KEYCLOAK_CLIENT_ID || 'script-cli',
    clientSecret: process.env.DEV_KEYCLOAK_CLIENT_SECRET
  },
  test: {
    url: removeTrailingSlash(process.env.TEST_KEYCLOAK_URL || 'https://test.loginproxy.gov.bc.ca'),
    clientId: process.env.TEST_KEYCLOAK_CLIENT_ID || 'script-cli',
    clientSecret: process.env.TEST_KEYCLOAK_CLIENT_SECRET
  },
  prod: {
    url: removeTrailingSlash(process.env.PROD_KEYCLOAK_URL || 'https://loginproxy.gov.bc.ca'),
    clientId: process.env.PROD_KEYCLOAK_CLIENT_ID || 'script-cli',
    clientSecret: process.env.PROD_KEYCLOAK_CLIENT_SECRET
  }
};

module.exports = {
  oneMin: 60 * 1000,
  getAdminClient: async function (env) {
    try {
      const config = envs[env];
      if (!config) throw Error(`invalid env ${env}`);

      const kcAdminClient = new KcAdminClient({
        baseUrl: `${config.url}/auth`,
        realmName: 'master',
        requestConfig: {
          /* Axios request config options https://github.com/axios/axios#request-config */
          timeout: 60000
        }
      });

      let decodedToken;

      const auth = async () => {
        await kcAdminClient.auth({
          grantType: 'client_credentials',
          clientId: config.clientId,
          clientSecret: config.clientSecret
        });

        decodedToken = jws.decode(kcAdminClient.accessToken);
      };

      const refreshAsNeeded = async () => {
        const expiresIn = decodedToken.payload.exp * 1000 - Date.now();
        console.log(expiresIn < this.oneMin);
        if (expiresIn < this.oneMin) await auth();
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
  },
  log: function (msg) {
    console.log(`[${new Date().toLocaleString()}] ${msg}`);
  },
  getPgClient: function () {
    return new Client({
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432'),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'rhsso',
      ssl: { rejectUnauthorized: false }
    });
  },
  sendRcNotification: async function (cronName, message, err) {
    try {
      const headers = { Accept: 'application/json' };
      const statusCode = err ? 'ERROR' : '';
      await axios.post(process.env.RC_WEBHOOK, { projectName: cronName, message, statusCode }, { headers });
    } catch (err) {
      console.error(err);
    }
  },
  handleError: function (error) {
    if (error.isAxiosError) {
      console.error((error.response && error.response.data) || error);
    } else {
      console.error(error);
    }
  },
  deleteLegacyData: async function (tableName, retentionPeriodDays) {
    console.info('Removing old logs from database...');
    let client;
    try {
      client = module.exports.getPgClient();
      await client.connect();
      const query = `DELETE from ${tableName} where timestamp < NOW() - INTERVAL '${retentionPeriodDays} DAYS';`;
      console.info(`Running delete query: ${query}`);
      await client.query(query);
      console.info('Completed running delete query');
    } catch (e) {
      console.error(e);
    } finally {
      await client.end();
    }
  }
};
