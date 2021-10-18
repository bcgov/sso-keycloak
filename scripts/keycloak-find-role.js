const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
const { env, realm = 'master', totp } = argv;

async function main() {
  if (!env || !realm) {
    console.info(`
    Usages:
      node keycloak-find-client.js --env <env> [--realm <realm>] [--totp <totp>]
    `);

    return;
  }

  try {
    const kcAdminClient = await getAdminClient(env, { totp });
    if (!kcAdminClient) return;

    const prompt = new Confirm(`Are you sure to proceed in realm ${realm} of ${env} environment?`);
    const answer = await prompt.run();

    if (!answer) return;

    const role = await kcAdminClient.roles.findOneByName({ realm, name: 'admin' });

    if (role) {
      role.composites = await kcAdminClient.roles.getCompositeRoles({ realm, id: role.id });
    }

    console.log(JSON.stringify(role, null, 2));
  } catch (err) {
    if (err.response) {
      console.error(err.response.data && err.response.data.error);
    } else {
      console.error(err.message || err);
    }
  }
}

main();
