const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
const { handleError, ignoreError } = require('./helpers');
const { env, auto } = argv;

// this script helps aggregate the realm session stats.
async function main() {
  if (!env) {
    console.info(`
    Usages:
      node keycloak-get-session-stats.js --env <env> [--auto]
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

    const clients = await adminClient.clients.findOne({ realm: 'master', clientId: 'security-admin-console' });
    if (clients.length === 0) throw Error('client not found');
    const sessions = await adminClient.clients.listSessions({ realm: 'master', id: clients[0].id, max: 1000 });

    const nowtime = new Date().getTime();
    const ordered = _.orderBy(sessions, ['start'], ['asc']);
    const result = { true: 0, false: 0 };
    _.each(ordered, (v) => {
      const timediff = nowtime - new Date(v.start).getTime();
      const empty = _.isEmpty(v.clients);
      const lifetime = timediff / 1000 / 60;

      // see if the session was created less than 30min ago
      result[lifetime <= 30]++;
    });

    console.log(result);

    process.exit(0);
  } catch (err) {
    handleError(err);
    process.exit(1);
  }
}

main();
