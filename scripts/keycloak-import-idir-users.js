const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
const { handleError, sleep } = require('./helpers');
const { env, realm, totp } = argv;

const IDP_REALM = 'idir';

// this script helps import users from `idir` parent realm to `standard` realm and associate them with IDP links
async function main() {
  if (!env || !realm) {
    console.info(`
    Usages:
      node keycloak-import-idir-users.js --env <env> --realm <realm> [--totp <totp>]
    `);

    return;
  }

  try {
    const adminClient = await getAdminClient(env, { totp });
    if (!adminClient) return;

    const prompt = new Confirm(`Are you sure to proceed in realm ${realm} of ${env} environment?`);
    const answer = await prompt.run();

    if (!answer) return;

    const max = 20;
    let first = 0;
    let total = 0;

    while (true) {
      const users = await adminClient.users.find({ realm: IDP_REALM, first, max });
      const count = users.length;
      if (count === 0) break;

      total += count;

      for (let x = 0; x < users.length; x++) {
        const { id, username, attributes, email, firstName, lastName } = users[x];

        console.log(username);

        // 1. delete the user with the username if already exists
        const duplicates = await adminClient.users.find({ realm, username: `${username}@${IDP_REALM}`, max: 1 });
        await sleep(200);
        if (duplicates.length > 0) await adminClient.users.del({ realm, id: duplicates[0].id });

        // 2. create the user
        const newuser = await adminClient.users.create({
          realm,
          username: `${username}@${IDP_REALM}`,
          attributes,
          email,
          firstName,
          lastName,
          enabled: true,
        });

        // 3. attach the IDP link
        await adminClient.users.addToFederatedIdentity({
          realm,
          id: newuser.id,
          federatedIdentityId: IDP_REALM,
          federatedIdentity: {
            userId: id,
            userName: username,
            identityProvider: IDP_REALM,
          },
        });

        await sleep(200);
      }

      if (count < max) break;

      first = first + 20;
      await adminClient.reauth();
    }

    console.log(`${total} users imported.`);
    process.exit(0);
  } catch (err) {
    handleError(err);
    process.exit(1);
  }
}

main();
