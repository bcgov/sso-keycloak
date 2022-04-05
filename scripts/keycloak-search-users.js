const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
const { env, realm, totp, email, firstname: firstName, lastname: lastName, username, search, first, max } = argv;

async function main() {
  if (!env || !realm) {
    console.info(`
    Usages:
      node keycloak-search-users.js --env <env> --realm <realm> [--totp <totp>] [--email <email>] [--firstName <firstName>] [--lastName <lastName>] [--username <username>] [--search <search>] [--first <first>] [--max <max>]
    `);

    return;
  }

  try {
    const kcAdminClient = await getAdminClient(env, { totp });
    if (!kcAdminClient) return;

    const prompt = new Confirm(`Are you sure to proceed in realm ${realm} of ${env} environment?`);
    const answer = await prompt.run();

    if (!answer) return;

    const users = await kcAdminClient.users.find({ realm, email, firstName, lastName, username, search, first, max });
    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.error(err.response.data && err.response.data.error);
  }
}

main();
