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
