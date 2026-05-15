import _ from 'lodash';
import yargs from 'yargs/yargs';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { createContainer } from 'container';
import fs from 'fs';
import path from 'path';

const argv = yargs(process.argv.slice(2))
  .options({
    env: { type: 'string', default: '' },
    realm: { type: 'string', default: 'standard' },
    start: { type: 'number', default: 0 },
    concurrency: { type: 'number', default: 50 },
    auto: { type: 'boolean', default: false },
  })
  .parseSync();

const { env, realm, auto } = argv;

if (!env || !realm) {
  console.info(`
Usages:
  yarn script scripts/keycloak-users/verify_users.ts --env <env> --realm <realm> [--auto]
`);

  process.exit(1);
}

if (!fs.existsSync(path.join(__dirname, 'users.json'))) {
  console.info('users.json file not found. Please provide a users.json file with the following format:');
  console.info(`
[
  {
    "idir_userid": "12345678",
    "idir_email": "test@example.com"
    },
  ]
`);
  process.exit(1);
}

const basePath = path.join(__dirname, 'exports');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf-8')) as {
  idir_userid: string;
  idir_email: string;
}[];

const container = createContainer({ env, auto, allowed: ['alpha', 'beta', 'gamma'] });
container(async (adminClient?: KeycloakAdminClient) => {
  if (!adminClient) return;

  const missingUsers: { idir_userid: string; idir_email: string }[] = [];

  for (const user of data) {
    console.log(`Processing user ${JSON.stringify(user)}`);
    const { idir_userid, idir_email } = user;

    const userFound = await adminClient.users.find({
      realm,
      username: `${idir_userid ? idir_userid.toLowerCase() + '@azureidir' : ''}`,
      email: idir_email,
    });
    if (!userFound || userFound.length === 0) {
      missingUsers.push(user);
    }
  }

  if (!fs.existsSync(basePath)) fs.mkdirSync(basePath);
  fs.writeFileSync(
    path.resolve(basePath, `missing-users-${new Date().getTime()}.json`),
    JSON.stringify(missingUsers, null, 2),
  );
});
