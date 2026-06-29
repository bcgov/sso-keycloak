import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { createContainer } from '../container';
import yargs from 'yargs/yargs';

const argv = yargs(process.argv.slice(2))
  .options({
    env: { type: 'string', default: '' },
    realm: { type: 'string', default: 'standard' },
    auto: { type: 'boolean', default: false },
  })
  .parseSync();

const { env, realm, auto } = argv;

if (!env || !realm) {
  console.info(`
Adds the preferred_username protocol mapper to all clients in the specified realm.

Usages:
  yarn script scripts/add-protocol-mapper --env <env> --realm <realm> [--auto]
`);

  process.exit(1);
}

const container = createContainer({ env, auto, allowed: ['alpha', 'beta', 'gamma'] });
container(async (adminClient?: KeycloakAdminClient) => {
  if (!adminClient) return;
  try {
    const clients = await adminClient.clients.find({
      realm,
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
            await adminClient.clients.addProtocolMapper(
              {
                id: client?.id || '',
                realm,
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
});
