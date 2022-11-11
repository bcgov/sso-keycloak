const axios = require('axios');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('../keycloak-core');
const { handleError, ignoreError } = require('../helpers');
const {
  migrateSilverIdirToGoldStandard,
  migrateGoldStandardIdirToGoldCustom,
} = require('./helpers/migrate-target-idir-users');
const {
  migrateSilverBceidBothToGoldStandard,
  migrateGoldStandardBceidBothToGoldCustom,
} = require('./helpers/migrate-target-bceidboth-users');
const { baseEnv, baseRealm, targetEnv, contextEnv, targetRealm, totp, auto } = argv;

const rolesToExclude = ['admin', 'uma_authorization', 'offline_access'];
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
    await targetAdminClient.realms.findOne({ realm: targetRealm });

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
        if (!parentRealmName) continue;

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
          realm: 'standard',
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
    if (userReport['not-found-idir-parent'])
      await migrateSilverIdirToGoldStandard(baseAdminClient, targetAdminClient, userReport['not-found-idir-parent']);

    console.log('Step 4: migrate missing BCeID Both users');
    if (userReport['not-found-bceid-parent'])
      await migrateSilverBceidBothToGoldStandard(
        baseAdminClient,
        targetAdminClient,
        userReport['not-found-bceid-parent'],
        contextEnv,
      );

    console.log('Step 4: migrate missing BCeID Both users');
    if (userReport['not-found-github-parent'])
      await migrateSilverBceidBothToGoldStandard(
        baseAdminClient,
        targetAdminClient,
        userReport['not-found-bceid-parent'],
        contextEnv,
      );
  } catch (err) {
    handleError(err);
    process.exit(1);
  }
}
main();
