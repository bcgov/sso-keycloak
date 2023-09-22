import yargs from 'yargs/yargs';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { createContainer } from 'container';

const argv = yargs(process.argv.slice(2))
  .options({
    env: { type: 'string', default: '' },
    realm: { type: 'string', default: 'standard' },
    start: { type: 'number', default: 0 },
    concurrency: { type: 'number', default: 500 },
    auto: { type: 'boolean', default: false },
  })
  .parseSync();

const { env, realm, start, concurrency, auto } = argv;

if (!env || !realm) {
  console.info(`
Updates the standard realm's user IDP links to have Provider IDs as same as the Provider username.

Usages:
  yarn script scripts/sync-idp-links --env <env> --realm <realm> --start <start> --concurrency <concurrency> [--auto]
`);

  process.exit(1);
}

const container = createContainer({ env, auto, allowed: ['alpha', 'beta', 'gamma'] });
container(async (adminClient?: KeycloakAdminClient) => {
  if (!adminClient) return;

  const max = concurrency;
  let first = start;
  let total = 0;

  const _updateIdpLink = updateIdpLink.bind(null, adminClient, realm);

  while (true) {
    const users = await adminClient.users.find({ realm, first, max });

    const count = users.length;
    total += count;

    await Promise.all(users.map(_updateIdpLink));

    if (count < max) break;

    first = first + max;
    console.log(`${first} users completed.`);
  }

  console.log(`${total} users completed.`);
});

async function updateIdpLink(adminClient: KeycloakAdminClient, realm: string, user: UserRepresentation) {
  const { id, username } = user;

  const links = await adminClient.users.listFederatedIdentities({ realm, id: id as string });
  if (links.length === 0) {
    console.log(`no IDP links; user: ${username}`);

    if (username?.includes('@')) {
      const [guid, idp] = username.split('@');

      await adminClient.users.addToFederatedIdentity({
        realm,
        id: id as string,
        federatedIdentityId: idp,
        federatedIdentity: {
          userId: guid,
          userName: guid,
          identityProvider: idp,
        },
      });

      console.log(`restored; user: ${username}`);
    }

    return;
  }

  const { identityProvider, userId, userName } = links[0];
  if (userId === userName) {
    // console.log(`already synced; user: ${username}`);
    return;
  }

  if (userId !== userName) {
    await adminClient.users.delFromFederatedIdentity({
      realm,
      id: id as string,
      federatedIdentityId: identityProvider as string,
    });

    await adminClient.users.addToFederatedIdentity({
      realm,
      id: id as string,
      federatedIdentityId: identityProvider as string,
      federatedIdentity: {
        userId: userName,
        userName: userName,
        identityProvider: identityProvider,
      },
    });

    console.log(`updated; user: ${username}`);
  }
}
