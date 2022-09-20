const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
const { handleError, ignoreError } = require('./helpers');
const { baseEnv, baseRealm, targetEnv, targetRealm, auto, del } = argv;

// this script helps migrate users from one realm to another one including IDP links
async function main() {
  if (!baseEnv || !baseRealm || !targetEnv || !targetRealm) {
    console.info(`
    Usages:
      node keycloak-migrate-users.js --base-env <env> --base-realm <realm> --target-env <env> --target-realm <realm> [--auto] [--del]
    `);

    return;
  }

  try {
    const baseClient = await getAdminClient(baseEnv);
    const targetClient = await getAdminClient(targetEnv);
    if (!baseClient || !targetClient) return;

    if (!auto) {
      const prompt = new Confirm(`Are you sure to proceed?`);
      const answer = await prompt.run();
      if (!answer) return;
    }

    const max = 500;
    let first = 0;
    let total = 0;

    while (true) {
      const users = await baseClient.users.find({ realm: baseRealm, first, max });

      const count = users.length;
      total += count;

      for (let x = 0; x < users.length; x++) {
        const {
          id,
          username,
          enabled,
          totp,
          emailVerified,
          disableableCredentialTypes,
          requiredActions,
          notBefore,
          access,
          attributes,
          clientConsents,
          email,
          firstName,
          lastName,
        } = users[x];

        const fids = await ignoreError(baseClient.users.listFederatedIdentities({ realm: baseRealm, id }), []);

        // only allow users has a valid federated identity
        if (fids.length === 0) {
          total -= 1;
          continue;
        }

        const { identityProvider, userId, userName } = fids[0];

        // 1. delete the user with the username if already exists
        const duplicates = await ignoreError(
          targetClient.users.find({ realm: targetRealm, username: userName, max: 1 }),
        );
        if (!duplicates) continue;

        if (duplicates.length > 0) {
          // skip if user already exists
          if (!del) {
            console.log(`${userName} skipping...`);
            continue;
          }

          await ignoreError(targetClient.users.del({ realm: targetRealm, id: duplicates[0].id }));
          console.log(`duplicate user ${userName} deleted`);
        }

        // 2. create the user
        const newuser = await targetClient.users.create({
          realm: targetRealm,
          username: userName,
          enabled,
          totp,
          emailVerified,
          disableableCredentialTypes,
          requiredActions,
          notBefore,
          access,
          attributes,
          clientConsents,
          email,
          firstName,
          lastName,
        });

        // 3. attach the IDP link
        await targetClient.users.addToFederatedIdentity({
          realm: targetRealm,
          id: newuser.id,
          federatedIdentityId: targetRealm,
          federatedIdentity: {
            userId,
            userName,
            identityProvider: targetRealm,
          },
        });
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
