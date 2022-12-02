import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import yargs from 'yargs/yargs';
import { createContainer } from 'container';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { migrateIdirUsers } from './helpers/migrate-idir-users';
import { migrateBceidUsers } from './helpers/migrate-bceid-users';
import {
  buildGroupRoleMappings,
  buildUserRolesMap,
  matchTargetUsers,
  createClientRoles,
  createCompositeRoles,
  createTargetUserRoleBindings,
} from 'helpers/groups-roles-users';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';

const basePath = path.join(__dirname, 'exports');

const argv = yargs(process.argv.slice(2))
  .options({
    baseEnv: { type: 'string', default: '' },
    baseRealm: { type: 'string', default: 'mds' },
    targetEnv: { type: 'string', default: '' },
    targetRealm: { type: 'string', default: 'standard' },
    targetClient: { type: 'string', default: '' },
    contextEnv: { type: 'string', default: '' },
    totp: { type: 'string', default: '' },
    auto: { type: 'boolean', default: false },
  })
  .parseSync();

const { baseEnv, baseRealm, targetEnv, targetRealm, targetClient, contextEnv, totp, auto } = argv;

if (!baseEnv || !baseRealm || !targetEnv || !targetClient || !contextEnv) {
  console.info(`
Usage:
  yarn script migrations/mds --base-env <env> --base-realm <realm> --target-env <env> --context-env <env> --target-client <client> [--target-realm <realm>] [--totp <totp>] [--auto]

Flags:
  --base-env             Base Keycloak environment to migrate users from
  --base-realm           Base realm of the base Keycloak environment to migrate users from
  --target-env           Target Keycloak environment to migrate users to
  --target-realm         Target realm of the target Keycloak environment to migrate users to; Optional, default to 'standard'
  --context-env          Contextual Keycloak environment; used to fetch BCeID users from BCeID web service
  --target-client        Target client of the target realm to migrate users with the associated client roles.
  --totp                 Time-based One-time Password (TOTP) passed into the Keycloak auth call of the base environment; Optional
  --auto                 Skips the confirmation before running the script
`);

  process.exit(1);
}

const rolesToExclude = ['admin', 'uma_authorization', 'offline_access'];

const idpToRealmMap: { [key: string]: string } = {
  idir: 'idir',
  bceid: '_bceid',
};

const suffixMap: { [key: string]: string } = {
  idir: 'idir',
  bceid: 'bceidboth',
};

const container = createContainer({ env: baseEnv, auto, totp }, { env: targetEnv, auto });
container(async (baseAdminClient?: KeycloakAdminClient, targetAdminClient?: KeycloakAdminClient) => {
  if (!baseAdminClient || !targetAdminClient) return;

  // see if the target client exists first
  const clients = await targetAdminClient.clients.find({ realm: targetRealm, clientId: targetClient, max: 1 });
  if (clients.length === 0) throw Error('client not found');

  const client = clients[0];
  const clientId = client.id as string;

  console.log('Step 1: build the role associations');
  const { roleMappings, mergedRoleMappings } = await buildGroupRoleMappings(baseAdminClient, {
    realm: baseRealm,
    excludes: rolesToExclude,
  });

  console.log('Step 2: collect the base user & role mappings');
  const baseUserRolesMap = await buildUserRolesMap(baseAdminClient, {
    realm: baseRealm,
    roleMappings,
  });

  const baseUsers = Object.values(baseUserRolesMap);

  console.log('Step 3: find the matching Gold standard users');
  let userReport: { [key: string]: any } = {};

  const generateUserReport = async () => {
    userReport = await matchTargetUsers(baseAdminClient, targetAdminClient, {
      baseRealm,
      targetRealm: 'standard',
      baseUsers,
      getBaseParentRealmName: (identityProvider: string) => idpToRealmMap[identityProvider],
      getTargetUserUsername: (buserGuid: string, identityProvider: string) =>
        `${buserGuid}@${suffixMap[identityProvider]}`,
    });
  };

  await generateUserReport();

  console.log('Step 4: migrate missing IDIR users');
  let idirImports: any = {};
  if (userReport['not-found-idir-parent']) {
    idirImports = await migrateIdirUsers(
      baseAdminClient,
      targetAdminClient,
      userReport['not-found-idir-parent'],
      contextEnv,
    );
  }

  let bceidImports: any = {};
  console.log('Step 5: migrate missing BCeID Both users');
  if (userReport['not-found-bceid-parent']) {
    bceidImports = await migrateBceidUsers(
      baseAdminClient,
      targetAdminClient,
      userReport['not-found-bceid-parent'],
      contextEnv,
    );
  }

  console.log('Step 6: re-match Gold standard users after migrating missing users');
  await generateUserReport();

  const validBaseTargetUsers = userReport['valid-base-target-users'];
  delete userReport['valid-base-target-users'];

  console.log('Step 7: create client level roles in the target realm');
  const targetRolesMap = await createClientRoles(targetAdminClient, {
    realm: targetRealm,
    clientId,
    roleMappings: mergedRoleMappings,
  });

  console.log('Step 8: create composite role mappings in the target realm');
  await createCompositeRoles(targetAdminClient, { realm: targetRealm, clientId, roleMappings: mergedRoleMappings });

  console.log('Step 9: create user role mappings in the target realm');
  await createTargetUserRoleBindings(targetAdminClient, {
    realm: targetRealm,
    client,
    userRolesMap: baseUserRolesMap,
    rolesMap: targetRolesMap,
    baseTargetUserIds: validBaseTargetUsers,
  });

  let userRoles: any = _.mapKeys(baseUserRolesMap, (val) => val.username);
  userRoles = _.mapValues(userRoles, (val) => val.roles);

  if (!fs.existsSync(basePath)) fs.mkdirSync(basePath);
  fs.writeFileSync(
    path.resolve(basePath, `mds-${baseEnv}-${new Date().getTime()}.json`),
    JSON.stringify({ mergedRoleMappings, userReport, userRoles, idirImports, bceidImports }, null, 2),
  );
});
