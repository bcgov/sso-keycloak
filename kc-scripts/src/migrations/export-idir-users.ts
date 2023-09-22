import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import * as csv from '@fast-csv/format';
import yargs from 'yargs/yargs';
import { createContainer } from 'container';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { fetchIdirUser } from 'helpers/webservice-idir';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';

const basePath = path.join(__dirname, 'exports');

const argv = yargs(process.argv.slice(2))
  .options({
    env: { type: 'string', default: '' },
    realm: { type: 'string', default: '' },
    idp: { type: 'string', default: 'idir' },
    concurrency: { type: 'number', default: 100 },
    auto: { type: 'boolean', default: false },
  })
  .parseSync();

const { env, realm, idp, concurrency, auto } = argv;

if (!env || !realm || !idp) {
  console.info(`
Export IDIR user data searched with 'IDIR username' value via Web Service.

Usages:
  yarn script migrations/export-idir-users --env <env> --realm <realm> --idp <idp> --concurrency concurrency [--auto]
`);

  process.exit(1);
}

const container = createContainer({ env, auto, allowed: ['dev', 'test', 'prod'] });
container(async (adminClient?: KeycloakAdminClient) => {
  if (!adminClient) return;

  return new Promise(async (resolve) => {
    const max = concurrency;
    let first = 0;
    let total = 0;

    const csvStream = csv.format({
      headers: [
        'realm_username',
        'status',
        'email',
        'first_name',
        'last_name',
        'display_name',
        'idir_user_guid',
        'idir_username',
      ],
    });

    if (!fs.existsSync(basePath)) fs.mkdirSync(basePath);
    const writableStream = fs.createWriteStream(
      path.join(basePath, `idir-export-${realm}-${env}-${idp}-${new Date().getTime()}.csv`),
    );

    csvStream.pipe(writableStream).on('end', () => {
      console.log(`${total} users found`);
      resolve();
    });

    const _fetchData = fetchData.bind(null, adminClient, csvStream);

    while (true) {
      const users = await adminClient.users.find({ realm, first, max });
      const count = users.length;
      total += count;

      await Promise.all(users.map(_fetchData));

      if (count < max) {
        csvStream.end();
        break;
      }

      first = first + max;
    }
  });
});

async function fetchData(
  adminClient: KeycloakAdminClient,
  csvStream: csv.CsvFormatterStream<csv.Row, csv.Row>,
  user: UserRepresentation,
) {
  const { id, username } = user;

  const links = await adminClient.users.listFederatedIdentities({ realm, id: id as string });
  if (links.length === 0) {
    console.log(`no IDP links; user: ${username}`);
    return;
  }

  const { identityProvider, userId, userName } = links[0];
  if (identityProvider !== idp) {
    return;
  }

  const users = await fetchIdirUser({ property: 'userId', matchKey: userName, env });
  if (users.length === 0) {
    console.log(`not found in web service; user: ${username}`);
    csvStream.write({ realm_username: username, status: 'not found' });
    return;
  }

  const details = users[0];

  if (!details) {
    console.log(`not found in web service; user: ${username}`);
    csvStream.write({ realm_username: username, status: 'not found' });
    return;
  }

  csvStream.write({
    realm_username: username,
    status: 'found',
    email: details.email,
    first_name: details.firstName,
    last_name: details.lastName,
    display_name: details.displayName,
    idir_user_guid: details.guid,
    idir_username: details.userId,
  });
}
