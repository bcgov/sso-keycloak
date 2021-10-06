const _ = require('lodash');
const dotenv = require('dotenv');
const KcAdminClient = require('keycloak-admin').default;

dotenv.config();

const envs = {
  dev: {
    url: process.env.DEV_KEYCLOAK_URL || 'https://dev.oidc.gov.bc.ca',
    clientId: process.env.DEV_KEYCLOAK_CLIENT_ID || 'admin-cli',
    clientSecret: process.env.DEV_KEYCLOAK_CLIENT_SECRET,
    username: process.env.DEV_KEYCLOAK_USERNAME,
    password: process.env.DEV_KEYCLOAK_PASSWORD,
  },
  test: {
    url: process.env.TEST_KEYCLOAK_URL || 'https://test.oidc.gov.bc.ca',
    clientId: process.env.TEST_KEYCLOAK_CLIENT_ID || 'admin-cli',
    clientSecret: process.env.TEST_KEYCLOAK_CLIENT_SECRET,
    username: process.env.TEST_KEYCLOAK_USERNAME,
    password: process.env.TEST_KEYCLOAK_PASSWORD,
  },
  prod: {
    url: process.env.PROD_KEYCLOAK_URL || 'https://oidc.gov.bc.ca',
    clientId: process.env.PROD_KEYCLOAK_CLIENT_ID || 'admin-cli',
    clientSecret: process.env.PROD_KEYCLOAK_CLIENT_SECRET,
    username: process.env.PROD_KEYCLOAK_USERNAME,
    password: process.env.PROD_KEYCLOAK_PASSWORD,
  },
};

async function getAdminClient(env = 'dev', { totp = '' } = {}) {
  try {
    const config = envs[env];
    if (!config) throw Error(`invalid env ${env}`);

    const kcAdminClient = new KcAdminClient({
      baseUrl: `${config.url}/auth`,
      realmName: 'master',
    });

    await kcAdminClient.auth({
      grantType: config.clientSecret ? 'client_credentials' : 'password',
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      username: config.username,
      password: config.password,
      totp,
    });

    return kcAdminClient;
  } catch (err) {
    console.log(err);
    return null;
  }
}

module.exports = { getAdminClient };
