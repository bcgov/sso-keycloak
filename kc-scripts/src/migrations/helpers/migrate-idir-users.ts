import _ from 'lodash';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { handleError } from 'container';

const logPrefix = 'IDIR: ';
const log = (msg: string) => console.log(`${logPrefix}${msg}`);

export async function migrateIdirUsers(
  baseAdminClient: KeycloakAdminClient,
  targetAdminClient: KeycloakAdminClient,
  idirUsernames = [],
) {
  if (!baseAdminClient || !targetAdminClient) return;

  for (let x = 0; x < idirUsernames.length; x++) {
    const username = idirUsernames[x];

    try {
      let baseIdirUsers = await baseAdminClient.users.find({ realm: 'idir', username, exact: true });
      baseIdirUsers = baseIdirUsers.filter((v) => v.username === username);
      if (baseIdirUsers.length === 0) {
        log(`not found ${username}`);
        continue;
      }

      const baseIdirUser = baseIdirUsers[0];
      if (!baseIdirUser.attributes?.idir_userid) {
        log(`no user guid ${username}`);
        continue;
      }

      const baseIdirGuid = baseIdirUser.attributes.idir_userid[0];

      const commonUserData = {
        enabled: true,
        email: baseIdirUser.email,
        firstName: baseIdirUser.firstName,
        lastName: baseIdirUser.lastName,
        attributes: {
          display_name: (baseIdirUser.attributes.displayName && baseIdirUser.attributes.displayName[0]) || '',
          idir_user_guid: baseIdirGuid,
          idir_username: username,
        },
      };

      const targetStandardUser = await targetAdminClient.users.create({
        ...commonUserData,
        realm: 'standard',
        username: `${baseIdirGuid}@idir`,
      });

      await targetAdminClient.users.addToFederatedIdentity({
        realm: 'standard',
        id: targetStandardUser.id,
        federatedIdentityId: 'idir',
        federatedIdentity: {
          userId: baseIdirGuid,
          userName: baseIdirGuid,
          identityProvider: 'idir',
        },
      });

      log(`${username} created`);
    } catch (err) {
      log(`error with: ${username}`);
      handleError(err);
    }
  }
}
