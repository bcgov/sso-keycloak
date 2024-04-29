const { getAdminClient, log, getPgClient, sendRcNotification, handleError, deleteLegacyData } = require('./helpers');
const async = require('async');

const STANDARD_REALM = 'standard';

async function removeDcUsers(runnerName, pgClient, env = 'dev', callback) {
  try {
    let deletedUserCount = 0;
    const adminClient = await getAdminClient(env);
    const idpSuffix = '@digitalcredential';
    await pgClient.connect();
    const text = 'INSERT INTO kc_deleted_dc_users (environment, username, realm_id, attributes) VALUES($1, $2, $3, $4)';
    const max = 500;
    let first = 0;
    let total = 0;

    while (true) {
      const users = await adminClient.users.find({ realm: STANDARD_REALM, username: idpSuffix, first, max });

      const count = users.length;
      total += count;

      for (let x = 0; x < users.length; x++) {
        const { id, username } = users[x];

        const userSessions = await adminClient.users.listSessions({ realm: STANDARD_REALM, id });

        if (userSessions.length === 0) {
          // delete user from standard realm
          await adminClient.users.del({ realm: STANDARD_REALM, id });

          const values = [env, username, STANDARD_REALM, users[x].attributes || {}];
          await pgClient.query({ text, values });
          deletedUserCount++;
          log(`${username} has been deleted from ${env} environment`);
        } else {
          log(`Skipped ${username} from deletion in ${env} environment`);
        }
      }

      if (count < max) break;

      await adminClient.reauth();
      first = first + max;
      log(`completed processing ${first} users`);
    }
    log(`[${runnerName}] ${total} users processed.`);
    callback(null, { runnerName, processed: total, deleteCount: deletedUserCount });
  } catch (err) {
    handleError(err);
    callback(JSON.stringify(err?.message || err?.response?.data || err), { runnerName });
  } finally {
    await pgClient.end();
  }
}
async function main() {
  async.parallel(
    async.reflectAll([
      function (cb) {
        removeDcUsers('dev', getPgClient(), 'dev', cb);
      },
      function (cb) {
        removeDcUsers('test', getPgClient(), 'test', cb);
      },
      function (cb) {
        removeDcUsers('prod', getPgClient(), 'prod', cb);
      }
    ]),
    async function (_, results) {
      const hasError = results.find((r) => r.error);
      const textContent = hasError ? 'Failed to remove' : 'Successfully removed';

      await sendRcNotification(
        'dc-remove-users',
        `**[${process.env.NAMESPACE}] ${textContent} digital credential users** \n\n` +
          results.map((r) => JSON.stringify(r)).join('\n\n'),
        hasError
      );
    }
  );

  await deleteLegacyData('kc_deleted_dc_users', process.env.DC_USERS_RETENTION_DAYS || 60);
}

main();
