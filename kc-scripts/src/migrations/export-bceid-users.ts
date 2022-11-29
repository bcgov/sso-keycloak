import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import * as csv from '@fast-csv/format';
import yargs from 'yargs/yargs';
import { createContainer } from 'container';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { fetchBceidUser } from 'helpers/webservice-bceid';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';

const argv = yargs(process.argv.slice(2))
  .options({
    env: { type: 'string', default: '' },
    realm: { type: 'string', default: '' },
    idp: { type: 'string', default: '' },
    concurrency: { type: 'number', default: 50 },
    auto: { type: 'boolean', default: false },
  })
  .parseSync();

const { env, realm, idp, concurrency, auto } = argv;

if (!env || !realm || !idp) {
  console.info(`
Export BCeID user data searched with 'BCeID username' value via Web Service.

Usages:
  yarn script migrations/export-bceid-users --env <env> --realm <realm> --idp <idp> --concurrency concurrency [--auto]
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

    const csvStream = csv.format({ headers: true });
    const writableStream = fs.createWriteStream(
      path.join(__dirname, `bceid-export-${realm}-${env}-${idp}-${new Date().getTime()}.csv`),
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
    console.log(`no target IDP; user: ${username}`);
    return;
  }

  const details =
    (await fetchBceidUser({ accountType: 'Business', property: 'userId', matchKey: userName, env })) ||
    (await fetchBceidUser({ accountType: 'Individual', property: 'userId', matchKey: userName, env }));

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
