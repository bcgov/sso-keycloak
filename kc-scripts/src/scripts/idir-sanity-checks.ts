import _ from 'lodash';
import yargs from 'yargs/yargs';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { createContainer } from 'container';

const argv = yargs(process.argv.slice(2))
  .options({
    env: { type: 'string', default: '' },
    realm: { type: 'string', default: 'standard' },
    start: { type: 'number', default: 0 },
    concurrency: { type: 'number', default: 50 },
    auto: { type: 'boolean', default: false },
  })
  .parseSync();

const { env, realm, start, concurrency, auto } = argv;

if (!env || !realm) {
  console.info(`
Usages:
  yarn script scripts/idir-sanity-checks --env <env> --realm <realm> --start <start> --concurrency <concurrency> [--auto]
`);

  process.exit(1);
}

const container = createContainer({ env, auto, allowed: ['alpha', 'beta', 'gamma'] });
container(async (adminClient?: KeycloakAdminClient) => {
  if (!adminClient) return;

  const max = concurrency;
  let first = start;
  let total = 0;

  const _sanityCheck = sanityCheck.bind(null, adminClient, realm);

  while (true) {
    const users = await adminClient.users.find({ realm, first, max, username: '@idir' });

    const count = users.length;
    total += count;

    await Promise.all(users.map(_sanityCheck));

    if (count < max) break;

    first = first + max;
    console.log(`${first} users completed.`);
  }

  console.log(`${total} users completed.`);
});

async function sanityCheck(adminClient: KeycloakAdminClient, realm: string, user: UserRepresentation) {
  const { id, username, attributes } = user;

  const links = await adminClient.users.listFederatedIdentities({ realm, id: id as string });
  if (links.length === 0) {
    console.log(`no IDP links: ${username}`);
    return;
  }

  const { identityProvider, userId, userName } = links[0];
  if (userId !== userName) {
    console.log(`mismatched provider id and provider username: ${username}`);
    return;
  }

  const display_name = _.get(attributes, `display_name.0`);
  const idir_user_guid = _.get(attributes, `idir_user_guid.0`);
  const idir_username = _.get(attributes, `idir_username.0`);

  const deleteUserIfHasNoClientRole = async () => {
    const roles = await adminClient.users.listRoleMappings({ realm, id: id as string });
    if (!roles) return false;

    const noClientRoleAssigned = _.isEmpty(roles.clientMappings);

    if (noClientRoleAssigned) {
      await adminClient.users.del({ realm, id: id as string });
      return true;
    }

    console.log(_.keys(roles.clientMappings));
    return false;
  };

  if (!display_name || !idir_user_guid || !idir_username) {
    if (await deleteUserIfHasNoClientRole()) {
      console.log(`missing attributes: ${username} - deleted`);
      return;
    }

    console.log(`missing attributes: ${username} - has role`);
    return;
  }

  if (_.toLower(userName) !== _.toLower(idir_user_guid)) {
    if (await deleteUserIfHasNoClientRole()) {
      console.log(`mismatched GUIDs: ${username} - deleted`);
    }

    console.log(`mismatched GUIDs: ${username}`);
    return;
  }

  if (_.keys(attributes).length > 3) {
    await adminClient.users.update(
      { realm, id: id as string },
      {
        attributes: _.pick(attributes, ['display_name', 'idir_user_guid', 'idir_username']),
      },
    );

    console.log(`remove unnecessary attributes: ${username}`);
    return;
  }
}
