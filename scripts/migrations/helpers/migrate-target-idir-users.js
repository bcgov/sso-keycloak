const _ = require('lodash');
const { handleError, ignoreError } = require('../../helpers');

const migrateSilverIdirToGoldStandard = async (baseAdminClient, targetAdminClient, idirUsernames) => {
  const logPrefix = 'MIGRATE SILVER IDIR TO GOLD STANDARD: ';
  if (!baseAdminClient || !targetAdminClient) return;

  for (let x = 0; x < idirUsernames.length; x++) {
    const username = idirUsernames[x];

    try {
      const baseIdirUsers = await baseAdminClient.users.find({ realm: 'idir', username, max: 1 });
      if (baseIdirUsers.length === 0) {
        console.log(`${logPrefix}not found ${username}`);
        continue;
      }

      const baseIdirUser = baseIdirUsers[0];
      if (!baseIdirUser.attributes.idir_userid) {
        console.log(`${logPrefix}no user guid ${username}`);
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

      let targetIdirUser = await targetAdminClient.users.create({
        ...commonUserData,
        realm: 'idir',
        username: baseIdirGuid,
      });

      targetIdirUser = await targetAdminClient.users.findOne({ realm: 'idir', id: targetIdirUser.id });

      await targetAdminClient.users.addToFederatedIdentity({
        realm: 'idir',
        id: targetIdirUser.id,
        federatedIdentityId: 'idir',
        federatedIdentity: {
          userId: baseIdirGuid,
          userName: baseIdirGuid,
          identityProvider: 'idir',
        },
      });

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
          userId: targetIdirUser.id,
          userName: targetIdirUser.username,
          identityProvider: 'idir',
        },
      });

      console.error(`${logPrefix}${username} created`);
    } catch (err) {
      console.error(`${logPrefix}error with: ${username}`);
      handleError(err);
    }
  }
};

const migrateGoldStandardIdirToGoldCustom = async (baseAdminClient, targetAdminClient, targetRealm, idirUsernames) => {
  const logPrefix = 'MIGRATE GOLD STANDARD IDIR TO GOLD CUSTOM IDIR: ';
  if (!baseAdminClient || !targetAdminClient) return;

  for (let x = 0; x < idirUsernames.length; x++) {
    const username = idirUsernames[x];

    try {
      const baseStandardUsers = await baseAdminClient.users.find({ realm: 'standard', username, max: 1 });
      if (baseStandardUsers.length === 0) {
        console.log(`${logPrefix}not found ${username}`);
        continue;
      }

      const baseStandardUser = baseStandardUsers[0];
      if (!baseStandardUser.attributes.idir_userid) {
        console.log(`${logPrefix}no user guid ${username}`);
        continue;
      }

      const baseStandardUserGuid = baseStandardUser.attributes.idir_userid[0];

      const commonUserData = {
        enabled: true,
        email: baseStandardUser.email,
        firstName: baseStandardUser.firstName,
        lastName: baseStandardUser.lastName,
        attributes: {
          display_name: (baseStandardUser.attributes.displayName && baseStandardUser.attributes.displayName[0]) || '',
          idir_user_guid: baseStandardUserGuid,
          idir_username: username,
        },
      };

      const targetCustomUser = await targetAdminClient.users.create({
        ...commonUserData,
        realm: targetRealm,
        username: `${baseStandardUserGuid}@idir`,
      });

      await targetAdminClient.users.addToFederatedIdentity({
        realm: targetRealm,
        id: targetCustomUser.id,
        federatedIdentityId: 'idir',
        federatedIdentity: {
          userId: baseStandardUser.id,
          userName: baseStandardUser.username,
          identityProvider: 'idir',
        },
      });

      console.error(`${logPrefix}${username} created`);
    } catch (err) {
      console.error(`${logPrefix}error with: ${username}`);
      handleError(err);
    }
  }
};

module.exports = { migrateSilverIdirToGoldStandard, migrateGoldStandardIdirToGoldCustom };
