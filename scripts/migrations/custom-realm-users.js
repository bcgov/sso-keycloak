const axios = require('axios');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('../keycloak-core');
const { handleError, ignoreError } = require('../helpers');
const { migrateSilverIdirToGoldStandard } = require('./helpers/migrate-target-idir-users');
const { migrateSilverBceidBothToGoldStandard } = require('./helpers/migrate-target-bceidboth-users');

const { baseEnv, baseRealm, targetEnv, contextEnv, targetRealm, totp, auto } = argv;

const idpToRealmMap = {
  idir: 'idir',
  bceid: '_bceid',
  github: '_github',
};

const idpToGuidKeyMap = {
  idir: 'idir_userid',
  bceid: 'bceid_userid',
};

const suffixMap = {
  idir: 'idir',
  bceid: 'bceidboth',
  githu: 'github',
};

const fetchGithubId = async (username) => {
  try {
    const { id: github_id } = await axios.get(`https://api.github.com/users/${username}`).then((res) => res.data);
    return github_id;
  } catch {
    return null;
  }
};

async function main() {
  if (!baseEnv || !baseRealm || !targetEnv || !contextEnv || !targetRealm) {
    console.info(`
        Usage:
          node migrations/custom-realm-users --base-env <env> --base-realm <realm> --target-env <env> --context-env <env> --target-realm <realm> [--totp <totp>] [--auto]

        Flags:
          --base-env             Base Keycloak environment to migrate users from
          --base-realm           Base realm of the base Keycloak environment to migrate users from
          --target-env           Target Keycloak environment to migrate users to
          --target-realm         Target realm of the target Keycloak environment to migrate users to; Optional, default to 'standard'
          --context-env          Contextual Keycloak environment; used to fetch BCeID users from BCeID web service
          --totp                 Time-based One-time Password (TOTP) passed into the Keycloak auth call of the base environment; Optional
          --auto                 Skips the confirmation before running the script
        `);

    return;
  }

  try {
    const baseAdminClient = await getAdminClient(baseEnv, { totp });
    const targetAdminClient = await getAdminClient(targetEnv);
    if (!baseAdminClient || !targetAdminClient) return;

    if (!auto) {
      const prompt = new Confirm(`Are you sure to proceed?`);
      const answer = await prompt.run();
      if (!answer) return;
    }

    // see if the target realm exists first
    let targetRealmExists = await targetAdminClient.realms.findOne({ realm: targetRealm });

    console.log('Step 1: list all the users');
    const offset = 500;
    const total = await baseAdminClient.users.count({ realm: baseRealm });
    let allBaseUsers = [];

    for (let i = 0; i < Math.ceil(total / offset); i++) {
      let userList = await baseAdminClient.users.find({ realm: baseRealm, first: offset * i, max: offset * (i + 1) });
      allBaseUsers = allBaseUsers.concat(userList);
    }
    console.log('Step 2: find the matching Gold standard users');
    let idpMap = {};
    let userReport = {};
    let validUserMeta = [];

    const generateUserReport = async () => {
      idpMap = {};

      userReport = {
        found: [],
        'no-idp': [],
        'invalid-idp': [],
        'no-guid': [],
      };

      validUserMeta = [];

      for (let x = 0; x < allBaseUsers.length; x++) {
        const buser = allBaseUsers[x];
        const links = await baseAdminClient.users.listFederatedIdentities({
          realm: baseRealm,
          id: buser.id,
        });

        if (links.length === 0) {
          userReport['no-idp'].push(buser.username);
          continue;
        }

        const { identityProvider, userId } = links[0];
        const parentRealmName = idpToRealmMap[identityProvider];
        if (!parentRealmName) {
          userReport['invalid-idp'].push(buser.username);
          continue;
        }

        const parentUser = await baseAdminClient.users.findOne({ realm: parentRealmName, id: userId });
        let buserGuid = _.get(parentUser, `attributes.${idpToGuidKeyMap[identityProvider]}.0`);

        if (!buserGuid && identityProvider === 'github') {
          buserGuid = await fetchGithubId(buser.username.split('@')[0]);
        }

        if (!buserGuid) {
          userReport['no-guid'].push(buser.username);
          continue;
        }

        if (!idpMap[identityProvider]) idpMap[identityProvider] = 0;
        idpMap[identityProvider]++;

        let tusers = await targetAdminClient.users.find({
          realm: targetRealm,
          username: `${buserGuid}@${suffixMap[identityProvider]}`,
          exact: true,
        });

        if (tusers.length === 0) {
          const key = `not-found-${identityProvider}`;
          const keyParent = `not-found-${identityProvider}-parent`;
          if (!userReport[key]) userReport[key] = [];
          if (!userReport[keyParent]) userReport[keyParent] = [];
          userReport[key].push(buser.username);
          userReport[keyParent].push(parentUser.username);
        } else {
          userReport['found'].push(buser.username);
          validUserMeta.push({ baseUserId: buser.id, targetUserId: tusers[0].id });
        }
      }
      console.log(userReport);
    };
    await generateUserReport();

    console.log('Step 3: migrate missing IDIR users');

    let logPrefix = 'MIGRATE SILVER IDIR TO GOLD CUSTOM: ';
    const idirUsernames = userReport['not-found-idir-parent'];

    if (idirUsernames) {
      for (let x = 0; x < idirUsernames.length; x++) {
        const username = idirUsernames[x];

        try {
          const baseIdirUsers = await baseAdminClient.users.find({ realm: baseRealm, username, max: 1 });
          if (baseIdirUsers.length === 0) {
            console.log(`${logPrefix}not found ${username}`);
            continue;
          }

          const baseIdirUser = baseIdirUsers[0];
          if (!baseIdirUser.attributes || !baseIdirUser.attributes.idir_userid) {
            console.log(`${logPrefix}no user guid ${username}`);
            continue;
          }

          const baseIdirUserGuid = baseIdirUser.attributes.idir_userid[0];

          const commonUserData = {
            enabled: true,
            email: baseIdirUser.email,
            firstName: baseIdirUser.firstName,
            lastName: baseIdirUser.lastName,
            attributes: {
              display_name: (baseIdirUser.attributes.displayName && baseIdirUser.attributes.displayName[0]) || '',
              idir_user_guid: baseIdirUserGuid,
              idir_username: username,
            },
          };

          const targetIdirCustomUser = await targetAdminClient.users.create({
            ...commonUserData,
            realm: targetRealm,
            username: `${baseIdirUserGuid}@idir`,
          });

          await targetAdminClient.users.addToFederatedIdentity({
            realm: targetRealm,
            id: targetIdirCustomUser.id,
            federatedIdentityId: 'idir',
            federatedIdentity: {
              userId: `${baseIdirUserGuid}@idir`,
              userName: `${baseIdirUserGuid}@idir`,
              identityProvider: 'idir',
            },
          });

          console.log(`${logPrefix}${username} created`);
        } catch (err) {
          console.error(`${logPrefix}error with: ${username}`);
          handleError(err);
        }
      }
    }

    console.log('Step 4: migrate missing BCeID Both users');

    logPrefix = 'MIGRATE SILVER BCEID BOTH TO GOLD CUSTOM: ';
    const bceidUsernames = userReport['not-found-bceid-parent'];

    if (bceidUsernames) {
      for (let x = 0; x < bceidUsernames.length; x++) {
        const username = bceidUsernames[x];

        try {
          const baseBceidUsers = await baseAdminClient.users.find({ realm: baseRealm, username, max: 1 });
          if (baseBceidUsers.length === 0) {
            console.log(`${logPrefix}not found ${username}`);
            continue;
          }

          const baseBceidUser = baseBceidUsers[0];
          if (!baseBceidUser.attributes || !baseBceidUser.attributes.bceid_userid) {
            console.log(`${logPrefix}no user guid ${username}`);
            continue;
          }

          const baseBceidUserGuid = baseBceidUser.attributes.bceid_userid[0];

          const details =
            (await fetchBceidUser({ accountType: 'Business', matchKey: baseBceidUserGuid, env })) ||
            (await fetchBceidUser({ accountType: 'Individual', matchKey: baseBceidUserGuid, env }));

          if (!details) {
            console.log(`${logPrefix}not found in bceid web service ${username}`);
            continue;
          }

          const commonUserData = {
            enabled: true,
            email: baseBceidUser.email,
            firstName: '',
            lastName: '',
            attributes: {
              display_name: (baseBceidUser.attributes.displayName && baseBceidUser.attributes.displayName[0]) || '',
              bceid_user_guid: details.guid,
              bceid_username: details.userId,
              bceid_type: details.type,
              bceid_business_guid: details.businessGuid,
              bceid_business_name: details.businessLegalName,
            },
          };

          const targetBceidCustomUser = await targetAdminClient.users.create({
            ...commonUserData,
            realm: targetRealm,
            username: `${baseBceidUserGuid}@bceid`,
          });

          await targetAdminClient.users.addToFederatedIdentity({
            realm: targetRealm,
            id: targetBceidCustomUser.id,
            federatedIdentityId: 'bceid',
            federatedIdentity: {
              userId: `${baseBceidUserGuid}@bceid`,
              userName: `${baseBceidUserGuid}@bceid`,
              identityProvider: 'bceid',
            },
          });

          console.log(`${logPrefix}${username} created`);
        } catch (err) {
          console.error(`${logPrefix}error with: ${username}`);
          handleError(err);
        }
      }
    }

    console.log('Step 5: migrate missing GitHub users');

    logPrefix = 'MIGRATE SILVER GITHUB TO GOLD CUSTOM: ';
    const githubUsernames = userReport['not-found-github-parent'];

    if (githubUsernames) {
      for (let x = 0; x < githubUsernames.length; x++) {
        const username = githubUsernames[x];
        let baseUserDisplayName = '';
        let baseUserGuid = '';
        try {
          const baseGithubUsers = await baseAdminClient.users.find({ realm: baseRealm, username, max: 1 });
          if (baseGithubUsers.length === 0) {
            log(`not found ${username}`);
            continue;
          }

          const baseGithubUser = baseGithubUsers[0];

          let { github_id: baseGithubUserGuid, display_name: baseGithubUserDisplayName } = await fetchGithubUserDetails(
            username,
          );

          if (!baseGithubUserGuid) {
            console.error(`${logPrefix}github_id not found for user ${username}`);
            continue;
          }

          const commonGithubUserData = {
            enabled: true,
            email: baseGithubUser.email,
            firstName: baseGithubUser.firstName,
            lastName: baseGithubUser.lastName,
            attributes: {
              display_name:
                (baseGithubUser.attributes &&
                  baseGithubUser.attributes.displayName &&
                  baseIdirUser.attributes.displayName[0]) ||
                baseGithubUserDisplayName ||
                '',
              github_id: baseGithubUserGuid,
              github_username: username,
            },
          };

          const targetGithubCustomUser = await targetAdminClient.users.create({
            ...commonGithubUserData,
            realm: targetRealm,
            username: `${baseGithubUserGuid}@github`,
          });

          await targetAdminClient.users.addToFederatedIdentity({
            realm: targetRealm,
            id: targetGithubCustomUser.id,
            federatedIdentityId: 'github',
            federatedIdentity: {
              userId: `${baseGithubUserGuid}@github`,
              userName: `${baseGithubUserGuid}@github`,
              identityProvider: 'github',
            },
          });

          console.log(`${logPrefix}${username} created`);
        } catch (err) {
          console.error(`${logPrefix}error with: ${username}`);
          handleError(err);
        }
      }
    }
  } catch (err) {
    handleError(err);
    process.exit(1);
  }
}
main();

const fetchGithubUserDetails = async (username) => {
  try {
    const { id: github_id, name: display_name } = await axios
      .get(`https://api.github.com/users/${username}`)
      .then((res) => res.data);
    return { github_id, display_name };
  } catch {
    return null;
  }
};
