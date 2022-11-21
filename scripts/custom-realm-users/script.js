const axios = require('axios');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getKeycloakAdminClient, getGitHubClient } = require('./util');
const githubUsernameRegex = require('github-username-regex');
const dotenv = require('dotenv');

dotenv.config();

const { baseEnv, baseRealm, targetEnv, targetRealm, totp, idirGuidAttrKey, bceidGuidAttrKey, githubIdAttrKey } = argv;

// key value pairs to find guid for an idp. Update if required
const idpGuidKeyMap = {
  azureidir: 'idir_userid',
  idir: 'idir_userid',
  bceidbasic: 'bceid_userid',
  bceidbusiness: 'bceid_userid',
  bceidboth: 'bceid_userid',
  githubbcgov: 'github_id',
  githubpublic: 'github_id',
};

// silver parent realm idp to gold parent realm idp mapping
const silvertoGoldIdpsMap = {
  _azureidir: 'azureidir',
  idir: 'idir',
  _bceid: 'bceidboth',
  _bceidbasic: 'bceidbasic',
  _bceidbusiness: 'bceidbusiness',
  _bceidbasicbusiness: 'bceidboth',
};

const logPrefix = 'MIGRATE SILVER CUSTOM TO GOLD CUSTOM: ';

const baseRealmAliastoIdpMap = {};
const targetRealmAliastoIdpMap = {};
let ghClient = '';
const supportedEnvs = ['dev', 'test', 'prod'];

