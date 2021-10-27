import getConfig from 'next/config';
import KcAdminClient from 'keycloak-admin';

const { serverRuntimeConfig = {} } = getConfig() || {};
const { kc_url, kc_client_id, kc_client_secret } = serverRuntimeConfig;

let _kcAdminClient: any = null;
export async function getAdminClient() {
  try {
    if (_kcAdminClient) return _kcAdminClient as KcAdminClient;

    const kcAdminClient = new KcAdminClient({
      baseUrl: `${kc_url}/auth`,
      realmName: 'master',
      requestConfig: {
        /* Axios request config options https://github.com/axios/axios#request-config */
        timeout: 60000,
      },
    });

    await kcAdminClient.auth({
      grantType: 'client_credentials',
      clientId: kc_client_id,
      clientSecret: kc_client_secret,
    });

    _kcAdminClient = kcAdminClient;
    return kcAdminClient as KcAdminClient;
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function getIdirUser(idirUsername: string) {
  try {
    const kcAdminClient = await getAdminClient();
    if (!kcAdminClient) return null;

    const users = await kcAdminClient.users.find({
      realm: 'idir',
      username: idirUsername,
    });

    const user = users.find((user) => user.username === idirUsername);
    if (!user) return null;

    return user;
  } catch (err) {
    console.log(err);
    return null;
  }
}
