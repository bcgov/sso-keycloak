const { getAdminClient } = require('./keycloak-core');
const fs = require('fs');
const path = require('path');
const { argv } = require('yargs');
const { env, json } = argv;
const { readJSON } = require('./utils');

const processed = [];
const unprocessed = [];

const basePath = path.join(__dirname, 'exports');

const restoreUsers = async () => {
  if (!env || !json) {
    console.info(`
    Pre-requisites:
      * RUN select json_agg(row_to_json(my_row)) from (select * FROM KC_DELETED_USERS WHERE TIMESTAMP > CURRENT_DATE AND ENVIRONMENT = <env>) as my_row;
      * Save the output in JSON format and place it under <root>/scripts folder

    Usages:
      node restore-idir-users-with-roles.js --env <env> --json <jsonfile>

    Examples:
      node restore-idir-users-with-roles.js --env dev --json dev-users.json
    `);

    return;
  }

  const keycloakAdmin = await getAdminClient(env);
  const totalUsers = readJSON(`${__dirname}/${json}`);
  const realmRoles = await keycloakAdmin.roles.find({ realm: 'standard' });

  for (let kuser of totalUsers) {
    try {
      kuser.attributes = JSON.parse(kuser.attributes);
      kuser.realm_roles = kuser.realm_roles;
      kuser.client_roles = kuser.client_roles.map((client) => JSON.parse(client));

      let newUser = null;

      const us = await keycloakAdmin.users.find({ realm: 'standard', username: kuser.username, max: 1 });
      if (us.length === 0) {
        console.log('creating user...');
        const createdUser = await keycloakAdmin.users.create({
          realm: 'standard',
          username: kuser.username,
          email: kuser.email,
          enabled: true,
          firstName: kuser.first_name,
          lastName: kuser.last_name,
          attributes: kuser.attributes,
        });
        newUser = createdUser;
      } else {
        newUser = us[0];
      }

      const rolesToAssign = kuser.realm_roles
        .map((roleName) => realmRoles.find((role) => role.name === roleName))
        .filter((role) => role);

      await keycloakAdmin.users.addRealmRoleMappings({
        id: newUser.id,
        realm: 'standard',
        roles: rolesToAssign,
      });

      const fedList = await keycloakAdmin.users.listFederatedIdentities({ realm: 'standard', id: newUser.id });

      if (fedList.length === 0) {
        await keycloakAdmin.users.addToFederatedIdentity({
          realm: 'standard',
          id: newUser.id,
          federatedIdentityId: 'idir',
          federatedIdentity: {
            userId: kuser.username.split('@')[0],
            userName: kuser.username.split('@')[0],
            identityProvider: 'idir',
          },
        });
      }

      if (kuser.client_roles !== '') {
        for (cl of kuser.client_roles) {
          const clients = await keycloakAdmin.clients.find({
            realm: 'standard',
            clientId: cl.client,
            max: 1,
          });

          let croles = [];

          for (role of cl.roles) {
            const r = await keycloakAdmin.clients.findRole({
              realm: 'standard',
              id: String(clients[0].id),
              roleName: role,
            });
            croles.push({ id: r.id, name: r.name });
          }

          const roleMapping = {
            realm: 'standard',
            id: newUser.id,
            clientUniqueId: String(clients[0].id),
          };

          const roleMappingUpdate = {
            ...roleMapping,
            roles: croles,
          };

          await keycloakAdmin.users.addClientRoleMappings(roleMappingUpdate);
        }
      }
      processed.push(kuser);
      console.log('processed', processed.length);
    } catch (err) {
      console.log(err);
      unprocessed.push(kuser);
      console.log('unprocessed', unprocessed.length);
      continue;
    }
  }

  if (!fs.existsSync(basePath)) fs.mkdirSync(basePath);
  fs.writeFileSync(
    path.resolve(basePath, `restore-${env}-${new Date().getTime()}.json`),
    JSON.stringify({ processed, unprocessed }, null, 2),
  );
};

restoreUsers();
