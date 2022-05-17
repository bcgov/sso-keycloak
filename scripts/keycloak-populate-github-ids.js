const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
const { handleError, ignoreError } = require('./helpers');
const { env, githubRealm, auto } = argv;

// this script helps populate github numeric ids into existing users' `github_id` attribute
async function main() {
  if (!env || !githubRealm) {
    console.info(`
    Usages:
      node keycloak-populate-github-ids.js --env <env> --github-realm <realm> [--auto]
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

    const max = 50;
    let first = 0;
    let total = 0;

    while (true) {
      const users = await adminClient.users.find({ realm: githubRealm, first, max });

      const count = users.length;
      total += count;

      for (let x = 0; x < users.length; x++) {
        const { id, attributes = {} } = users[x];
        const fids = await adminClient.users.listFederatedIdentities({ realm: githubRealm, id });
        const fid = fids.find((f) => f.identityProvider === 'github');

        // skip if no `github` linkage
        if (!fid) {
          total -= 1;
          continue;
        }

        const { userId } = fid;
        await adminClient.users.update(
          { realm: githubRealm, id },
          { attributes: { ...attributes, github_id: [userId] } },
        );
      }

      if (count < max) break;

      await adminClient.reauth();
      first = first + max;
      console.log(`complete ${first} users`);
    }

    console.log(`${total} users updated.`);
    process.exit(0);
  } catch (err) {
    handleError(err);
    process.exit(1);
  }
}

main();
