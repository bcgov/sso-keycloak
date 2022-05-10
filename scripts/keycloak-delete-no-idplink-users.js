const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
const { handleError, sleep, ignoreError } = require('./helpers');
const { env, realm, auto } = argv;

async function main() {
  if (!env || !realm) {
    console.info(`
    Usages:
      node keycloak-delete-no-idplink-users.js --env <env> --realm <realm> [--auto]
    `);

    return;
  }

  try {
    const adminClient = await getAdminClient(env);
    if (!adminClient) return;

    if (!auto) {
      const prompt = new Confirm(`Are you sure to proceed in realm ${realm} of ${env} environment?`);
      const answer = await prompt.run();
      if (!answer) return;
    }

    const max = 100;
    let first = 0;
    let total = 0;
    let deleted = 0;

    while (true) {
      const users = await ignoreError(adminClient.users.find({ realm, first, max }));
      const count = users.length;
      console.log(`users ${count} found`);
      if (count === 0) break;

      for (let x = 0; x < users.length; x++) {
        const { id, username, attributes, email, firstName, lastName } = users[x];
        console.log(`processing user ${username}`);

        const fids = await ignoreError(adminClient.users.listFederatedIdentities({ realm, id }), null);
        if (!fids) continue;

        if (fids.length === 0) {
          await ignoreError(adminClient.users.del({ realm, id }));
          console.log(`${username} deleted`);
          deleted++;
        }

        total++;
      }

      if (count < max) break;

      console.log(`complete ${first} users`);
      first = first + 20;
      await adminClient.reauth();
    }

    console.log(`${total} users completed.`);
    console.log(`${deleted} users deleted.`);
    process.exit(0);
  } catch (err) {
    handleError(err);
    process.exit(1);
  }
}

main();
