const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
const { handleError, ignoreError } = require('./helpers');
const { env, auto } = argv;

async function updateStandardBceid(kcAdminClient, idp) {
  const max = 500;
  let first = 0;
  let total = 0;

  while (true) {
    const users = await kcAdminClient.users.find({ realm: 'standard', username: `@${idp}`, first, max });
    const count = users.length;
    if (count === 0) break;

    for (let x = 0; x < users.length; x++) {
      const { id, username, attributes = {} } = users[x];

      console.log(`updating ${idp} user "${username}" in standard realm...`);
      await kcAdminClient.users.update(
        { realm: 'standard', id },
        {
          firstName: _.get(attributes, 'display_name.0', ''),
          lastName: _.get(attributes, 'bceid_username.0', ''),
          attributes,
        },
      );

      total++;
    }

    if (count < max) break;

    first = first + max;
  }

  console.log(`${total} ${idp} users upserted.`);
}

async function main() {
  if (!env || !['alpha', 'beta', 'gamma'].includes(env)) {
    console.info(`
    Usages:
      node keycloak-gold-update-bceid-users --env <env> [--auto]

    Examples:
      node keycloak-gold-update-bceid-users.js --env alpha
    `);

    return;
  }

  try {
    const kcAdminClient = await getAdminClient(env);
    if (!kcAdminClient) return;

    if (!auto) {
      const prompt = new Confirm(`Are you sure to proceed?`);
      const answer = await prompt.run();
      if (!answer) return;
    }

    await updateStandardBceid(kcAdminClient, 'bceidbasic');
    await updateStandardBceid(kcAdminClient, 'bceidbusiness');
    await updateStandardBceid(kcAdminClient, 'bceidboth');

    process.exit(0);
  } catch (err) {
    handleError(err);
    process.exit(1);
  }
}

main();
