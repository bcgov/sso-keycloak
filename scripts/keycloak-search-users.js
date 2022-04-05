const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
const { env, realm, client, totp } = argv;

async function main() {
  if (!env || !realm) {
    console.info(`
    Usages:
      node keycloak-search-users.js --env <env> --realm <realm> [--totp <totp>]
    `);

    return;
  }

  try {
    const kcAdminClient = await getAdminClient(env, { totp });
    if (!kcAdminClient) return;

    const prompt = new Confirm(`Are you sure to proceed in realm ${realm} of ${env} environment?`);
    const answer = await prompt.run();

    if (!answer) return;

    // use the following attributes for additional search criteria
    //   interface UserQuery {
    //     email?: string;
    //     first?: number;
    //     firstName?: string;
    //     lastName?: string;
    //     max?: number;
    //     search?: string;
    //     username?: string;
    // }
    const users = await kcAdminClient.users.find({ realm, username: '', email: '', firstName: '', lastName: '' });
    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.error(err.response.data && err.response.data.error);
  }
}

main();
