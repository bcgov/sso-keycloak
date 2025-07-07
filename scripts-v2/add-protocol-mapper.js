import KcAdminClient from '@keycloak/keycloak-admin-client';
import dotenv from 'dotenv';
dotenv.config();

const { KEYCLOAK_USERNAME, KEYCLOAK_PASSWORD, BASE_KC_URL } = process.env;

async function main() {
  try {
    const kcAdminClient = new KcAdminClient({
      baseUrl: BASE_KC_URL,
      realmName: 'master',
    });

    await kcAdminClient.auth({
      username: KEYCLOAK_USERNAME,
      password: KEYCLOAK_PASSWORD,
      grantType: 'password',
      clientId: 'admin-cli',
    });

    const clients = await kcAdminClient.clients.find({
      realm: 'standard',
    });

    if (clients.length > 0) {
      for (const client of clients) {
        if (
          client.enabled &&
          client.description === 'CSS App Created' &&
          client.protocol === 'openid-connect' &&
          client.standardFlowEnabled
        ) {
          console.log(`Processing client ${client.name} (${client.clientId})`);

          const preferredUsernameMapper = client.protocolMappers?.find(
            (mapper) => mapper.name === 'preferred_username',
          );

          if (!preferredUsernameMapper) {
            await kcAdminClient.clients.addProtocolMapper(
              {
                id: client.id,
                realm: 'standard',
              },
              {
                name: 'preferred_username',
                protocol: 'openid-connect',
                protocolMapper: 'oidc-usermodel-property-mapper',
                config: {
                  'introspection.token.claim': 'true',
                  'claim.name': 'preferred_username',
                  'user.attribute': 'username',
                  'id.token.claim': 'true',
                  'access.token.claim': 'true',
                  'userinfo.token.claim': 'true',
                },
              },
            );
          }
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
}

main();
