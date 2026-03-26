import _ from 'lodash';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { fetchIdirUser } from 'helpers/webservice-idir';
import { handleError } from 'container';

const logPrefix = 'IDIR: ';
const log = (msg: string) => console.log(`${logPrefix}${msg}`);

export async function migrateIdirUsers(
  baseAdminClient: KeycloakAdminClient,
  targetAdminClient: KeycloakAdminClient,
  targetUsernames = [],
  env: string,
) {
  const result = {
    'not-found-in-parent': [],
    'no-guid-in-parent': [],
    'not-found-in-webservice': [],
    'guid-not-match': [],
    'has-error': [],
  };

  if (!baseAdminClient || !targetAdminClient || !env) return result;

  for (let x = 0; x < targetUsernames.length; x++) {
    const username = targetUsernames[x];

    try {
      let baseIdirUsers = await baseAdminClient.users.find({ realm: 'idir', username, exact: true });
      baseIdirUsers = baseIdirUsers.filter((v) => v.username === username);
      if (baseIdirUsers.length === 0) {
        result['not-found-in-parent'].push(username);
        log(`not found ${username}`);
        continue;
      }

      const baseIdirUser = baseIdirUsers[0];
      if (!baseIdirUser.attributes?.idir_userid) {
        result['no-guid-in-parent'].push(username);
        log(`no user guid ${username}`);
        continue;
      }

      const baseGuid = baseIdirUser.attributes.idir_userid[0];

      const users = await fetchIdirUser({ property: 'userId', matchKey: username, env });
      if (users.length === 0) {
        result['not-found-in-webservice'].push(username);
        log(`not found in bceid web service ${username}`);
        continue;
      }

      const details = users[0];
      const lowerGuid = _.toLower(details.guid);

      if (_.toLower(baseGuid) !== lowerGuid) {
        result['guid-not-match'].push(username);
        log(`GUID does not match ${username}: ${baseGuid} > ${lowerGuid}`);
        continue;
      }

      const commonUserData = {
        enabled: true,
        email: details.email,
        firstName: details.firstName,
        lastName: details.lastName,
        attributes: {
          display_name: details.displayName,
          idir_user_guid: details.guid,
          idir_username: details.userId,
        },
      };

      const targetStandardUser = await targetAdminClient.users.create({
        ...commonUserData,
        realm: 'standard',
        username: `${lowerGuid}@idir`,
      });

      await targetAdminClient.users.addToFederatedIdentity({
        realm: 'standard',
        id: targetStandardUser.id,
        federatedIdentityId: 'idir',
        federatedIdentity: {
          userId: lowerGuid,
          userName: lowerGuid,
          identityProvider: 'idir',
        },
      });

      log(`${username} created`);
    } catch (err) {
      result['has-error'].push(username);
      log(`error with: ${username}`);
      handleError(err);
    }
  }

  return result;
}
