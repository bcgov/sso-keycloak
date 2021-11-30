const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
let { env, totp } = argv;

async function main() {
  if (!env) {
    console.info(`
    Usages:
      node keycloak-server-info.js --env <env> [--totp <totp>]
    `);

    return;
  }

  try {
    const kcAdminClient = await getAdminClient(env, { totp });
    if (!kcAdminClient) return;

    const prompt = new Confirm(`Are you sure to proceed in ${env} environment?`);
    const answer = await prompt.run();

    const info = await kcAdminClient.serverInfo.find();
    console.log(info);

    if (!answer) return;
  } catch (err) {
    console.log(err);
    console.error(err.response.data && err.response.data.error);
  }
}

main();
