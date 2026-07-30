import { parallel, reflectAll } from 'async';
import { getPgClient, sendRcNotification, deleteLegacyData } from './helpers.js';
import { checkUserExistsAtIDIM } from './utils/bceid-webservice.js';
import { removeStaleUsersByEnv } from './utils/inactive-user-helpers.js';

const INSERT_TEXT =
  'INSERT INTO kc_deleted_idir_users (environment, user_id, username, email, first_name, last_name, attributes, realm_roles, client_roles, css_app_deleted) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)';

async function shouldSkipUser(user) {
  const idirUserGuid = String(user?.attributes?.idir_user_guid || '').toLowerCase();
  if (!idirUserGuid) return true;
  const displayName = String(user?.attributes?.display_name || '').toLowerCase();
  if (displayName.startsWith('hold -')) return true;
  return false;
}

async function shouldDeleteUser(user, adminClient, env) {
  const idirUserGuid = String(user?.attributes?.idir_user_guid || '').toLowerCase();
  const userExists = await checkUserExistsAtIDIM({ matchKey: idirUserGuid, env });
  if (userExists === 'error') {
    console.error(`[shouldDeleteUser] IDIM check returned an error for user ${user.username} — skipping deletion`);
    return false;
  }
  return userExists === 'notexists';
}

async function main() {
  const opts = { realm: 'idir', insertText: INSERT_TEXT, shouldSkip: shouldSkipUser, shouldDelete: shouldDeleteUser };
  parallel(
    reflectAll([
      function (cb) {
        removeStaleUsersByEnv('dev', getPgClient(), 'dev', 0, cb, opts);
      },
      function (cb) {
        removeStaleUsersByEnv('test', getPgClient(), 'test', 0, cb, opts);
      },
      function (cb) {
        removeStaleUsersByEnv('prod', getPgClient(), 'prod-01', 0, cb, opts);
      },
      function (cb) {
        removeStaleUsersByEnv('prod', getPgClient(), 'prod-02', 10000, cb, opts);
      },
      function (cb) {
        removeStaleUsersByEnv('prod', getPgClient(), 'prod-03', 20000, cb, opts);
      },
      function (cb) {
        removeStaleUsersByEnv('prod', getPgClient(), 'prod-04', 30000, cb, opts);
      },
      function (cb) {
        removeStaleUsersByEnv('prod', getPgClient(), 'prod-05', 40000, cb, opts);
      }
    ]),
    async function (_, results) {
      const hasError = results.find((r) => r.error);
      const textContent = hasError ? 'Failed to remove' : 'Successfully removed';

      await sendRcNotification(
        'cron-remove-inactive-idir-users',
        `**[${process.env.NAMESPACE}] ${textContent} inactive IDIR users** \n\n` +
          results.map((r) => JSON.stringify(r)).join('\n\n'),
        hasError
      );
    }
  );
  await deleteLegacyData('kc_deleted_idir_users', process.env.INACTIVE_IDIR_USERS_RETENTION_DAYS || 60);
}

await main();
