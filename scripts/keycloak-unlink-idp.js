const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient, getRealmUrl, getOidcConfiguration } = require('./keycloak-core');
const { readJSON, createTemplate, generateSecret } = require('./utils');
const { env, realm, idp, totp } = argv;

const idps = readJSON(`${__dirname}/meta/idp-realms.json`);

for (let x = 0; x < idps.length; x++) {
  const _idp = idps[x];
  _idp.clientMappers = readJSON(`${__dirname}/client-mappers/${_idp.alias}.json`);
  _idp.idpMappers = readJSON(`${__dirname}/idp-mappers/${_idp.alias}.json`);
}

async function main() {
  if (!env || !realm) {
    console.info(`
    Usages:
      node keycloak-unlink-idp.js --env <env> --realm <realm> --idp <idp> [--totp <totp>]
    `);

    return;
  }

  try {
    const idpInfo = idps.find((v) => v.alias === idp);
    if (!idpInfo) {
      console.log(`invalid idp alias ${idp}`);
      return;
    }

    const idpAlias = idpInfo.alias;
    const idpName = idpInfo.displayName;
    const idpRealm = idpInfo.realm;

    const kcAdminClient = await getAdminClient(env, { totp });
    if (!kcAdminClient) return;

    const prompt = new Confirm(`Are you sure to unlink the idp ${idpName} from realm ${realm} in ${env} environment?`);
    const answer = await prompt.run();

    if (!answer) return;

    // 1. Check if the idp name exists
    const idpConfig = await kcAdminClient.identityProviders.findOne({ alias: idpAlias, realm });

    if (!idpConfig) {
      console.log(`idp ${idpName} does not exists`);
      return;
    }

    // 2. Delete the idp from the target realm
    await kcAdminClient.identityProviders.del({ alias: idpAlias, realm });

    // 3. Delete the idp client from the idp realm
    const realmUrl = getRealmUrl(env, realm);
    const idpClient = await kcAdminClient.clients.findOne({ realm: idpRealm, clientId: realmUrl });

    if (idpClient.length > 0) {
      await kcAdminClient.clients.del({ realm: idpRealm, id: idpClient[0].id });
    }
  } catch (err) {
    console.error(err.response.data && err.response.data.error);
  }
}

main();
