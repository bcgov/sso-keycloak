import _ from 'lodash';
import axios from 'axios';
import prompts from 'prompts';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import { Octokit, App } from 'octokit';
import {
  DEV_KEYCLOAK_URL,
  DEV_KEYCLOAK_CLIENT_ID,
  DEV_KEYCLOAK_CLIENT_SECRET,
  DEV_KEYCLOAK_USERNAME,
  DEV_KEYCLOAK_PASSWORD,
  TEST_KEYCLOAK_URL,
  TEST_KEYCLOAK_CLIENT_ID,
  TEST_KEYCLOAK_CLIENT_SECRET,
  TEST_KEYCLOAK_USERNAME,
  TEST_KEYCLOAK_PASSWORD,
  PROD_KEYCLOAK_URL,
  PROD_KEYCLOAK_CLIENT_ID,
  PROD_KEYCLOAK_CLIENT_SECRET,
  PROD_KEYCLOAK_USERNAME,
  PROD_KEYCLOAK_PASSWORD,
  ALPHA_KEYCLOAK_URL,
  ALPHA_KEYCLOAK_CLIENT_ID,
  ALPHA_KEYCLOAK_CLIENT_SECRET,
  ALPHA_KEYCLOAK_USERNAME,
  ALPHA_KEYCLOAK_PASSWORD,
  BETA_KEYCLOAK_URL,
  BETA_KEYCLOAK_CLIENT_ID,
  BETA_KEYCLOAK_CLIENT_SECRET,
  BETA_KEYCLOAK_USERNAME,
  BETA_KEYCLOAK_PASSWORD,
  GAMMA_KEYCLOAK_URL,
  GAMMA_KEYCLOAK_CLIENT_ID,
  GAMMA_KEYCLOAK_CLIENT_SECRET,
  GAMMA_KEYCLOAK_USERNAME,
  GAMMA_KEYCLOAK_PASSWORD,
  GITHUB_PAT,
} from 'config';

const removeTrailingSlash = (url: string) => (url.endsWith('/') ? url.slice(0, -1) : url);

export type Env = 'dev' | 'test' | 'prod' | 'alpha' | 'beta' | 'gamma';

const envs = {
  dev: {
    url: removeTrailingSlash(DEV_KEYCLOAK_URL),
    clientId: DEV_KEYCLOAK_CLIENT_ID,
    clientSecret: DEV_KEYCLOAK_CLIENT_SECRET,
    username: DEV_KEYCLOAK_USERNAME,
    password: DEV_KEYCLOAK_PASSWORD,
  },
  test: {
    url: removeTrailingSlash(TEST_KEYCLOAK_URL),
    clientId: TEST_KEYCLOAK_CLIENT_ID,
    clientSecret: TEST_KEYCLOAK_CLIENT_SECRET,
    username: TEST_KEYCLOAK_USERNAME,
    password: TEST_KEYCLOAK_PASSWORD,
  },
  prod: {
    url: removeTrailingSlash(PROD_KEYCLOAK_URL),
    clientId: PROD_KEYCLOAK_CLIENT_ID,
    clientSecret: PROD_KEYCLOAK_CLIENT_SECRET,
    username: PROD_KEYCLOAK_USERNAME,
    password: PROD_KEYCLOAK_PASSWORD,
  },
  alpha: {
    url: removeTrailingSlash(ALPHA_KEYCLOAK_URL),
    clientId: ALPHA_KEYCLOAK_CLIENT_ID,
    clientSecret: ALPHA_KEYCLOAK_CLIENT_SECRET,
    username: ALPHA_KEYCLOAK_USERNAME,
    password: ALPHA_KEYCLOAK_PASSWORD,
  },
  beta: {
    url: removeTrailingSlash(BETA_KEYCLOAK_URL),
    clientId: BETA_KEYCLOAK_CLIENT_ID,
    clientSecret: BETA_KEYCLOAK_CLIENT_SECRET,
    username: BETA_KEYCLOAK_USERNAME,
    password: BETA_KEYCLOAK_PASSWORD,
  },
  gamma: {
    url: removeTrailingSlash(GAMMA_KEYCLOAK_URL),
    clientId: GAMMA_KEYCLOAK_CLIENT_ID,
    clientSecret: GAMMA_KEYCLOAK_CLIENT_SECRET,
    username: GAMMA_KEYCLOAK_USERNAME,
    password: GAMMA_KEYCLOAK_PASSWORD,
  },
};

export const getRealmUrl = (env: Env = 'dev', realm = 'master') => {
  try {
    const config = envs[env];
    if (!config) throw Error(`invalid env ${env}`);

    return `${config.url}/auth/realms/${realm}`;
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const getOidcConfiguration = async (env: Env = 'dev', realm = 'master') => {
  try {
    const realmUrl = getRealmUrl(env, realm);
    const configUrl = `${realmUrl}/.well-known/openid-configuration`;

    const { issuer, authorization_endpoint, token_endpoint, jwks_uri, userinfo_endpoint, end_session_endpoint } =
      await axios.get(configUrl).then((res) => res.data);

    return { issuer, authorization_endpoint, token_endpoint, jwks_uri, userinfo_endpoint, end_session_endpoint };
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const getAdminClient = async (env: Env = 'dev', { totp = '' } = {}) => {
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
    console.error(err);
    return;
  }
};

export const getGitHubClient = () => {
  return new Octokit({ auth: GITHUB_PAT });
};
