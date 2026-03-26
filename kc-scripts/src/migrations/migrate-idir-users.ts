import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import * as csv from '@fast-csv/format';
import yargs from 'yargs/yargs';
import { createContainer } from 'container';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { fetchIdirUser } from 'helpers/webservice-idir';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';

const basePath = path.join(__dirname, 'exports');

const argv = yargs(process.argv.slice(2))
  .options({
    env: { type: 'string', default: '' },
    start: { type: 'number', default: 0 },
    concurrency: { type: 'number', default: 30 },
    totp: { type: 'string', default: '' },
    auto: { type: 'boolean', default: false },
  })
  .parseSync();

const { env, start, concurrency, totp, auto } = argv;

if (!env) {
  console.info(`
IDIR user sanify checks based on the IDIR users in Silver Keycloak instances.

Usages:
  yarn script migrations/migrate-idir-users --env <env> --start <start> --concurrency <concurrency> [--auto]
`);

  process.exit(1);
}

const silverToGoldEnvMap: { [key: string]: string } = {
  dev: 'alpha',
  test: 'beta',
  prod: 'gamma',
};

const container = createContainer(
  { env, totp, auto, allowed: ['dev', 'test', 'prod'] },
  { env: silverToGoldEnvMap[env], totp, auto, allowed: ['alpha', 'beta', 'gamma'] },
);
container(async (baseAdminClient?: KeycloakAdminClient, targetAdminClient?: KeycloakAdminClient) => {
  if (!baseAdminClient || !targetAdminClient) return;

  return new Promise(async (resolve) => {
    const max = concurrency;
    let first = start;
    let total = 0;

    const csvStream = csv.format({
      headers: ['idir_username', 'guid', 'status'],
    });

    if (!fs.existsSync(basePath)) fs.mkdirSync(basePath);
    const writableStream = fs.createWriteStream(
      path.join(basePath, `migrate-idir-users-${env}-${new Date().getTime()}.csv`),
    );

    csvStream.pipe(writableStream).on('end', () => {
      console.log(`${total} users found`);
      resolve();
    });

    const _sanityCheck = sanityCheck.bind(null, baseAdminClient, targetAdminClient, csvStream);

    while (true) {
      const users = await baseAdminClient.users.find({ realm: 'idir', first, max });
      const count = users.length;

      total += count;

      await Promise.all(users.map(_sanityCheck));

      if (count < max) {
        csvStream.end();
        break;
      }

      first = first + max;
      console.log(`${first} users completed.`);
    }
  });
});

async function sanityCheck(
  baseAdminClient: KeycloakAdminClient,
  targetAdminClient: KeycloakAdminClient,
  csvStream: csv.CsvFormatterStream<csv.Row, csv.Row>,
  user: UserRepresentation,
) {
  const { id, username } = user;

  const links = await baseAdminClient.users.listFederatedIdentities({ realm: 'idir', id: id as string });
  if (links.length === 0) {
    csvStream.write({ idir_username: username, status: 'no idp links in the base realm' });
    return;
  }

  const { identityProvider, userId, userName } = links[0];
  if (identityProvider != 'idir') {
    return;
  }

  const standardUsername = `${userName}@idir`;

  let targetUsers = await targetAdminClient.users.find({
    realm: 'standard',
    username: standardUsername,
    exact: true,
  });

  targetUsers = targetUsers.filter((v) => v.username === standardUsername);

  if (targetUsers.length === 0) {
    const users = await fetchIdirUser({ property: 'userId', matchKey: username, env });
    if (users.length === 0) {
      csvStream.write({ idir_username: username, guid: userName, status: 'not found in web service' });
      return;
    }

    const details = users[0];

    const newuser = await targetAdminClient.users.create({
      enabled: true,
      realm: 'standard',
      username: standardUsername,
      email: details.email,
      firstName: details.firstName,
      lastName: details.lastName,
      attributes: {
        display_name: details.displayName,
        idir_user_guid: details.guid,
        idir_username: details.userId,
      },
    });

    const lowerGuid = _.toLower(details.guid);

    await targetAdminClient.users.addToFederatedIdentity({
      realm: 'standard',
      id: newuser.id,
      federatedIdentityId: 'idir',
      federatedIdentity: {
        userId: lowerGuid,
        userName: lowerGuid,
        identityProvider: 'idir',
      },
    });

    csvStream.write({ idir_username: username, guid: userName, status: 'created in the target realm' });
    return;
  }

  const targetUser = targetUsers[0];
  const isValidUser = checkStandardIdirValidity(targetUser, userName as string);

  if (!isValidUser) {
    const links = await targetAdminClient.users.listFederatedIdentities({
      realm: 'standard',
      id: targetUser.id as string,
    });

    if (links.length === 0) {
      csvStream.write({ idir_username: username, guid: userName, status: 'no idp links in the target realm' });
      return;
    }

    const users = await fetchIdirUser({ property: 'userId', matchKey: username, env });
    if (users.length === 0) {
      csvStream.write({ idir_username: username, guid: userName, status: 'not found in web service' });
      return;
    }

    const details = users[0];
    const idpLink = links[0];

    // if two GUIDs from the IDP link and the web service are different,
    // consider invalid IDIR user account.
    if (_.toLower(details.guid) !== _.toLower(idpLink.userName)) {
      const roles = await targetAdminClient.users.listRoleMappings({ realm: 'standard', id: targetUser.id as string });
      const noClientRoleAssigned = roles && _.isEmpty(roles.clientMappings);

      // no client role association, safe to simply delete
      if (noClientRoleAssigned) {
        await targetAdminClient.users.del({ realm: 'standard', id: targetUser.id as string });
        csvStream.write({
          idir_username: username,
          guid: userName,
          status: `GUID does not match; no client roles; deleted`,
        });

        return;
      }

      csvStream.write({
        idir_username: username,
        guid: userName,
        status: `GUID does not match, ${_.keys(roles.clientMappings).join(', ')}`,
      });

      return;
    }

    await targetAdminClient.users.update(
      { realm: 'standard', id: targetUser.id as string },
      {
        email: details.email,
        firstName: details.firstName,
        lastName: details.lastName,
        attributes: {
          display_name: details.displayName,
          idir_user_guid: details.guid,
          idir_username: details.userId,
        },
      },
    );

    csvStream.write({ idir_username: username, guid: userName, status: 'updated in the target realm' });
  }
}

function checkStandardIdirValidity(user: UserRepresentation, baseGuid: string) {
  const { username, email, firstName, lastName, attributes } = user;

  const display_name = _.get(attributes, `display_name.0`);
  const idir_user_guid = _.get(attributes, `idir_user_guid.0`);
  const idir_username = _.get(attributes, `idir_username.0`);

  if (!display_name || !idir_user_guid || !idir_username) {
    return false;
  }

  if (_.toLower(baseGuid) !== _.toLower(idir_user_guid)) {
    return false;
  }

  return true;
}
