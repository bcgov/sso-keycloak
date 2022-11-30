const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const csv = require('fast-csv');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('../keycloak-core');
const { handleError, ignoreError } = require('../helpers');
const { fetchBceidUser } = require('./helpers/migrate-target-bceidboth-users');
const { env, realm, idp, auto } = argv;

const fetchData = async (adminClient, csvStream, user) => {
  const { id, username } = user;

  const links = await adminClient.users.listFederatedIdentities({ realm, id });
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
};

async function main() {
  if (!env || !realm || !idp || !['dev', 'test', 'prod'].includes(env)) {
    console.info(`
Export BCeID user data searched with 'BCeID username' value via Web Service.

Usages:
  node migrations/export-bceid-users --env <env> --realm <realm> --idp <idp> [--auto]
`);

    return;
  }

  try {
    const adminClient = await getAdminClient(env);
    if (!adminClient) return;

    if (!auto) {
      const prompt = new Confirm(`Are you sure to proceed in ${adminClient.url}?`);
      const answer = await prompt.run();
      if (!answer) return;
    }

    const starttime = new Date().getTime();
    const max = 50;
    let first = 0;
    let total = 0;

    const csvStream = csv.format({ headers: true });
    const writableStream = fs.createWriteStream(
      path.join(__dirname, `bceid-export-${realm}-${env}-${idp}-${starttime}.csv`),
    );

    csvStream.pipe(writableStream).on('end', () => {
      const endtime = new Date().getTime();
      console.log(`${total} users found`);
      console.log(`took ${(endtime - starttime) / 1000} sec.`);

      process.exit(0);
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
  } catch (err) {
    handleError(err);
    process.exit(1);
  }
}

main();
