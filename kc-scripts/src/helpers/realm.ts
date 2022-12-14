import KeycloakAdminClient from '@keycloak/keycloak-admin-client';

export async function getIdpToUpstreamRealmMap(adminClient: KeycloakAdminClient, realm: string) {
  // @ts-ignore
  const idps = await adminClient.identityProviders.find({ realm });
  const result: { [key: string]: string } = {};

  for (let x = 0; x < idps.length; x++) {
    const authUrl = idps[x]?.config?.authorizationUrl || '';
    const re = /https:\/\/.+\/auth\/realms\/(.+)\/protocol\/openid-connect\/auth.*/i;
    const found = authUrl.match(re);
    const alias = idps[x]?.alias || '';
    if (found.length > 0 && alias) {
      result[alias] = found[1];
    }
  }

  return result;
}

export function getRealmNameFromLoginUrl(url: string) {
  const re = /https:\/\/.+\/auth\/admin\/(.+)\/console.*/i;
  const found = url.match(re);
  if (found && found.length > 0) {
    return found[1];
  }

  return '';
}

export function getEnvFromLoginUrl(url: string) {
  return url.startsWith('https://dev') ? 'dev' : url.startsWith('https://test') ? 'test' : 'prod';
}

export function getUserEnvFromLoginUrl(url: string) {
  const env = getEnvFromLoginUrl(url);

  if (url.includes('loginproxy')) {
    return env;
  }

  return env === 'prod' ? 'prod' : 'test';
}

export function getClientEnvFromLoginUrl(url: string) {
  const env = getEnvFromLoginUrl(url);

  if (url.includes('loginproxy')) {
    return env === 'dev' ? 'alpha' : env === 'test' ? 'beta' : 'gamma';
  }

  return env;
}
