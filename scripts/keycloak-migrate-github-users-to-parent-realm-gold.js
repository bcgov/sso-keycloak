const axios = require('axios');
const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
const { handleError, ignoreError } = require('./helpers');
const { baseEnv, targetEnv, auto, del } = argv;

const SILVER_GITHUB_REALM = '_github';
const GOLD_GITHUB_REALM = 'github';

const fetchGithubId = async (username) => {
  try {
    const { id: github_id } = await axios.get(`https://api.github.com/users/${username}`).then((res) => res.data);
    return github_id;
  } catch {
    return null;
  }
};

// this script helps migrate users from one realm to another one including IDP links
async function main() {
  if (!baseEnv || !targetEnv) {
    console.info(`
    Usages:
      node keycloak-migrate-github-users-to-parent-realm-gold --base-env <env> --target-env <env> [--auto] [--del]
    `);

    return;
  }

  try {
    const baseClient = await getAdminClient(baseEnv, { totp: 996970 });
    const targetClient = await getAdminClient(targetEnv);
    if (!baseClient || !targetClient) return;

    if (!auto) {
      const prompt = new Confirm(`Are you sure to proceed?`);
      const answer = await prompt.run();
      if (!answer) return;
    }

    const max = 500;
    let first = 2400;
    let total = 0;

    while (true) {
      const users = await baseClient.users.find({ realm: SILVER_GITHUB_REALM, first, max });

      const count = users.length;
      total += count;

      for (let x = 0; x < users.length; x++) {
        const { id, username, attributes = {}, email, firstName, lastName } = users[x];
        let { github_id } = attributes;
        if (github_id && github_id.length > 0) {
          github_id = github_id[0];
        } else {
          github_id = await fetchGithubId(username);
        }

        if (!github_id) {
          console.error(`github_id not found for user ${username}`);
          total -= 1;
          continue;
        }

        console.log('importing github user with id: ', github_id);

        try {
          const newuser = await targetClient.users.create({
            enabled: true,
            realm: GOLD_GITHUB_REALM,
            username: github_id,
            email,
            firstName,
            lastName,
            attributes: {
              github_username: username,
              github_id,
            },
          });

          await targetClient.users.addToFederatedIdentity({
            realm: GOLD_GITHUB_REALM,
            id: newuser.id,
            federatedIdentityId: 'github',
            federatedIdentity: {
              userId: github_id,
              userName: github_id,
              identityProvider: 'github',
            },
          });
        } catch {}
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
