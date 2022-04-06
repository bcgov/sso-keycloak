const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
const { handleError } = require('./helpers');
const { env, realm, totp, targetrealm: targetRealm } = argv;

// this script helps migrate users from one realm to another one including IDP links
async function main() {
  if (!env || !realm || !targetRealm) {
    console.info(`
    Usages:
      node keycloak-migrate-users.js --env <env> --realm <realm> --targetrealm <targetrealm> [--totp <totp>]
    `);

    return;
  }

  try {
    const adminClient = await getAdminClient(env, { totp });
    const targetClient = await getAdminClient('target');
    if (!adminClient || !targetClient) return;

    const prompt = new Confirm(`Are you sure to proceed in realm ${realm} of ${env} environment?`);
    const answer = await prompt.run();

    if (!answer) return;

    const max = 20;
    let first = 0;
    let total = 0;

    while (true) {
      const users = await adminClient.users.find({ realm, first, max });
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

        const fids = await adminClient.users.listFederatedIdentities({ realm, id });

        // only allow users has a valid federated identity
        if (fids.length === 0) {
          total -= 1;
          break;
        }

        const { identityProvider, userId, userName } = fids[0];

        console.log(username, identityProvider, userId, userName);

        try {
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

          await targetClient.users.addToFederatedIdentity({
            realm: targetRealm,
            id: newuser.id,
            federatedIdentityId: identityProvider,
            federatedIdentity: {
              userId,
              userName,
              identityProvider: identityProvider,
            },
          });
        } catch (error) {
          if (error.response.data.errorMessage !== 'User exists with same username') {
            throw Error(error);
          }

          console.log(`duplicate user ${userName}`);
        }

        await adminClient.reauth();
        await targetClient.reauth();
      }

      if (count < max) break;

      first = first + 20;
    }

    console.log(`${total} users imported.`);
    process.exit(0);
  } catch (err) {
    handleError(err);
    process.exit(1);
  }
}

main();
