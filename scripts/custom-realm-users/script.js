const axios = require('axios');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getKeycloakAdminClient, getGitHubClient } = require('./util');
const githubUsernameRegex = require('github-username-regex');

const { baseEnv, baseRealm, targetEnv, targetRealm, totp, auto } = argv;

// key value pairs to find guid for an idp. Update if required
const idpGuidMap = { idir: 'idir_userid', bceid: 'bceid_userid', github: 'github_id' };

const logPrefix = 'MIGRATE SILVER CUSTOM TO GOLD CUSTOM: ';

async function main() {
  if (!baseEnv || !baseRealm || !targetEnv || !targetRealm) {
    console.info(`
            Usage:
              node migrations/custom-realm-users --base-env <env> --base-realm <realm> --target-env <env> --context-env <env> --target-realm <realm> [--totp <totp>] [--auto]

            Flags:
              --base-env             Base Keycloak environment to migrate users from
              --base-realm           Base realm of the base Keycloak environment to migrate users from
              --target-env           Target Keycloak environment to migrate users to
              --target-realm         Target realm of the target Keycloak environment to migrate users to; Optional, default to 'standard'
              --totp                 Time-based One-time Password (TOTP) passed into the Keycloak auth call of the base environment; Optional
              --auto                 Skips the confirmation before running the script
            `);

    return;
  }

  try {
    const silverKcAdminClient = await getKeycloakAdminClient('silver', baseEnv, baseRealm, { totp });
    const goldKcAdminClient = await getKeycloakAdminClient('gold', targetEnv, targetRealm, { totp });
    if (!silverKcAdminClient || !goldKcAdminClient) return;

    const ghClient = getGitHubClient();
    if (!ghClient) return;

    const targetRealmIdps = await goldKcAdminClient.identityProviders.find();

    const targetRealmIdpSuffixMap = {};

    targetRealmIdps.map((idp) => {
      if (idp.providerId === 'oidc') {
        let url = new URL(idp.config.authorizationUrl);
        if (url.searchParams.get('kc_idp_hint')) {
          targetRealmIdpSuffixMap[url.searchParams.get('kc_idp_hint')] = idp.alias;
        }
      }
    });

    const targetRealmIdpSuffix = Object.keys(targetRealmIdpSuffixMap);

    userReport = {
      found: [],
      'no-idp': [],
      'invalid-idp': [],
      'no-guid': [],
      'gh-users-not-found': [],
      migrated: [],
    };
    const total = await silverKcAdminClient.users.count({ realm: baseRealm });
    const max = 500;
    let start = 0;
    for (let i = 0; i < Math.ceil(total / max); i++) {
      let userList = await silverKcAdminClient.users.find({
        realm: baseRealm,
        first: start,
        max,
      });

      for (let x = 0; x < userList.length; x++) {
        const baseUser = userList[x];
        const links = await silverKcAdminClient.users.listFederatedIdentities({
          realm: baseRealm,
          id: baseUser.id,
        });

        if (links.length === 0) {
          userReport['no-idp'].push(baseUser.username);
          continue;
        }
        // fetch idp name and user name registered at the idp
        const { identityProvider, userName: ghProviderUsername } = links[0];

        let baseUserIdp = '';

        for (let prop in idpGuidMap) {
          if (identityProvider.includes(prop)) {
            baseUserIdp = prop;
          }
        }

        if (baseUserIdp === '') {
          userReport['invalid-idp'].push(baseUser.username);
          continue;
        }

        //fetch idir/bceid/github userid from user attributes
        let baseUserGuid = _.get(baseUser, `attributes.${idpGuidMap[baseUserIdp]}.0`, false);

        //fetch idir/bceid/github displayName from user attributes
        let baseUserDisplayName = (baseUser?.attributes?.displayName && baseUser?.attributes?.displayName[0]) || '';

        //if github_id is not found in user attributes
        if (!baseUserGuid && baseUserIdp === 'github') {
          // get github_id and display name from github API
          try {
            const ghSearchUsername = githubUsernameRegex.test(baseUser.username)
              ? baseUser.username
              : ghProviderUsername;
            ghuser = await ghClient.rest.users.getByUsername({ username: ghSearchUsername });
            if (!ghuser.data || !ghuser.data.id) {
              console.log(`${logPrefix}user ${baseUser.username} not found in GitHub API`);
              userReport['gh-users-not-found'].push(baseUser.username);
              continue;
            }
          } catch (err) {
            console.error(`${logPrefix}failed migrating user ${baseUser.username} due to ${err.response.data.message}`);
            continue;
          }
          baseUserGuid = ghuser.data.id;
          baseUserDisplayName = ghuser.data.name;
        }

        if (!baseUserGuid) {
          userReport['no-guid'].push(baseUser.username);
          continue;
        }

        //idps need to exist in gold custom realm to migrate users
        if (!targetRealmIdpSuffix.some((suffix) => suffix.includes(baseUserIdp))) {
          console.error(
            `${logPrefix}cannot migrate ${baseUser.username} before ${baseUserIdp} idp is added to target realm`,
          );
          continue;
        }

        let targetUsername = '';

        //construnct username by idp (ex.: idir_user_guid@idir)
        if (baseUserIdp === 'bceid') {
          if (baseUser.attributes.bceid_business_guid && baseUser.attributes.bceid_business_guid[0] !== '') {
            if (targetRealmIdpSuffix.includes('bceidboth')) {
              targetUsername = `${baseUserGuid}@bceidboth`;
            } else if (targetRealmIdpSuffix.includes('bceidbusiness')) {
              targetUsername = `${baseUserGuid}@bceidbusiness`;
            }
          } else {
            if (targetRealmIdpSuffix.includes('bceidboth')) {
              targetUsername = `${baseUserGuid}@bceidboth`;
            } else if (targetRealmIdpSuffix.includes('bceidbasic')) {
              targetUsername = `${baseUserGuid}@bceidbasic`;
            }
          }
        } else if (baseUserIdp === 'github') {
          targetUsername = `${baseUserGuid}@${targetRealmIdpSuffix.find((suffix) => suffix.includes('github'))}`;
        } else if (baseUserIdp === 'idir') {
          targetUsername = `${baseUserGuid}@idir`;
        }

        //check if user already exists in gold custom realm
        let targetUsers = await goldKcAdminClient.users.find({
          realm: targetRealm,
          username: targetUsername,
          exact: true,
        });

        let targetUser = {};

        // if user does not exist already then create
        if (targetUsers.length === 0) {
          try {
            const commonUserData = {
              enabled: true,
              email: baseUser.email,
              firstName: baseUser.firstName,
              lastName: baseUser.lastName,
              realm: targetRealm,
              username: targetUsername,
            };
            if (baseUserIdp === 'idir') {
              targetUser = await goldKcAdminClient.users.create({
                ...commonUserData,
                attributes: {
                  display_name: baseUserDisplayName,
                  idir_user_guid: baseUserGuid,
                  idir_username: baseUser.username,
                },
              });
            } else if (baseUserIdp === 'bceid') {
              targetUser = await goldKcAdminClient.users.create({
                ...commonUserData,
                attributes: {
                  display_name: baseUserDisplayName,
                  bceid_user_guid: baseUserGuid,
                  bceid_business_guid:
                    (baseUser.attributes.bceid_business_guid && baseUser.attributes.bceid_business_guid[0]) || '',
                  bceid_business_name:
                    (baseUser.attributes.bceid_business_name && baseUser.attributes.bceid_business_name[0]) || '',
                },
              });
            } else if (baseUserIdp === 'github') {
              targetUser = await goldKcAdminClient.users.create({
                ...commonUserData,
                attributes: {
                  display_name: baseUserDisplayName,
                  github_id: baseUserGuid,
                  github_username: baseUser.username,
                },
              });
            }
            //create linkage with the identity provider
            await goldKcAdminClient.users.addToFederatedIdentity({
              realm: targetRealm,
              id: targetUser.id,
              federatedIdentityId: targetRealmIdpSuffixMap[targetUsername.split('@')[1]],
              federatedIdentity: {
                userId: targetUsername,
                userName: targetUsername,
                identityProvider: targetRealmIdpSuffixMap[targetUsername.split('@')[1]],
              },
            });
            userReport['migrated'].push(baseUser.username);
          } catch (err) {
            console.log(`${logPrefix}${targetUsername} migration failed`);
          }
        } else {
          userReport['found'].push(baseUser.username);
        }
      }

      start = start + max;
    }
    console.log(userReport);
  } catch (err) {
    console.error(err);
  }
}

main();
