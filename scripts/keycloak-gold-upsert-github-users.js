const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient, getGitHubClient } = require('./keycloak-core');
const { handleError, ignoreError } = require('./helpers');
const { env, auto } = argv;

async function main() {
  if (!env || !['alpha', 'beta', 'gamma'].includes(env)) {
    console.info(`
    Usages:
      node keycloak-gold-upsert-github-users --env <env> [--auto]

    Examples:
      node keycloak-gold-upsert-github-users.js --env alpha
    `);

    return;
  }

  try {
    const kcAdminClient = await getAdminClient(env);
    if (!kcAdminClient) return;

    const ghClient = getGitHubClient();
    if (!ghClient) return;

    if (!auto) {
      const prompt = new Confirm(`Are you sure to proceed?`);
      const answer = await prompt.run();
      if (!answer) return;
    }
    const max = 500;
    let first = 0;
    let total = 0;

    while (true) {
      const users = await kcAdminClient.users.find({ realm: 'github', first, max });
      const count = users.length;
      if (count === 0) break;

      for (let x = 0; x < users.length; x++) {
        const { id, username, email, attributes } = users[x];

        // github username is required to fetch the user from GitHub API
        if (!attributes.github_username) continue;

        let ghuser = null;

        try {
          ghuser = await ghClient.rest.users.getByUsername({ username: attributes.github_username });
        } catch (err) {
          console.log(`user "${username}" not found in GitHub API`);
          continue;
        }

        if (!ghuser || !ghuser.data) {
          console.log(`nonexistent user "${username}" in github realm`);
          continue;
        }

        // note that `email` is not available via API
        const userData = ghuser.data;

        if (username !== String(userData.id)) {
          console.log(`mismatched user "${username}" in github realm`);
          continue;
        }

        const commonAttributes = {
          github_id: userData.id,
          github_username: userData.login,
          display_name: userData.name,
        };

        await kcAdminClient.users.update(
          { realm: 'github', id },
          {
            firstName: '',
            lastName: '',
            attributes: {
              ...attributes,
              ...commonAttributes,
            },
          },
        );

        // create or update the github user in the standard realm
        const upsertStandardUser = async (idp, create = false) => {
          let standardUsers = await kcAdminClient.users.find({
            realm: 'standard',
            username: `${userData.id}@${idp}`,
            first: 0,
            max: 1,
          });

          if (standardUsers.length === 0) {
            if (!create) return;

            console.log(`creating ${idp} user "${username}" in standard realm...`);

            const newuser = await kcAdminClient.users.create({
              enabled: true,
              realm: 'standard',
              username: `${userData.id}@${idp}`,
              email,
              firstName: userData.name,
              lastName: userData.login,
              attributes: commonAttributes,
            });

            await kcAdminClient.users.addToFederatedIdentity({
              realm: 'standard',
              id: newuser.id,
              federatedIdentityId: idp,
              federatedIdentity: {
                userId: id,
                userName: username,
                identityProvider: idp,
              },
            });
          } else {
            console.log(`updating ${idp} user "${username}" in standard realm...`);

            const existingUser = standardUsers[0];
            await kcAdminClient.users.update(
              { realm: 'standard', id: existingUser.id },
              {
                firstName: userData.name,
                lastName: userData.login,
                attributes: {
                  ...existingUser.attributes,
                  ...commonAttributes,
                },
              },
            );
          }
        };

        await upsertStandardUser('githubpublic', true);
        await upsertStandardUser('githubbcgov');

        total++;
      }

      if (count < max) break;

      first = first + max;
    }

    console.log(`${total} users upserted.`);
    process.exit(0);
  } catch (err) {
    handleError(err);
    process.exit(1);
  }
}

main();
