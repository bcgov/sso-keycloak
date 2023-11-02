const { getAdminClient, log, getPgClient, sendRcNotification, handleError, deleteLegacyData } = require('./helpers');
const async = require('async');

const STANDARD_REALM = 'standard';

const DC_REALM = 'digitalcredential';

async function removeVcUsers(runnerName, pgClient, env = 'dev', callback) {
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

          const parentRealmUsers = await adminClient.users.find({
            realm: DC_REALM,
            username: username.split('@')[0],
            max: 1
          });

          if (parentRealmUsers.length > 0) {
            // delete user from digital credential realm
            await adminClient.users.del({ realm: DC_REALM, id: parentRealmUsers[0]?.id });
          }

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
    callback(err);
  } finally {
    await pgClient.end();
  }
}
async function main() {
  async.parallel(
    [
      function (cb) {
        removeVcUsers('dev', getPgClient(), 'dev', cb);
      },
      function (cb) {
        removeVcUsers('test', getPgClient(), 'test', cb);
      },
      function (cb) {
        removeVcUsers('prod', getPgClient(), 'prod', cb);
      }
    ],
    async function (err, results) {
      if (err) {
        console.error(err.message);
        await sendRcNotification(
          'dc-remove-users',
          `**[${process.env.NAMESPACE}] Failed to remove digital credential users** \n\n` + err.message,
          true
        );
      } else {
        const a = results.map((res) => JSON.stringify(res));
        await sendRcNotification(
          'dc-remove-users',
          `**[${process.env.NAMESPACE}] Successfully removed digital credential users** \n\n` + a.join('\n\n'),
          false
        );
      }
    }
  );

  await deleteLegacyData('kc_deleted_dc_users', process.env.DC_USERS_RETENTION_DAYS || 60);
}

main();
