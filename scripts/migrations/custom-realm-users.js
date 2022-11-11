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
    let users = [];

    for (let i = 0; i <= Math.ceil(total / offset); i++) {
      users = await baseAdminClient.users.find({ realm: baseRealm, first: offset * i, max: offset * (i + 1) });
      console.log(users);
    }
  } catch (err) {
    handleError(err);
    process.exit(1);
  }
}
main();
