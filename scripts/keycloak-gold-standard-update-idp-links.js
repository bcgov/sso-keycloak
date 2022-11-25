const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
const { handleError, ignoreError } = require('./helpers');
const { env, auto } = argv;

const realm = 'standard';

const updateIdpLink = async (adminClient, realm, user) => {
  const { id, username } = user;

  const links = await adminClient.users.listFederatedIdentities({ realm, id });
  if (links.length === 0) {
    console.log(`no IDP links; user: ${username}`);
    return;
  }

  const { identityProvider, userId, userName } = links[0];
  if (userId === userName) {
    console.log(`already synced; user: ${username}`);
    return;
  }

  if (userId !== userName) {
    await adminClient.users.delFromFederatedIdentity({ realm, id, federatedIdentityId: identityProvider });
    await adminClient.users.addToFederatedIdentity({
      realm,
      id,
      federatedIdentityId: identityProvider,
      federatedIdentity: {
        userId: userName,
        userName: userName,
        identityProvider: identityProvider,
      },
    });

    console.log(`updated; user: ${username}`);
  }
};

async function main() {
  if (!env || !['alpha', 'beta', 'gamma'].includes(env)) {
    console.info(`
Updates the standard realm's user IDP links to have Provider IDs as same as the Provider username.

Usages:
  node keycloak-gold-standard-update-idp-links --env <env> [--auto]
`);

    return;
  }

  try {
    const adminClient = await getAdminClient(env);
    if (!adminClient) return;

    if (!auto) {
      const prompt = new Confirm(`Are you sure to proceed in ${adminClient.url}?`);
      const answer = await prompt.run();
      if (!answer) return;
    }

    const starttime = new Date().getTime();

    const max = 200;
    let first = 0;
    let total = 0;

    const _updateIdpLink = updateIdpLink.bind(null, adminClient, realm);

    while (true) {
      const users = await adminClient.users.find({ realm, first, max });

      const count = users.length;
      total += count;

      await Promise.all(users.map(_updateIdpLink));

      if (count < max) break;

      first = first + max;
    }

    console.log(`${total} users found.`);

    const endtime = new Date().getTime();
    console.log(`took ${(endtime - starttime) / 1000} sec.`);
    process.exit(0);
  } catch (err) {
    handleError(err);
    process.exit(1);
  }
}

main();
