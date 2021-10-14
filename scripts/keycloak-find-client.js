const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient, getRealmUrl, getOidcConfiguration, generateSecret } = require('./keycloak-core');
const { env, realm, client, totp } = argv;

async function main() {
  if (!env || !realm) {
    console.info(`
    Usages:
      node keycloak-find-client.js --env <env> --realm <realm> --client <client> [--totp <totp>]
    `);

    return;
  }

  try {
    const kcAdminClient = await getAdminClient(env, { totp });
    if (!kcAdminClient) return;

    const prompt = new Confirm(
      `Are you sure to proceed to find the client ${client} in realm ${realm} of ${env} environment?`,
    );
    const answer = await prompt.run();

    if (!answer) return;

    const clients = await kcAdminClient.clients.findOne({ realm, clientId: client });
    if (clients.length > 0) {
      const client = clients[0];
      client.protocolMappers = _.orderBy(client.protocolMappers, ['name'], ['asc']);
      console.log(JSON.stringify(client, null, 2));
    }
  } catch (err) {
    console.error(err.response.data && err.response.data.error);
  }
}

main();
