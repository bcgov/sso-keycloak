const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
const { handleError, ignoreError } = require('./helpers');
const { env, idp, realm, auto } = argv;

async function main() {
  if (!env || !idp || !realm) {
    console.info(`
    Usages:
      node keycloak-delete-dangling-idp-users --env <env> --idp <idp> --realm <realm> [--auto]
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

    const max = 500;
    let first = 0;

    let searched = 0;
    let deleted = 0;

    const idpSuffix = `@${idp}`;

    while (true) {
      let users = await adminClient.users.find({ realm, username: idpSuffix, first, max });
      users = users.filter(({ username }) => username.endsWith(idpSuffix));
      const count = users.length;
      if (count === 0) break;

      for (let x = 0; x < users.length; x++) {
        const { id, username } = users[x];

        const links = await adminClient.users.listFederatedIdentities({ realm, id });
        if (links.length === 0) {
          await adminClient.users.del({ realm, id });
          console.log(`username ${username} deleted.`);
          deleted++;
        }

        searched++;
      }

      if (count < max) break;

      first = first + max;
      console.log(`complete ${first} users`);
    }

    console.log(`${searched} users searched.`);
    console.log(`${deleted} users deleted.`);
    process.exit(0);
  } catch (err) {
    handleError(err);
    process.exit(1);
  }
}

main();