async function main() {
  if (
    !baseEnv ||
    !baseRealm ||
    !targetEnv ||
    !targetRealm ||
    !supportedEnvs.includes(baseEnv) ||
    !supportedEnvs.includes(targetEnv)
  ) {
    console.info(`
            Usage:
              node migrations/custom-realm-users --base-env <env> --base-realm <realm> --target-env <env> --context-env <env> --target-realm <realm> [--totp <totp>]

            Flags:
              --base-env             Base Keycloak environment to migrate users from. Available values: (dev, test, prod)
              --base-realm           Base realm of the base Keycloak environment to migrate users from
              --target-env           Target Keycloak environment to migrate users to. Available values: (dev, test, prod)
              --target-realm         Target realm of the target Keycloak environment to migrate users to
              --totp                 Time-based One-time Password (TOTP) passed into the Keycloak auth call of the base environment; Optional
              --idir-guid-attr-key   User attribute key that holds AzureIDIR/IDIR Guid; optional, default to idir_userid
              --bceid-guid-attr-key  User attribute key that holds BCeID Guid; optional, default to bceid_userid
              --github-id-attr-key   User attribute key that holds GitHub Id; optional, default to github_id
            `);
    return;
  }

  try {
    // custom attribute keys that hold user guid
    if (idirGuidAttrKey) {
      idpGuidKeyMap['idir'] = idirGuidAttrKey;
      idpGuidKeyMap['azureidir'] = idirGuidAttrKey;
    }

    if (bceidGuidAttrKey) {
      idpGuidKeyMap['bceidbasic'] = bceidGuidAttrKey;
      idpGuidKeyMap['bceidbusiness'] = bceidGuidAttrKey;
      idpGuidKeyMap['bceidboth'] = bceidGuidAttrKey;
    }

    if (githubIdAttrKey) {
      idpGuidKeyMap['githubbcgov'] = githubIdAttrKey;
      idpGuidKeyMap['githubpublic'] = githubIdAttrKey;
    }

    // fetch keycloak admin clients
    const silverKcAdminClient = await getKeycloakAdminClient('silver', baseEnv, baseRealm, { totp });
    const goldKcAdminClient = await getKeycloakAdminClient('gold', targetEnv, targetRealm, { totp });
    if (!silverKcAdminClient || !goldKcAdminClient) return;

    // find all idps from base realm
    const baseRealmIdps = await silverKcAdminClient.identityProviders.find({ realm: baseRealm });

    // create a mapping between base realm idp alias and parent idp
    baseRealmIdps.map((idp) => {
      const urlPrefix = `https://${baseEnv === 'prod' ? '' : baseEnv + '.'}oidc.gov.bc.ca/auth/realms/`;
      const urlSuffix = '/protocol/openid-connect/auth';
      // only oidc and keycloak-oidc provider types are supported
      if (['oidc', 'keycloak-oidc'].includes(idp.providerId) && idp.config.authorizationUrl.startsWith(urlPrefix)) {
        const parentIdp = idp.config.authorizationUrl.substring(
          urlPrefix.length,
          idp.config.authorizationUrl.indexOf(urlSuffix),
        );

        baseRealmAliastoIdpMap[idp.alias] = parentIdp;
      }
    });

    // find all idps from target realm
    const targetRealmIdps = await goldKcAdminClient.identityProviders.find();

    // create a mapping between target realm idp alias and parent idp
    targetRealmIdps.map((idp) => {
      const urlPrefix = `https://${
        targetEnv === 'prod' ? '' : targetEnv + '.'
      }loginproxy.gov.bc.ca/auth/realms/standard/protocol/openid-connect/auth?kc_idp_hint=`;
      // only oidc and keycloak-oidc provider types are supported
      if (['oidc', 'keycloak-oidc'].includes(idp.providerId) && idp.config.authorizationUrl.startsWith(urlPrefix)) {
        let url = new URL(idp.config.authorizationUrl);
        if (url.searchParams.get('kc_idp_hint')) {
          targetRealmAliastoIdpMap[idp.alias] = url.searchParams.get('kc_idp_hint');
        }
      }
    });

    // fetch github client if github users need to be migrated
    if (baseRealmAliastoIdpMap['github']) {
      ghClient = getGitHubClient();
      if (!ghClient) return;
    }

    // if using github then add base realm parent github idp to target realm parent github idp mapping
    if (Object.values(targetRealmAliastoIdpMap).some((idp) => idp.startsWith('github'))) {
      silvertoGoldIdpsMap['_github'] = Object.values(targetRealmAliastoIdpMap).find((idp) => idp.startsWith('github'));
    }

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

        const { identityProvider, userName: ghProviderUsername } = links[0];

        if (!baseRealmAliastoIdpMap[identityProvider]) {
          userReport['invalid-idp'].push(baseUser.username);
          continue;
        }

        const baseRealmUserParentIdp = baseRealmAliastoIdpMap[identityProvider];

        const targetRealmUserParentIdp = silvertoGoldIdpsMap[baseRealmUserParentIdp];

        let baseUserGuid = getBaseUserGuid(baseUser, targetRealmUserParentIdp);

        //fetch idir/bceid/github displayName from user attributes
        let baseUserDisplayName = getBaseUserDisplayName(baseUser);

        //if github_id is not found in user attributes
        if (!baseUserGuid && targetRealmUserParentIdp.startsWith('github')) {
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
        if (!Object.values(targetRealmAliastoIdpMap).some((idp) => idp.includes(targetRealmUserParentIdp))) {
          console.error(
            `${logPrefix}cannot migrate ${baseUser.username} before ${baseUserIdp} idp is added to target realm`,
          );
          continue;
        }

        const targetUsername = `${baseUserGuid}@${targetRealmUserParentIdp}`;

        //check if user already exists in gold custom realm
        let targetUsers = await goldKcAdminClient.users.find({
          realm: targetRealm,
          username: targetUsername,
          exact: true,
        });

        let targetUser = {};

        //if user does not exist already then create
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
            if (targetRealmUserParentIdp.startsWith('idir') || targetRealmUserParentIdp.startsWith('azureidir')) {
              targetUser = await goldKcAdminClient.users.create({
                ...commonUserData,
                attributes: getUserAttributesForIdir(baseUserGuid, baseUserDisplayName, baseUser),
              });
            } else if (targetRealmUserParentIdp.startsWith('bceid')) {
              targetUser = await goldKcAdminClient.users.create({
                ...commonUserData,
                attributes: getUserAttributesForBceid(baseUserGuid, baseUserDisplayName, baseUser),
              });
            } else if (targetRealmUserParentIdp.startsWith('github')) {
              targetUser = await goldKcAdminClient.users.create({
                ...commonUserData,
                attributes: getUserAttributesForGithub(baseUserGuid, baseUserDisplayName, baseUser),
              });
            }
            //create linkage with the identity provider
            await goldKcAdminClient.users.addToFederatedIdentity({
              realm: targetRealm,
              id: targetUser.id,
              federatedIdentityId: getObjKey(targetRealmAliastoIdpMap, targetRealmUserParentIdp),
              federatedIdentity: {
                userId: targetUsername,
                userName: targetUsername,
                identityProvider: getObjKey(targetRealmAliastoIdpMap, targetRealmUserParentIdp),
              },
            });
            userReport['migrated'].push(baseUser.username);
          } catch (err) {
            console.log(`${logPrefix}${targetUsername} migration failed`, err.response.data);
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

//returns user guid, please modify accordingly if required
//by default it uses idp specific user attribute to fetch the guid
const getBaseUserGuid = (baseUser, targetRealmParentIdp) => {
  return _.get(baseUser, `attributes.${idpGuidKeyMap[targetRealmParentIdp]}.0`, false);
};

//returns user display, please modify accordingly if required
//by default it uses idp specific user attribute to fetch the displayName
const getBaseUserDisplayName = (baseUser) => {
  return (baseUser?.attributes?.displayName && baseUser?.attributes?.displayName[0]) || '';
};

const getObjKey = (obj, value) => {
  return Object.keys(obj).find((key) => obj[key] === value);
};

const getUserAttributesForIdir = (guid, name, user) => {
  return {
    display_name: name,
    idir_user_guid: guid,
    idir_username: user.username,
  };
};

const getUserAttributesForBceid = (guid, name, user) => {
  return {
    display_name: name,
    bceid_user_guid: guid,
    bceid_business_guid: (user.attributes.bceid_business_guid && user.attributes.bceid_business_guid[0]) || '',
    bceid_business_name: (user.attributes.bceid_business_name && user.attributes.bceid_business_name[0]) || '',
  };
};

const getUserAttributesForGithub = (guid, name, user) => {
  return {
    display_name: name,
    github_id: guid,
    github_username: user.username,
  };
};
