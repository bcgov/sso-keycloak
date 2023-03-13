import _ from 'lodash';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { fetchBceidUser } from 'helpers/webservice-bceid';
import { handleError } from 'container';

const logPrefix = 'BCEID: ';
const log = (msg: string) => console.log(`${logPrefix}${msg}`);

export async function migrateBceidUsers(
  baseAdminClient: KeycloakAdminClient,
  targetAdminClient: KeycloakAdminClient,
  targetUsernames = [],
  env: string,
) {
  const result = {
    'not-found-in-parent': [],
    'no-guid-in-parent': [],
    'not-found-in-webservice': [],
    'has-error': [],
  };

  if (!baseAdminClient || !targetAdminClient || !env) return;

  for (let x = 0; x < targetUsernames.length; x++) {
    const username = targetUsernames[x];

    try {
      let baseUsers = await baseAdminClient.users.find({ realm: '_bceid', username, exact: true });
      baseUsers = baseUsers.filter((v) => v.username === username);
      if (baseUsers.length === 0) {
        result['not-found-in-parent'].push(username);
        log(`not found ${username}`);
        continue;
      }

      const baseUser = baseUsers[0];
      if (!baseUser.attributes?.bceid_userid) {
        result['no-guid-in-parent'].push(username);
        log(`no user guid ${username}`);
        continue;
      }

      const baseGuid = baseUser.attributes.bceid_userid[0];

      const details =
        (await fetchBceidUser({ accountType: 'Business', matchKey: baseGuid, env })) ||
        (await fetchBceidUser({ accountType: 'Individual', matchKey: baseGuid, env }));

      if (!details) {
        result['not-found-in-webservice'].push(username);
        log(`not found in bceid web service ${username}`);
        continue;
      }

      const commonUserData = {
        enabled: true,
        email: details.email,
        firstName: details.displayName,
        lastName: details.userId,
        attributes: {
          display_name: details.displayName,
          bceid_user_guid: details.guid,
          bceid_username: details.userId,
          bceid_type: details.type,
          bceid_business_guid: details.businessGuid,
          bceid_business_name: details.businessLegalName,
        },
      };

      const targetStandardUser = await targetAdminClient.users.create({
        ...commonUserData,
        realm: 'standard',
        username: `${baseGuid}@bceidboth`,
      });

      await targetAdminClient.users.addToFederatedIdentity({
        realm: 'standard',
        id: targetStandardUser.id,
        federatedIdentityId: 'bceidboth',
        federatedIdentity: {
          userId: baseGuid.toLowerCase(),
          userName: baseGuid.toLowerCase(),
          identityProvider: 'bceidboth',
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
