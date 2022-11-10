const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('../keycloak-core');
const { handleError, ignoreError } = require('../helpers');
const { migrateSilverIdirToGoldStandard } = require('./helpers/migrate-target-idir-users');
const { migrateSilverBceidBothToGoldStandard } = require('./helpers/migrate-target-bceidboth-users');
const { baseEnv, baseRealm, targetEnv, contextEnv, targetRealm = 'standard', targetClient, totp, auto } = argv;

const rolesToExclude = ['admin', 'uma_authorization', 'offline_access'];
const idpToRealmMap = {
  idir: 'idir',
  bceid: '_bceid',
};

const idpToGuidKeyMap = {
  idir: 'idir_userid',
  bceid: 'bceid_userid',
};

const suffixMap = {
  idir: 'idir',
  bceid: 'bceidboth',
};

async function main() {
  if (!baseEnv || !baseRealm || !targetEnv || !contextEnv || !targetClient) {
    console.info(`
    Usage:
      node migrations/mds --base-env <env> --base-realm <realm> --target-env <env> --context-env <env> --target-client <client> [--target-realm <realm>] [--totp <totp>] [--auto]

    Flags:
      --base-env             Base Keycloak environment to migrate users from
      --base-realm           Base realm of the base Keycloak environment to migrate users from
      --target-env           Target Keycloak environment to migrate users to
      --target-realm         Target realm of the target Keycloak environment to migrate users to; Optional, default to 'standard'
      --context-env          Contextual Keycloak environment; used to fetch BCeID users from BCeID web service
      --target-client        Target client of the target realm to migrate users with the associated client roles.
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

    // see if the target client exists first
    const clients = await targetAdminClient.clients.find({ realm: targetRealm, clientId: targetClient, max: 1 });
    if (clients.length === 0) throw Error('client not found');

    const clientId = clients[0].id;

    console.log('Step 1: build the role associations');
    const baseGroups = await baseAdminClient.groups.find({ realm: baseRealm });
    const baseRoles = await baseAdminClient.roles.find({ realm: baseRealm });

    const masterRoleMappings = [];

    for (let x = 0; x < baseGroups.length; x++) {
      const group = baseGroups[x];

      let roleMappings = await baseAdminClient.groups.listRealmRoleMappings({
        realm: baseRealm,
        id: group.id,
      });

      roleMappings = roleMappings.filter((mapping) => !rolesToExclude.includes(mapping.name));

      masterRoleMappings.push({
        type: 'group',
        id: group.id,
        name: group.name,
        children: roleMappings.map((mapping) => mapping.name),
      });
    }

    for (let x = 0; x < baseRoles.length; x++) {
      const role = baseRoles[x];
      if (rolesToExclude.includes(role.name)) continue;

      let roleMappings = await baseAdminClient.roles.getCompositeRolesForRealm({ realm: baseRealm, id: role.id });
      roleMappings = roleMappings.filter((mapping) => !rolesToExclude.includes(mapping.name));

      masterRoleMappings.push({
        type: 'role',
        id: role.id,
        name: role.name,
        children: roleMappings.map((mapping) => mapping.name),
      });
    }

    console.log('Step 2: collect the base user & role mappings');
    const baseUserMap = {};

    for (let x = 0; x < masterRoleMappings.length; x++) {
      const roleMapping = masterRoleMappings[x];

      const users =
        roleMapping.type === 'group'
          ? await baseAdminClient.groups.listMembers({ realm: baseRealm, id: roleMapping.id })
          : await baseAdminClient.roles.findUsersWithRole({ realm: baseRealm, name: roleMapping.name });

      users.forEach((user) => {
        if (!baseUserMap[user.id]) baseUserMap[user.id] = { ...user, roles: [] };
        baseUserMap[user.id].roles.push(roleMapping.name);
      });
    }

    const allBaseUsers = Object.values(baseUserMap);

    console.log('Step 3: find the matching Gold standard users');
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
        const buserGuid = _.get(parentUser, `attributes.${idpToGuidKeyMap[identityProvider]}.0`);

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
    };
    await generateUserReport();

    console.log('Step 4: migrate missing IDIR users');
    if (userReport['not-found-idir-parent'])
      await migrateSilverIdirToGoldStandard(baseAdminClient, targetAdminClient, userReport['not-found-idir-parent']);

    console.log('Step 5: migrate missing BCeID Both users');
    if (userReport['not-found-bceid-parent'])
      await migrateSilverBceidBothToGoldStandard(
        baseAdminClient,
        targetAdminClient,
        userReport['not-found-bceid-parent'],
        contextEnv,
      );

    console.log('Step 6: re-match Gold standard users after migrating missing users');
    await generateUserReport();

    const targetRoleMap = {};
    console.log('Step 7: create client level roles in the target realm');
    for (let x = 0; x < masterRoleMappings.length; x++) {
      const roleMapping = masterRoleMappings[x];

      let role = await targetAdminClient.clients.findRole({
        realm: targetRealm,
        id: clientId,
        roleName: roleMapping.name,
      });

      if (!role) {
        role = await targetAdminClient.clients.createRole({
          id: clientId,
          realm: targetRealm,
          name: roleMapping.name,
          composite: roleMapping.children.length > 0,
          clientRole: true,
          containerId: clientId,
        });

        role = await targetAdminClient.clients.findRole({
          realm: targetRealm,
          id: clientId,
          roleName: roleMapping.name,
        });
      }

      targetRoleMap[roleMapping.name] = role;
    }

    console.log('Step 8: create composite role mappings in the target realm');
    for (let x = 0; x < masterRoleMappings.length; x++) {
      const roleMapping = masterRoleMappings[x];

      const role = await targetAdminClient.clients.findRole({
        realm: targetRealm,
        id: clientId,
        roleName: roleMapping.name,
      });

      const rolesToDel = await targetAdminClient.roles.getCompositeRolesForClient({
        realm: targetRealm,
        clientId: clientId,
        id: role.id,
      });

      const rolesToAdd = await Promise.all(
        roleMapping.children.map((roleName) =>
          targetAdminClient.clients.findRole({
            realm: targetRealm,
            id: clientId,
            roleName,
          }),
        ),
      );

      // remove existing ones first before adding composite roles
      await targetAdminClient.roles.delCompositeRoles({ realm: targetRealm, id: role.id }, rolesToDel);
      await targetAdminClient.roles.createComposite({ realm: targetRealm, roleId: role.id }, rolesToAdd);
    }

    console.log('Step 9: create user role mappings in the target realm');
    for (let x = 0; x < validUserMeta.length; x++) {
      const meta = validUserMeta[x];

      const roleMapping = {
        realm: targetRealm,
        id: meta.targetUserId,
        clientUniqueId: clientId,
      };

      const roleNames = baseUserMap[meta.baseUserId].roles;
      const roles = roleNames.map((roleName) => _.pick(targetRoleMap[roleName], ['id', 'name']));
      const roleMappingUpdate = { ...roleMapping, roles };
      await targetAdminClient.users.addClientRoleMappings(roleMappingUpdate);
    }

    fs.writeFileSync(path.resolve(__dirname, 'mds.json'), JSON.stringify({ masterRoleMappings, userReport }, null, 2));

    process.exit(0);
  } catch (err) {
    handleError(err);
    process.exit(1);
  }
}

main();
