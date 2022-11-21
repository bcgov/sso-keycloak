const axios = require('axios');
const jws = require('jws');
const KcAdminClient = require('keycloak-admin').default;
const { Octokit, App } = require('octokit');
const dotenv = require('dotenv');

dotenv.config();

const removeTrailingSlash = (url) => (url.endsWith('/') ? url.slice(0, -1) : url);

//get admin client using client credentials or admin user account
async function getKeycloakAdminClient(ocpCluster = 'silver', environment = 'dev', kcRealm, { totp = '' } = {}) {
  try {
    const cluster = ocpCluster.toUpperCase();
    const env = environment.toUpperCase();
    const config = {
      url: removeTrailingSlash(eval(`process.env.${cluster}_${env}_SSO_URL`)),
      clientId: eval(`process.env.${cluster}_${env}_CLIENT_ID`) || 'admin-cli',
      clientSecret: eval(`process.env.${cluster}_${env}_CLIENT_SECRET`),
      username: eval(`process.env.${cluster}_${env}_USERNAME`),
      password: eval(`process.env.${cluster}_${env}_PASSWORD`),
    };
    if (!config) throw Error(`invalid env ${env}`);

    const kcAdminClient = new KcAdminClient({
      baseUrl: `${config.url}/auth`,
      realmName: kcRealm,
      requestConfig: {
        /* Axios request config options https://github.com/axios/axios#request-config */
        timeout: 60000,
      },
    });

    let decodedToken;

    const auth = async () => {
      await kcAdminClient.auth({
        grantType: config.clientSecret ? 'client_credentials' : 'password',
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        username: config.username,
        password: config.password,
        totp,
      });

      decodedToken = jws.decode(kcAdminClient.accessToken);
    };

    const refreshAsNeeded = async () => {
      const expiresIn = decodedToken.payload.exp * 1000 - Date.now();
      console.log(expiresIn < 60 * 1000);
      if (expiresIn < 60 * 1000) await auth();
    };

    kcAdminClient.reauth = auth;
    kcAdminClient.refreshAsNeeded = refreshAsNeeded;

    await auth();
    return kcAdminClient;
  } catch (err) {
    console.log(ocpCluster, environment, err.response.data);
    return null;
  }
}

const getGitHubClient = () => {
  if (!process.env.GITHUB_PAT) throw Error('Github PAT required to create github client');
  return new Octokit({ auth: process.env.GITHUB_PAT });
};

module.exports = { getKeycloakAdminClient, getGitHubClient };
