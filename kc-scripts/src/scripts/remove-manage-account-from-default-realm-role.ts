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
Removes the manage-account role from the default realm roles.

Usages:
  yarn script scripts/remove-manage-account-from-default-realm-role --env <env> --realm <realm> [--auto]
`);

  process.exit(1);
}

const container = createContainer({ env, auto, allowed: ['alpha', 'beta', 'gamma'] });
container(async (adminClient?: KeycloakAdminClient) => {
  if (!adminClient) return;

  const allRealms = await adminClient.realms.find({});

  for (let realm of allRealms) {
    const realmName = realm.realm;
    console.log(`Checking for default role in realm ${realmName}...`);

    if (!realm.defaultRole || Array.isArray(realm.defaultRole)) throw new Error('default role malformed');
    if (realm.defaultRole.name !== `default-roles-${realmName}`) throw new Error('Unexpected default role name');

    const composites = await adminClient.roles.getCompositeRoles({
      realm: realmName,
      id: realm.defaultRole.id!,
    });

    const hasManageAccountInDefault = composites.find((role) => role.name === 'manage-account');

    if (hasManageAccountInDefault) {
      await adminClient.roles.delCompositeRoles(
        {
          id: realm.defaultRole.id!,
          realm: realmName,
        },
        [
          {
            id: hasManageAccountInDefault.id!,
          },
        ],
      );
      console.log(`Deleted role from realm ${realmName}`);
    } else {
      console.log(`realm ${realmName} does not allow by default`);
    }
  }
});
