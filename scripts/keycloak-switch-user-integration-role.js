const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
const { env, realm, currentRole, newRole } = argv;

// The number of users to update per prompt.
const MAX_USERS = 100;

/**
 * Adds the provided role newRole to all users in the given environment and realm with the role currentRole.
 * Expects newRole to exist.
 */
async function main() {
  if (!env || !realm || !currentRole || !newRole) {
    console.info(`
    Usages:
      node keycloak-switch-user-integration-role.js --env <env> --realm <realm> --currentRole <previous role> --newRole <new role>
    `);

    return;
  }

  try {
    const kcAdminClient = await getAdminClient(env);
    if (!kcAdminClient) return;

    let prompt = new Confirm(`Are you sure to proceed in realm ${realm} of ${env} environment?`);
    let answer = await prompt.run();

    if (!answer) return;

    const roles = await kcAdminClient.roles.find({ realm });
    const newFoundRole = roles.find((r) => r.name === newRole);
    if (!newFoundRole) {
      console.info('The provided role to add is not found. Exiting.');
      return;
    }

    let pageCount = 0;

    while (true) {
      const users = await kcAdminClient.roles.findUsersWithRole({
        name: currentRole,
        realm,
        first: pageCount * MAX_USERS,
        max: MAX_USERS,
      });

      pageCount++;

      // Exit as soon as no users returned
      if (!users?.length) {
        break;
      }

      prompt = new Confirm(
        `Found the following users with role ${currentRole}: \n\n ${users
          .map((u) => u.email)
          .join(',\n ')}\n\nWould you like to proceed with adding the new role ${newRole} to them?`,
      );
      answer = await prompt.run();
      if (!answer) return;

      users.forEach(async (u) => {
        await kcAdminClient.users.addRealmRoleMappings({
          id: u.id,
          realm,
          roles: [
            {
              id: newFoundRole.id,
              name: newRole,
            },
          ],
        });
      });
    }

    console.log('Added roles. Exiting');
  } catch (err) {
    console.error(err);
  }
}

main();
