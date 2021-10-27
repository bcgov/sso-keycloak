const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
const { env, realm = 'master', totp } = argv;

const VIEWER_ROLE = 'viewer';
async function main() {
  if (!env) {
    console.info(`
    Usages:
      node keycloak-create-role-viewer.js --env <env> [--realm <realm>] [--totp <totp>]
    `);

    return;
  }

  try {
    const kcAdminClient = await getAdminClient(env, { totp });
    if (!kcAdminClient) return;

    const prompt = new Confirm(`Are you sure to proceed in realm ${realm} of ${env} environment?`);
    const answer = await prompt.run();

    if (!answer) return;

    const existingRole = await kcAdminClient.roles.findOneByName({ name: VIEWER_ROLE, realm });

    // Create the `viewer` role if not exists
    if (!existingRole) {
      await kcAdminClient.roles.create({
        name: VIEWER_ROLE,
        description: VIEWER_ROLE,
        clientRole: false,
        containerId: 'master',
      });
    }

    // Find all client roles that has `view` privilege for each realm
    const clients = await kcAdminClient.clients.find({ realm });
    const targetRoles = [];
    await Promise.all(
      clients.map(async (client) => {
        const roles = await kcAdminClient.clients.listRoles({ realm, id: client.id });
        _.each(roles, (role) => {
          if (['view-realm', 'view-users'].includes(role.name)) {
            targetRoles.push(role);
          }
        });
      }),
    );

    // Create composite roles for the `viewer` role to attach the target roles
    const role = await kcAdminClient.roles.findOneByName({ realm, name: VIEWER_ROLE });
    await kcAdminClient.roles.createComposite({ roleId: role.id }, targetRoles);
  } catch (err) {
    if (err.response) {
      console.error(err.response.data && err.response.data.error);
    } else {
      console.error(err.message || err);
    }
  }
}

main();
