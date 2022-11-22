const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
const { handleError, ignoreError } = require('./helpers');
const { env, auto } = argv;

const prefix = 'client-';

const envMap = {
  alpha: 'dev',
  beta: 'test',
  gamma: 'prod',
};

async function main() {
  if (!env || !['alpha', 'beta', 'gamma'].includes(env)) {
    console.info(`
Prints Terraform import statements to import the standard client-representative realm roles.

Usages:
  node keycloak-gold-standard-client-rep-roles-terraform-imports --env <env> [--auto]
`);

    return;
  }

  try {
    const adminClient = await getAdminClient(env);
    if (!adminClient) return;

    if (!auto) {
      const prompt = new Confirm(`Are you sure to proceed?`);
      const answer = await prompt.run();
      if (!answer) return;
    }

    const max = 500;
    let first = 0;
    let total = 0;

    const result = [];

    while (true) {
      const roles = await adminClient.roles.find({ realm: 'standard' });

      const count = roles.length;
      total += count;

      for (let x = 0; x < roles.length; x++) {
        const role = roles[x];
        if (!role.name.startsWith(prefix)) continue;

        const clientId = role.name.substring(prefix.length);

        const clients = await adminClient.clients.find({ realm: 'standard', clientId: clientId });
        if (clients.length === 0) {
          console.log(`client not found: ${clientId}`);
          continue;
        }

        const usersWithRole = await adminClient.roles.findUsersWithRole({ realm: 'standard', name: role.name });
        if (usersWithRole.length === 0) {
          continue;
        }

        const module = `module.keycloak_${envMap[env]}.module.standard_clients.module.${clientId}.keycloak_role.realm_role`;
        const rmCmd = `terraform state rm ${module}`;
        const addCmd = `terraform import ${module} standard/${role.id}`;

        result.push(addCmd);
      }

      if (count < max) break;

      first = first + max;
    }

    console.log(`${total} roles found.`);
    result.map((v) => console.log(v));
    process.exit(0);
  } catch (err) {
    handleError(err);
    process.exit(1);
  }
}

main();
