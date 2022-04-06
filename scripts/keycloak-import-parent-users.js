const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
const { handleError, sleep } = require('./helpers');
const { env, realm, totp, idp, parentrealm: parentRealm, targetrealm: targetRealm } = argv;

// this script helps import users from a parent realm to `standard` realm and associate them with IDP links
async function main() {
  if (!env || !idp || !parentrealm || !targetRealm) {
    console.info(`
    Usages:
      node keycloak-import-parent-users.js --env <env> --idp <idp> --parentrealm <parentrealm> --targetrealm <targetrealm> [--totp <totp>]
    `);

    return;
  }

  try {
    const adminClient = await getAdminClient(env, { totp });
    if (!adminClient) return;

    const prompt = new Confirm(`Are you sure to proceed in realm ${targetRealm} of ${env} environment?`);
    const answer = await prompt.run();

    if (!answer) return;

    const max = 20;
    let first = 0;
    let total = 0;

    while (true) {
      const users = await adminClient.users.find({ realm: parentRealm, first, max });
      const count = users.length;
      if (count === 0) break;

      total += count;

      for (let x = 0; x < users.length; x++) {
        const { id, username, attributes, email, firstName, lastName } = users[x];

        console.log(username);

        // 1. delete the user with the username if already exists
        const duplicates = await adminClient.users.find({
          realm: targetRealm,
          username: `${username}@${idp}`,
          max: 1,
        });
        await sleep(200);
        if (duplicates.length > 0) await adminClient.users.del({ realm: targetRealm, id: duplicates[0].id });

        // 2. create the user
        const newuser = await adminClient.users.create({
          realm: targetRealm,
          username: `${username}@${idp}`,
          attributes,
          email,
          firstName,
          lastName,
          enabled: true,
        });

        // 3. attach the IDP link
        await adminClient.users.addToFederatedIdentity({
          realm: targetRealm,
          id: newuser.id,
          federatedIdentityId: idp,
          federatedIdentity: {
            userId: id,
            userName: username,
            identityProvider: idp,
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
