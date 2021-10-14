const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
const { createTemplate } = require('./utils');
let { env, realm, displayName, totp } = argv;
if (displayName) displayName = realm;

const getRealm = createTemplate(`${__dirname}/base-objects/custom-realm.json`);

async function main() {
  if (!env || !realm) {
    console.info(`
    Usages:
      node keycloak-create-realm.js --env <env> --realm <realm> [--totp <totp>]
    `);

    return;
  }

  try {
    const kcAdminClient = await getAdminClient(env, { totp });
    if (!kcAdminClient) return;

    const prompt = new Confirm(`Are you sure to create a realm ${realm} in ${env} environment?`);
    const answer = await prompt.run();

    if (!answer) return;

    // 1. Check if the realm name already exists
    const targetRealm = await kcAdminClient.realms.findOne({ realm });

    if (targetRealm) {
      console.log(`realm ${realm} already exists`);
      return;
    }

    // 2. Create the realm
    const data = getRealm({
      id: realm,
      realm,
      displayName,
      displayNameHtml: `<a>${displayName}</a>`,
      groups: [
        {
          name: 'Realm Administrator',
          path: '/Realm Administrator',
          clientRoles: {
            'realm-management': [
              'realm-admin',
              'manage-identity-providers',
              'query-realms',
              'query-groups',
              'manage-authorization',
              'query-clients',
              'manage-realm',
              'manage-clients',
              'query-users',
              'create-client',
              'manage-events',
              'manage-users',
            ].concat(env !== 'prod' ? ['impersonation'] : []),
          },
        },
      ],
    });

    await kcAdminClient.realms.create(data);
  } catch (err) {
    console.error(err.response.data && err.response.data.error);
  }
}

main();
