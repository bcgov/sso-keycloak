import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import * as csv from '@fast-csv/format';
import yargs from 'yargs/yargs';
import { createContainer } from 'container';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { fetchBceidUser } from 'helpers/webservice-bceid';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';

const basePath = path.join(__dirname, 'exports');

const argv = yargs(process.argv.slice(2))
  .options({
    env: { type: 'string', default: '' },
    realm: { type: 'string', default: '' },
    idps: { type: 'array', default: [] },
    concurrency: { type: 'number', default: 50 },
    totp: { type: 'string', default: '' },
    auto: { type: 'boolean', default: false },
  })
  .parseSync();

const { env, realm, idps, concurrency, totp, auto } = argv;

if (!env || !realm || !idps || idps.length === 0) {
  console.info(`
Export BCeID user data searched with 'BCeID username' value via Web Service.

Usages:
  yarn script migrations/export-bceid-users --env <env> --realm <realm> --idps <idps> --concurrency concurrency [--auto]
`);

  process.exit(1);
}

const container = createContainer({ env, totp, auto, allowed: ['dev', 'test', 'prod'] });
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
        'display_name',
        'bceid_user_guid',
        'bceid_username',
        'bceid_type',
        'bceid_business_guid',
        'bceid_business_name',
      ],
    });

    if (!fs.existsSync(basePath)) fs.mkdirSync(basePath);
    const writableStream = fs.createWriteStream(
      path.join(basePath, `bceid-export-${realm}-${env}-${idps.join('_')}-${new Date().getTime()}.csv`),
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
  if (!(idps as string[]).includes(identityProvider as string)) {
    return;
  }

  const details =
    (await fetchBceidUser({ accountType: 'Business', property: 'userId', matchKey: userName, env, logging: _.noop })) ||
    (await fetchBceidUser({ accountType: 'Individual', property: 'userId', matchKey: userName, env, logging: _.noop }));

  if (!details) {
    console.log(`not found in web service; user: ${username}`);
    csvStream.write({ realm_username: username, status: 'not found' });
    return;
  }

  csvStream.write({
    realm_username: username,
    status: 'found',
    email: details.email,
    display_name: details.displayName,
    bceid_user_guid: details.guid,
    bceid_username: details.userId,
    bceid_type: details.type,
    bceid_business_guid: details.businessGuid,
    bceid_business_name: details.businessLegalName,
  });
}
