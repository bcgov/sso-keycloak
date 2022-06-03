const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
const { handleError, ignoreError } = require('./helpers');
const { env, auto } = argv;

// this script helps delete bceid users in the Gold standard realms.
async function main() {
  if (!env) {
    console.info(`
    Usages:
      node keycloak-delete-bceid-users.js --env <env> [--auto]
    `);

    return;
  }

  try {
    const adminClient = await getAdminClient(env);
    if (!adminClient) return;

    if (!auto) {
      const prompt = new Confirm(`Are you sure to proceed?`);
      const answer = await prompt.run();
      if (!answer) return;
    }

    const max = 1000;
    let first = 0;
    let total = 0;

    while (true) {
      const users = await adminClient.users.find({ realm: 'standard', search: '@bceid', first, max });

      const count = users.length;
      total += count;

      for (let x = 0; x < users.length; x++) {
        const { id, username } = users[x];

        if (username.includes('@bceid')) {
          ignoreError(adminClient.users.del({ realm: 'standard', id }));
          console.log(`${username} deleted.`);
        }
      }

      if (count < max) break;

      await adminClient.reauth();
      first = first + max;
      console.log(`complete ${first} users`);
    }

    console.log(`${total} users completed.`);
    process.exit(0);
  } catch (err) {
    handleError(err);
    process.exit(1);
  }
}

main();
