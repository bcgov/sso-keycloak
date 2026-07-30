import axios from 'axios';
import { getAdminClient, log, handleError, getUserRolesMappings } from '../helpers.js';

// NOTE: this is per runner, e.g with 5 in prod 50 is the total user deletion limit
export const MAX_DELETED_USERS_PER_RUNNER = 30;

export async function fetchRealmUsers(realm, env, first, max) {
  const retries = 3;
  const adminClient = await getAdminClient(env);
  for (let i = 1; i <= retries; i++) {
    try {
      return await adminClient.users.find({ realm, first, max });
    } catch (err) {
      console.error(`Error fetching users from Keycloak for ${env} environment with retries ${i} of ${retries}`);
      if (i === retries) throw err;
    }
  }
}

export async function removeUserFromCssApp(userData, clientData, env) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: process.env.CSS_API_AUTH_SECRET
    };
    userData.clientData = clientData;
    userData.env = env;
    const res = await axios.post(`${process.env.CSS_API_URL}/delete-inactive-idir-users`, userData, { headers });
    return res.status === 200;
  } catch (err) {
    handleError(err);
    return false;
  }
}

export async function removeUserFromRealmRegistryApp(userId) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: process.env.REALM_REGISTRY_AUTH_SECRET
    };
    const res = await axios.delete(`${process.env.REALM_REGISTRY_URL}/api/users/${userId}`, { headers });
    return res.status === 200;
  } catch (err) {
    handleError(err);
    return false;
  }
}

export async function deleteUserAndRecordData(realm, user, adminClient, env, pgClient, insertText, runnerName) {
  const { id, username } = user;
  const idirUserGuid = String(user?.attributes?.idir_user_guid || '').toLowerCase();

  const { realmRoles, clientRoles } = await getUserRolesMappings(adminClient, id);
  await removeRealmUserFromKc(adminClient, realm, id);
  const deleted = await removeRealmUserFromKc(adminClient, 'standard', `${username}@${realm}`);
  if (deleted) {
    const userDeletedAtCss = await removeUserFromCssApp(user, clientRoles, env);

    if (env === 'prod') {
      await removeUserFromRealmRegistryApp(idirUserGuid);
    }

    const values = [
      env,
      id,
      username,
      user.email || '',
      user.firstName || '',
      user.lastName || '',
      JSON.stringify(user.attributes) || '',
      realmRoles,
      clientRoles.map((r) => JSON.stringify(r)),
      userDeletedAtCss
    ];

    await pgClient.query({ text: insertText, values });
    log(`[${runnerName}] ${username} has been deleted from ${env} environment`);
  } else log(`[${runnerName}] ${username} could not be deleted from ${env} environment`);
}

/**
 * @param {object} callbacks
 * @param {(user: object) => Promise<boolean>} callbacks.shouldSkip
 * @param {(user: object, adminClient: object, env: string) => Promise<boolean>} callbacks.shouldDelete
 */
export async function processUserBatch(
  users,
  adminClient,
  env,
  pgClient,
  insertText,
  runnerName,
  { realm, shouldSkip, shouldDelete }
) {
  let count = 0;
  for (const user of users) {
    if (await shouldSkip(user)) continue;

    log(`[${runnerName}] processing user ${user.username}`);
    if (await shouldDelete(user, adminClient, env)) {
      await deleteUserAndRecordData(realm, user, adminClient, env, pgClient, insertText, runnerName);
      count++;
      if (count >= MAX_DELETED_USERS_PER_RUNNER) break;
    }
  }
  return count;
}

export function shouldStopProcessing(count, total, max, deletedUserCount) {
  if (count < max || total === 10000) return true;
  return deletedUserCount >= MAX_DELETED_USERS_PER_RUNNER;
}

/**
 * @param {object} options
 * @param {string} options.realm - Keycloak realm to query (e.g. 'azureidir', 'idir')
 * @param {string} options.insertText - Parameterised SQL INSERT statement for recording deleted users
 * @param {(user: object) => Promise<boolean>} options.shouldSkip
 * @param {(user: object, adminClient: object, env: string) => Promise<boolean>} options.shouldDelete
 */
export async function removeStaleUsersByEnv(
  env,
  pgClient,
  runnerName,
  startFrom,
  callback,
  { realm, insertText, shouldSkip, shouldDelete }
) {
  try {
    let deletedUserCount = 0;
    await pgClient.connect();
    const adminClient = await getAdminClient(env);
    if (!adminClient) throw new Error(`could not get the admin client for ${env}`);

    const max = 100;
    let first = startFrom;
    let total = 0;

    while (true) {
      const users = await fetchRealmUsers(realm, env, first, max);
      const count = users.length;
      total += count;

      const usersDeleted = await processUserBatch(users, adminClient, env, pgClient, insertText, runnerName, {
        realm,
        shouldSkip,
        shouldDelete
      });
      deletedUserCount += usersDeleted;

      if (shouldStopProcessing(count, total, max, deletedUserCount)) break;

      await adminClient.reauth();
      first = first + max;
      log(`[${runnerName}] completed processing ${first} users`);
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

export async function removeRealmUserFromKc(adminClient, realm, id) {
  try {
    await adminClient.users.del({ realm, id });
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}
