import _ from 'lodash';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { fetchBceidUser } from 'helpers/webservice-bceid';
import { handleError } from 'container';

const logPrefix = 'BCEID: ';
const log = (msg: string) => console.log(`${logPrefix}${msg}`);

export async function migrateBceidUsers(
  baseAdminClient: KeycloakAdminClient,
  targetAdminClient: KeycloakAdminClient,
  bceidUsernames = [],
  env: string,
) {
  if (!baseAdminClient || !targetAdminClient || !env) return;

  for (let x = 0; x < bceidUsernames.length; x++) {
    const username = bceidUsernames[x];

    try {
      let baseUsers = await baseAdminClient.users.find({ realm: '_bceid', username, exact: true });
      baseUsers = baseUsers.filter((v) => v.username === username);
      if (baseUsers.length === 0) {
        log(`not found ${username}`);
        continue;
      }

      const baseUser = baseUsers[0];
      if (!baseUser.attributes?.bceid_userid) {
        log(`no user guid ${username}`);
        continue;
      }

      const baseBceidGuid = baseUser.attributes.bceid_userid[0];

      const details =
        (await fetchBceidUser({ accountType: 'Business', matchKey: baseBceidGuid, env })) ||
        (await fetchBceidUser({ accountType: 'Individual', matchKey: baseBceidGuid, env }));

      if (!details) {
        log(`not found in bceid web service ${username}`);
        continue;
      }

      const commonUserData = {
        enabled: true,
        email: details.email,
        firstName: '',
        lastName: '',
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
        username: `${baseBceidGuid}@bceidboth`,
      });

      await targetAdminClient.users.addToFederatedIdentity({
        realm: 'standard',
        id: targetStandardUser.id,
        federatedIdentityId: 'bceidboth',
        federatedIdentity: {
          userId: baseBceidGuid,
          userName: baseBceidGuid,
          identityProvider: 'bceidboth',
        },
      });

      log(`${username} created`);
    } catch (err) {
      log(`error with: ${username}`);
      handleError(err);
    }
  }
}
