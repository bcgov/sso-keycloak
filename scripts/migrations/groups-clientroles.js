const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('../keycloak-core');
const { handleError, ignoreError } = require('../helpers');
const { baseEnv, baseRealm, targetEnv, targetRealm = 'standard', targetClient, auto } = argv;

// this script helps migrate groups from one realm to a client-level including user associations.
async function main() {
  if (!baseEnv || !baseRealm || !targetEnv || !targetClient) {
    console.info(`
    Usages:
      node role-migrations/groups-clientroles.js --base-env <env> --base-realm <realm> --target-env <env> --target-client <client> [--target-realm <realm>] [--auto]
    `);

    return;
  }

  try {
    const baseAdminClient = await getAdminClient(baseEnv);
    const targetAdminClient = await getAdminClient(targetEnv);
    if (!baseAdminClient || !targetAdminClient) return;

    if (!auto) {
      const prompt = new Confirm(`Are you sure to proceed?`);
      const answer = await prompt.run();
      if (!answer) return;
    }

    // see if the target client exists first
    const clients = await targetAdminClient.clients.find({ realm: targetRealm, clientId: targetClient, max: 1 });
    if (clients.length === 0) throw Error('client not found');

    const clientId = clients[0].id;

    const max = 50;
    let first = 0;
    let total = 0;

    while (true) {
      // find the group list in this batch
      const groups = await baseAdminClient.groups.find({ realm: baseRealm, first, max });

      const count = groups.length;
      total += count;

      for (let x = 0; x < groups.length; x++) {
        const { id: groupId, name } = groups[x];

        // find the role in the target realm to see if already exists, otherwise create one
        let role = await targetAdminClient.clients.findRole({ realm: targetRealm, id: clientId, roleName: name });
        if (role) {
          console.log(`=====> "${role.name}" already exists in the standard realm.`);
        } else {
          await targetAdminClient.clients.createRole({
            id: clientId,
            realm: targetRealm,
            name,
            description: '',
            composite: false,
            clientRole: true,
            containerId: clientId,
            attributes: {},
          });
          role = await targetAdminClient.clients.findRole({ realm: targetRealm, id: clientId, roleName: name });
          console.log(`=====> "${role.name}" created in the standard realm.`);
        }

        // find all members belong to the group in the base realm
        const members = await baseAdminClient.groups.listMembers({
          realm: baseRealm,
          id: groupId,
          first: 0,
          max: 1000,
        });
        console.log(`"${role.name}" has ${members.length} users associated.`);

        // iterate the users in the target realm to assign them to the role
        // let's consider IDIR users are only valid.
        for (let y = 0; y < members.length; y++) {
          const { username, attributes } = members[y];
          if (!username.endsWith('@idir')) {
            console.log(`"${role.name}": "${username}" is not idir user.`);
            continue;
          }

          const idirguid = _.get(attributes, 'idir_user_guid.0');
          if (!idirguid) {
            console.log(`"${role.name}": "${username}" is not valid idir user.`);
            continue;
          }

          const targetUsers = await targetAdminClient.users.find({
            realm: targetRealm,
            username: `${idirguid}@idir`,
            max: 1,
          });

          if (targetUsers.length === 0) {
            console.log(`"${role.name}": "${idirguid}@idir" not found in the standard realm.`);
            continue;
          }

          const targetUser = targetUsers[0];

          const roleMappingUpdate = {
            realm: targetRealm,
            id: targetUser.id,
            clientUniqueId: clientId,
            roles: [{ id: role.id, name: role.name }],
          };

          await targetAdminClient.users.addClientRoleMappings(roleMappingUpdate);
          console.log(`"${role.name}": "${idirguid}@idir" is assigned in the standard realm.`);
        }
      }

      first = first + max;
      if (count < max) break;

      await baseAdminClient.reauth();
      await targetAdminClient.reauth();
    }

    console.log(`=====> ${total} groups imported.`);
    process.exit(0);
  } catch (err) {
    handleError(err);
    process.exit(1);
  }
}

main();
