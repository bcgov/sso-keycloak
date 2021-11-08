import getConfig from 'next/config';
import KcAdminClient from 'keycloak-admin';

const { serverRuntimeConfig = {} } = getConfig() || {};
const { kc_url, kc_client_id, kc_client_secret } = serverRuntimeConfig;

export async function getAdminClient() {
  try {
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

    return kcAdminClient as KcAdminClient;
  } catch (err) {
    console.error(err);
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

    const user = users.find((user) => user.username?.toLowerCase() === idirUsername?.toLowerCase());
    if (!user) return null;

    return user;
  } catch (err) {
    console.error(err);
    return null;
  }
}

const _cachedNames: any = {};
export async function getIdirUserName(idirUsername: string) {
  try {
    if (_cachedNames[idirUsername]) return _cachedNames[idirUsername];
    const user = await getIdirUser(idirUsername);
    if (!user) return null;

    const name = `${user.firstName} ${user.lastName}`;
    _cachedNames[idirUsername] = name;
    return name;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function getIDPs(realm: string) {
  try {
    const kcAdminClient = await getAdminClient();
    if (!kcAdminClient) return null;

    const idps = await kcAdminClient.identityProviders.find({ realm } as any);

    return idps;
  } catch (err) {
    console.error(err);
    return null;
  }
}

const _cachedIDPNames: any = {};
export async function getIDPNames(realm: string) {
  try {
    if (_cachedIDPNames[realm]) return _cachedIDPNames[realm];
    const idps = await getIDPs(realm);
    if (!idps) return null;

    const names = idps.map((idp) => idp.displayName || idp.alias);
    _cachedIDPNames[realm] = names;
    return names;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function getRealm(realm: string) {
  try {
    const kcAdminClient = await getAdminClient();
    if (!kcAdminClient) return null;

    const realmData = await kcAdminClient.realms.findOne({ realm } as any);

    return realmData;
  } catch (err) {
    console.error(err);
    return null;
  }
}
