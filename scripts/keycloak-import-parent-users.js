const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
const { handleError, ignoreError } = require('./helpers');
const { env, idp, parentRealm, targetRealm, auto, del } = argv;

// this script helps import users from a parent realm to `standard` realm and associate them with IDP links
async function main() {
  if (!env || !idp || !parentRealm || !targetRealm) {
    console.info(`
    Usages:
      node keycloak-import-parent-users.js --env <env> --idp <idp> --parent-realm <parent-realm> --target-realm <target-realm> [--auto] [--del]
    `);

    return;
  }

  try {
    const adminClient = await getAdminClient(env);
    if (!adminClient) return;

    if (!auto) {
      const prompt = new Confirm(`Are you sure to proceed in realm ${targetRealm} of ${env} environment?`);
      const answer = await prompt.run();
      if (!answer) return;
    }

    const max = 500;
    let first = 0;
    let total = 0;

    while (true) {
      const users = await ignoreError(adminClient.users.find({ realm: parentRealm, first, max }));
      const count = users.length;
      if (count === 0) break;

      for (let x = 0; x < users.length; x++) {
        const { id, username, attributes, email, firstName, lastName } = users[x];

        console.log(username);

        // 1. delete the user with the username if already exists
        const duplicates = await ignoreError(
          adminClient.users.find({
            realm: targetRealm,
            username: `${username}@${idp}`,
            max: 1,
          }),
        );
        if (!duplicates) continue;

        if (duplicates.length > 0) {
          // skip if user already exists
          if (!del) continue;

          await ignoreError(adminClient.users.del({ realm: targetRealm, id: duplicates[0].id }));
        }

        // 2. create the user
        const newuser = await ignoreError(
          adminClient.users.create({
            realm: targetRealm,
            username: `${username}@${idp}`,
            attributes,
            email,
            firstName,
            lastName,
            enabled: true,
          }),
        );
        if (!newuser) continue;

        // 3. attach the IDP link
        await ignoreError(
          adminClient.users.addToFederatedIdentity({
            realm: targetRealm,
            id: newuser.id,
            federatedIdentityId: idp,
            federatedIdentity: {
              userId: id,
              userName: username,
              identityProvider: idp,
            },
          }),
        );

        total++;
      }

      if (count < max) break;

      first = first + max;
      console.log(`complete ${first} users`);
    }

    console.log(`${total} users imported.`);
    process.exit(0);
  } catch (err) {
    handleError(err);
    process.exit(1);
  }
}

main();
