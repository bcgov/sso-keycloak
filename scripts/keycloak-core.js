const _ = require('lodash');
const axios = require('axios');
const dotenv = require('dotenv');
const KcAdminClient = require('keycloak-admin').default;

dotenv.config();

const removeTrailingSlash = (url) => (url.endsWith('/') ? url.slice(0, -1) : url);

const envs = {
  dev: {
    url: removeTrailingSlash(process.env.DEV_KEYCLOAK_URL || 'https://dev.oidc.gov.bc.ca'),
    clientId: process.env.DEV_KEYCLOAK_CLIENT_ID || 'admin-cli',
    clientSecret: process.env.DEV_KEYCLOAK_CLIENT_SECRET,
    username: process.env.DEV_KEYCLOAK_USERNAME,
    password: process.env.DEV_KEYCLOAK_PASSWORD,
  },
  test: {
    url: removeTrailingSlash(process.env.TEST_KEYCLOAK_URL || 'https://test.oidc.gov.bc.ca'),
    clientId: process.env.TEST_KEYCLOAK_CLIENT_ID || 'admin-cli',
    clientSecret: process.env.TEST_KEYCLOAK_CLIENT_SECRET,
    username: process.env.TEST_KEYCLOAK_USERNAME,
    password: process.env.TEST_KEYCLOAK_PASSWORD,
  },
  prod: {
    url: removeTrailingSlash(process.env.PROD_KEYCLOAK_URL || 'https://oidc.gov.bc.ca'),
    clientId: process.env.PROD_KEYCLOAK_CLIENT_ID || 'admin-cli',
    clientSecret: process.env.PROD_KEYCLOAK_CLIENT_SECRET,
    username: process.env.PROD_KEYCLOAK_USERNAME,
    password: process.env.PROD_KEYCLOAK_PASSWORD,
  },
  target: {
    url: removeTrailingSlash(process.env.TARGET_KEYCLOAK_URL),
    clientId: process.env.TARGET_KEYCLOAK_CLIENT_ID || 'admin-cli',
    clientSecret: process.env.TARGET_KEYCLOAK_CLIENT_SECRET,
    username: process.env.TARGET_KEYCLOAK_USERNAME,
    password: process.env.TARGET_KEYCLOAK_PASSWORD,
  },
};

function getRealmUrl(env = 'dev', realm = 'master') {
  try {
    const config = envs[env];
    if (!config) throw Error(`invalid env ${env}`);

    return `${config.url}/auth/realms/${realm}`;
  } catch (err) {
    console.log(err);
    return null;
  }
}

async function getOidcConfiguration(env = 'dev', realm = 'master') {
  try {
    const realmUrl = getRealmUrl(env, realm);
    const configUrl = `${realmUrl}/.well-known/openid-configuration`;

    const { issuer, authorization_endpoint, token_endpoint, jwks_uri, userinfo_endpoint, end_session_endpoint } =
      await axios.get(configUrl).then((res) => res.data);

    return { issuer, authorization_endpoint, token_endpoint, jwks_uri, userinfo_endpoint, end_session_endpoint };
  } catch (err) {
    console.log(err);
    return null;
  }
}

async function getAdminClient(env = 'dev', { totp = '' } = {}) {
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

    const auth = async () => {
      await kcAdminClient.auth({
        grantType: config.clientSecret ? 'client_credentials' : 'password',
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        username: config.username,
        password: config.password,
        totp,
      });
    };

    kcAdminClient.reauth = auth;

    await auth();
    return kcAdminClient;
  } catch (err) {
    console.log(err);
    return null;
  }
}

module.exports = { getAdminClient, getRealmUrl, getOidcConfiguration };
