const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
const { env, realm, idp, totp } = argv;

async function main() {
  if (!env || !realm) {
    console.info(`
    Usages:
      node keycloak-find-idp-mappers.js --env <env> --realm <realm> --idp <idp> [--totp <totp>]
    `);

    return;
  }

  try {
    const kcAdminClient = await getAdminClient(env, { totp });
    if (!kcAdminClient) return;

    const prompt = new Confirm(
      `Are you sure to proceed to find the idp mappers in the realm ${realm} of ${env} environment?`,
    );
    const answer = await prompt.run();

    if (!answer) return;

    let payload = await kcAdminClient.identityProviders.findMappers({ alias: idp, realm });
    payload = _.orderBy(payload, ['name'], ['asc']);

    console.log(JSON.stringify(payload, null, 2));
  } catch (err) {
    console.error(err.response.data && err.response.data.error);
  }
}

main();
