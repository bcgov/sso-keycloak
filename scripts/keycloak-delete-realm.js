const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
const { env, realm, totp } = argv;

async function main() {
  if (!env || !realm) {
    console.info(`
    Usages:
      node keycloak-delete-realm.js --env <env> --realm <realm> [--totp <totp>]
    `);

    return;
  }

  try {
    const kcAdminClient = await getAdminClient(env, { totp });
    if (!kcAdminClient) return;

    const prompt = new Confirm(`Are you sure to delete a realm ${realm} in ${env} environment?`);
    const answer = await prompt.run();

    if (!answer) return;

    // 1. Find all IDPs associated with this realm
    let idps = await kcAdminClient.identityProviders.find({ realm });
    idps = idps.filter((idp) => idp.providerId === 'keycloak-oidc');

    // 2. Delete the IDP clients
    for (let x = 0; x < idps.length; x++) {
      const idp = idps[x];
      const { tokenUrl, clientId } = idp.config;
      const regex = /https:\/\/.*\/auth\/realms\/(.*)\/protocol\/openid-connect\/token/;
      const idpIdMatch = tokenUrl.match(regex);
      const idpClient = await kcAdminClient.clients.findOne({ realm: idpIdMatch[1], clientId });

      if (idpClient.length > 0) {
        await kcAdminClient.clients.del({ realm: idpIdMatch[1], id: idpClient[0].id });
      }
    }

    // 3. Delete the realm
    await kcAdminClient.realms.del({ realm });

    console.log(`the realm ${realm} has been removed with the associated IDP clients.`);
  } catch (err) {
    console.error(err.response.data && err.response.data.error);
  }
}

main();
