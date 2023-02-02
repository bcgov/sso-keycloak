import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import yargs from 'yargs/yargs';
import { createContainer } from 'container';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { migrateBceidUsers } from './helpers/migrate-bceid-users';
import { readTextFile } from './helpers/util';
import { matchTargetUsers } from 'helpers/groups-roles-users';
import { migrateIdirUsers } from './helpers/migrate-idir-users';

const basePath = path.join(__dirname, 'exports');

const argv = yargs(process.argv.slice(2))
  .options({
    baseEnv: { type: 'string', default: '' },
    baseRealm: { type: 'string', default: '' },
    targetEnv: { type: 'string', default: '' },
    targetRealm: { type: 'string', default: 'standard' },
    contextEnv: { type: 'string', default: '' },
    totp: { type: 'string', default: '' },
    auto: { type: 'boolean', default: false },
  })
  .parseSync();

const { baseEnv, baseRealm, targetEnv, targetRealm, contextEnv, totp, auto } = argv;

if (!baseEnv || !baseRealm || !targetEnv || !contextEnv) {
  console.info(`
Usage:
  yarn script migrations/mds --base-env <env> --base-realm <realm> --target-env <env> --context-env <env> [--target-realm <realm>] [--totp <totp>] [--auto]

Flags:
  --base-env             Base Keycloak environment to migrate users from
  --base-realm           Base realm of the base Keycloak environment to migrate users from
  --target-env           Target Keycloak environment to migrate users to
  --target-realm         Target realm of the target Keycloak environment to migrate users to; Optional, default to 'standard'
  --context-env          Contextual Keycloak environment; used to fetch BCeID users from BCeID web service
  --totp                 Time-based One-time Password (TOTP) passed into the Keycloak auth call of the base environment; Optional
  --auto                 Skips the confirmation before running the script
`);

  process.exit(1);
}

const rolesToExclude = ['admin', 'uma_authorization', 'offline_access'];

const container = createContainer({ env: 'prod', auto: true, totp }, { env: 'gamma', auto: true });

container(async (baseAdminClient?: KeycloakAdminClient, targetAdminClient?: KeycloakAdminClient) => {
  if (!baseAdminClient || !targetAdminClient) return;

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

    start = start + max;
  }

  if (!fs.existsSync(basePath)) fs.mkdirSync(basePath);
  fs.writeFileSync(
    path.resolve(basePath, `${baseRealm}-${baseEnv}-${new Date().getTime()}.json`),
    JSON.stringify({ userReport, bceidImports, idirImports }, null, 2),
  );
});
