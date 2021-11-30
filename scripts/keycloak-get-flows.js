const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
const { env, totp } = argv;

async function main() {
  if (!env) {
    console.info(`
    Usages:
      node keycloak-get-flows.js --env <env> [--totp <totp>]
    `);

    return;
  }

  try {
    const kcAdminClient = await getAdminClient(env, { totp });
    if (!kcAdminClient) return;

    const prompt = new Confirm(`Are you sure to proceed in ${env} environment?`);
    const answer = await prompt.run();

    if (!answer) return;

    const info = await kcAdminClient.authenticationManagement.getFlows();
    console.log(info);
  } catch (err) {
    console.log(err);
    console.error(err.response.data && err.response.data.error);
  }
}

main();
