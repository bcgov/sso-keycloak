import KcAdminClient from '@keycloak/keycloak-admin-client';
import dotenv from 'dotenv';
dotenv.config();

const { KEYCLOAK_USERNAME, KEYCLOAK_PASSWORD, BASE_KC_URL } = process.env;

async function main() {
  const client = new KcAdminClient({
    baseUrl: BASE_KC_URL,
    realmName: 'master',
  });

  await client.auth({
    username: KEYCLOAK_USERNAME,
    password: KEYCLOAK_PASSWORD,
    grantType: 'password',
    clientId: 'admin-cli',
  });

  const allRealms = await client.realms.find({});

  for (let realm of allRealms) {
    const realmName = realm.realm;
    console.log(`Checking for default role in realm ${realmName}...`);

    if (!realm.defaultRole || Array.isArray(realm.defaultRole)) throw new Error('default role malformed');
    if (realm.defaultRole.name !== `default-roles-${realmName}`) throw new Error('Unexpected default role name');

    const composites = await client.roles.getCompositeRoles({
      realm: realmName,
      id: realm.defaultRole.id,
    });

    const hasManageAccountInDefault = composites.find((role) => role.name === 'manage-account');
    if (hasManageAccountInDefault?.length > 1) throw new Error(`Extra management roles found for realm ${realmName}. Exiting`);

    if (hasManageAccountInDefault) {
      await client.roles.delCompositeRoles(
        {
          id: realm.defaultRole.id,
          realm: realmName,
        },
        [
          {
            id: hasManageAccountInDefault.id,
          },
        ],
      );
      console.log(`Deleted role from realm ${realmName}`);
    } else {
      console.log(`realm ${realmName} does not allow by default`);
    }
  }
}

main();
