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
      * Run SELECT * FROM KC_DELETED_USERS WHERE TIMESTAMP > CURRENT_DATE AND ENVIRONMENT = <env>; to fetch deleted user data by environment
      * Save the output in JSON format and place it under <root>/scripts folder

    Usages:
      node restore-idir-users-with-roles.js --env <env> --json <jsonfile>

    Examples:
      node restore-idir-users-with-roles.js --env dev --json dev-users.json
    `);

    return;
  }

  const totalUsers = readJSON(`${__dirname}/${json}`);

  for (let kuser of totalUsers) {
    try {
      kuser.attributes = JSON.parse(kuser.attributes);
      kuser.realm_roles = kuser.realm_roles.slice(1, -1).split(',');
      let clientRoles = JSON.parse('[' + kuser.client_roles.slice(1, -1) + ']');
      kuser.client_roles = clientRoles.map((ob) => JSON.parse(ob));

      const keycloakAdmin = await getAdminClient(env);

      let newUser = null;

      const us = await keycloakAdmin.users.find({ realm: 'standard', username: kuser.username, max: 1 });

      if (us.length === 0) {
        const createdUser = await keycloakAdmin.users.create({
          realm: 'standard',
          username: kuser.username,
          email: kuser.email,
          enabled: true,
          firstName: kuser.first_name,
          lastName: kuser.last_name,
          attributes: kuser.attributes,
          realmRoles: kuser.realm_roles,
        });
        newUser = createdUser;
      } else {
        newUser = us[0];
      }

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
