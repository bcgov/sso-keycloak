import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import yargs from 'yargs/yargs';
import { createContainer } from 'container';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { migrateBceidUsers } from './helpers/migrate-bceid-users';
import { readTextFile } from './helpers/util';
import { assignUserToRealmRole, matchTargetUsers } from 'helpers/groups-roles-users';
import { migrateIdirUsers } from './helpers/migrate-idir-users';

const basePath = path.join(__dirname, 'exports');

const argv = yargs(process.argv.slice(2))
  .options({
    baseEnv: { type: 'string', default: '' },
    baseRealm: { type: 'string', default: '' },
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
  yarn script migrations/mds --base-env <env> --base-realm <realm> --target-env <env> --context-env <env> [--target-realm <realm>] [--totp <totp>] [--auto]

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

const container = createContainer({ env: baseEnv, auto: true, totp }, { env: targetEnv, auto: true });

container(async (baseAdminClient?: KeycloakAdminClient, targetAdminClient?: KeycloakAdminClient) => {
  if (!baseAdminClient || !targetAdminClient) return;

  // see if the target client exists first
  const clients = await targetAdminClient.clients.find({ realm: targetRealm, clientId: targetClient, max: 1 });
  if (clients.length === 0) throw Error('client not found');

  const client = clients[0];
  const clientId = client.id as string;

  let userReport: any = {};
  let bceidImports: any = {};
  let idirImports: any = {};

  console.log('fetch base user list');
  const total = await baseAdminClient.users.count({ realm: baseRealm });
  const max = 500;
  let start = 0;
  for (let i = 0; i < Math.ceil(total / max); i++) {
    let userList = await baseAdminClient.users.find({
      realm: baseRealm,
      first: start,
      max,
    });
    userReport[i] = await matchTargetUsers(baseAdminClient, targetAdminClient, {
      baseRealm,
      targetRealm,
      baseUsers: userList,
    });

    console.log('migrate missing IDIR users');
    if (userReport[i]['not-found-idir-parent']) {
      idirImports[i] = await migrateIdirUsers(
        baseAdminClient,
        targetAdminClient,
        userReport[i]['not-found-idir-parent'],
        contextEnv,
      );
    }

    console.log('migrate missing BCeID Both users');
    if (userReport[i]['not-found-bceid-parent']) {
      bceidImports[i] = await migrateBceidUsers(
        baseAdminClient,
        targetAdminClient,
        userReport[i]['not-found-bceid-parent'],
        contextEnv,
      );
    }

    console.log('re-match Gold standard users after migrating missing users');
    userReport[i] = await matchTargetUsers(baseAdminClient, targetAdminClient, {
      baseRealm,
      targetRealm,
      baseUsers: userList,
    });

    let validBaseTargetUsers = userReport[i]['valid-base-target-users'];
    delete userReport[i]['valid-base-target-users'];

    console.log('assign integration level realm role to users for enabling search in css app');
    for (let x = 0; x < validBaseTargetUsers.length; x++) {
      await assignUserToRealmRole(targetAdminClient, {
        realm: targetRealm,
        userId: validBaseTargetUsers[x].targetUserId,
        roleName: `client-${targetClient}`,
      });
    }

    start = start + max;
  }

  if (!fs.existsSync(basePath)) fs.mkdirSync(basePath);
  fs.writeFileSync(
    path.resolve(basePath, `${baseRealm}-${baseEnv}-${new Date().getTime()}.json`),
    JSON.stringify({ userReport, bceidImports, idirImports }, null, 2),
  );
});
