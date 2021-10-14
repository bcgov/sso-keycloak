const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient, getRealmUrl, getOidcConfiguration, generateSecret } = require('./keycloak-core');
const { env, realm, idp, totp } = argv;

const meta = [
  { alias: 'idir', displayName: 'IDIR', realm: 'idir' },
  { alias: 'bceid', displayName: 'BCeID', realm: '_bceid' },
  { alias: 'bceid-basic', displayName: 'Basic BCeID', realm: '_bceidbasic' },
  { alias: 'bceid-business', displayName: 'Business BCeID', realm: '_bceidbusiness' },
  { alias: 'bceid-basic-and-business', displayName: 'BCeID', realm: '_bceidbasicbusiness' },
  { alias: 'github', displayName: 'GitHub', realm: '_github' },
];

async function main() {
  if (!env || !realm) {
    console.info(`
    Usages:
      node keycloak-link-idp-realm.js --env <env> --realm <realm> --idp <idp> [--totp <totp>]
    `);

    return;
  }

  try {
    const idpInfo = meta.find((v) => v.alias === idp);
    if (!idpInfo) {
      console.log(`invalid idp alias ${idp}`);
      return;
    }

    const idpAlias = idpInfo.alias;
    const idpName = idpInfo.displayName;
    const idpRealm = idpInfo.realm;

    const kcAdminClient = await getAdminClient(env, { totp });
    if (!kcAdminClient) return;

    const prompt = new Confirm(`Are you sure to link an idp ${idpName} to realm ${realm} in ${env} environment?`);
    const answer = await prompt.run();

    if (!answer) return;

    const aa = await kcAdminClient.identityProviders.findMappers({ alias: idpAlias, realm });

    console.log(JSON.stringify(aa, null, 2));
  } catch (err) {
    console.log(err);
  }
}

main();
