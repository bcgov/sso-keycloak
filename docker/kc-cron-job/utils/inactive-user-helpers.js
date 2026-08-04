import axios from 'axios';
import { getAdminClient, log, handleError } from '../helpers.js';
import { pick } from 'lodash';

/** @typedef {import('@keycloak/keycloak-admin-client/lib/defs/userRepresentation.js').default} UserRepresentation */
/** @typedef {import('@keycloak/keycloak-admin-client/lib/client.js').KeycloakAdminClient} KeycloakAdminClient */

// NOTE: this is per runner, e.g with 5 in prod 50 is the total user deletion limit
export const MAX_DELETED_USERS_PER_RUNNER = 30;

/**
 * @param {string} realm - Keycloak realm to query (e.g. 'azureidir', 'idir')
 * @param {string} env - Environment name (e.g. 'dev', 'test', 'prod')
 * @param {number} first - Index of the first user to fetch
 * @param {number} max - Maximum number of users to fetch in a single batch
 * @returns {Promise<UserRepresentation[]>} - Returns an array of Keycloak user objects
 */
export async function fetchRealmUsers(realm, env, first, max) {
  const retries = 3;
  const adminClient = await getAdminClient(env);
  for (let i = 1; i <= retries; i++) {
    try {
      log(`[${env}] fetching users from Keycloak realm ${realm} with first=${first} and max=${max}`);
      return await adminClient.users.find({ realm, first, max });
    } catch (err) {
      console.error(`Error fetching users from Keycloak for ${env} environment with retries ${i} of ${retries}`);
      if (i === retries) throw err;
    }
  }
}

/**
 * @param {UserRepresentation} user - User data to be sent to the CSS app for deletion
 * @param {object} clientData - Client data associated with the user
 * @param {string} env - Environment name (e.g. 'dev', 'test', 'prod')
 * @returns {Promise<boolean>} - Returns true if the user was successfully deleted from the CSS app, false otherwise
 */
export async function removeUserFromCssApp(user, clientData, env) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: process.env.CSS_API_AUTH_SECRET
    };
    user.clientData = clientData;
    user.env = env;
    const res = await axios.post(`${process.env.CSS_API_URL}/delete-inactive-idir-users`, user, { headers });
    return res.status === 200;
  } catch (err) {
    handleError(err);
    return false;
  }
}

/**
 *
 * @param {string} userId - Keycloak user ID
 * @returns {Promise<boolean>} - Returns true if the user was successfully deleted from the Realm Registry app, false otherwise
 */
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

/**
 * @param {string} realm - Keycloak realm to query (e.g. 'azureidir', 'idir')
 * @param {UserRepresentation} user - Keycloak user object
 * @param {KeycloakAdminClient} adminClient - Keycloak admin client instance
 * @param {string} env - Environment name (e.g. 'dev', 'test', 'prod')
 * @param {import('pg').Client} pgClient - PostgreSQL client instance
 * @param {string} insertSql - Parameterised SQL INSERT statement for recording deleted users
 * @param {string} runnerName - Name of the runner (e.g. 'dev', 'test', 'prod-01')
 */
export async function deleteUserAndRecordData(realm, user, adminClient, env, pgClient, insertSql, runnerName) {
  const idirUserGuid = String(user?.attributes?.idir_user_guid || '').toLowerCase();

  const deletedFromRealm = await removeRealmUserFromKc(adminClient, realm, user.id);
  if (!deletedFromRealm) {
    log(`[${runnerName}] ${user.username || user.id} could not be deleted from ${realm} realm`);
    return;
  }

  const values = [
    realm,
    env,
    JSON.stringify(
      pick(user, ['id', 'username', 'email', 'firstName', 'lastName', 'enabled', 'attributes', 'emailVerified'])
    ) || '',
    [],
    [],
    false
  ];

  await pgClient.query({ text: insertSql, values });

  const standardRealmUsers = await adminClient.users.find({ realm: 'standard', username: `${idirUserGuid}@${realm}` });

  if (standardRealmUsers && standardRealmUsers.length > 0) {
    const inactiveStdUser = standardRealmUsers[0];

    const { realmRoles, clientRoles } = await getUserRolesMappings(adminClient, inactiveStdUser.id);

    const deleted = await removeRealmUserFromKc(adminClient, 'standard', inactiveStdUser.id);

    if (deleted) {
      const userDeletedAtCss = await removeUserFromCssApp(inactiveStdUser, clientRoles, env);

      if (env === 'prod') {
        await removeUserFromRealmRegistryApp(idirUserGuid);
      }

      const values = [
        'standard',
        env,
        JSON.stringify(
          pick(inactiveStdUser, [
            'id',
            'username',
            'email',
            'firstName',
            'lastName',
            'enabled',
            'attributes',
            'emailVerified'
          ])
        ) || '',
        realmRoles,
        clientRoles.map((r) => JSON.stringify(r)),
        userDeletedAtCss
      ];

      await pgClient.query({ text: insertSql, values });
      log(`[${runnerName}] ${inactiveStdUser.username} has been deleted from ${env} environment`);
    } else log(`[${runnerName}] ${inactiveStdUser.username} could not be deleted from standard realm`);
  }
}

/**
 * @param {UserRepresentation[]} users - Array of Keycloak user objects
 * @param {KeycloakAdminClient} adminClient - Keycloak admin client instance
 * @param {string} env - Environment name (e.g. 'dev', 'test', 'prod')
 * @param {import('pg').Client} pgClient - PostgreSQL client instance
 * @param {string} insertSql - Parameterised SQL INSERT statement for recording deleted users
 * @param {string} runnerName - Name of the runner (e.g. 'dev', 'test', 'prod-01')
 * @param {object} options
 * @param {string} options.realm - Keycloak realm to query (e.g. 'azureidir', 'idir')
 * @param {(user: UserRepresentation) => Promise<boolean>} options.shouldSkip - Callback function to determine if a user should be skipped
 * @param {(user: UserRepresentation, adminClient: KeycloakAdminClient, env: string) => Promise<boolean>} options.shouldDelete - Callback function to determine if a user should be deleted
 * @returns {Promise<number>} - Returns the number of users deleted in the current batch
 */
export async function processUserBatch(
  users,
  adminClient,
  env,
  pgClient,
  insertSql,
  runnerName,
  { realm, shouldSkip, shouldDelete }
) {
  let count = 0;
  for (const user of users) {
    if (await shouldSkip(user)) continue;

    if (await shouldDelete(user, adminClient, env)) {
      await deleteUserAndRecordData(realm, user, adminClient, env, pgClient, insertSql, runnerName);
      log(`[${runnerName}] ${user.username} has been deleted`);
      count++;
      if (count >= MAX_DELETED_USERS_PER_RUNNER) break;
    }
  }
  return count;
}

/**
 * @param {number} count - Number of users processed in the current batch
 * @param {number} total - Total number of users processed so far
 * @param {number} max - Maximum number of users to fetch in a single batch
 * @param {number} deletedUserCount - Total number of users deleted so far
 * @returns {boolean} - Returns true if processing should stop, false otherwise
 */
export function shouldStopProcessing(count, total, max, deletedUserCount) {
  if (count < max || total === 10000) return true;
  return deletedUserCount >= MAX_DELETED_USERS_PER_RUNNER;
}

/**
 * @param {string} env - Environment name (e.g. 'dev', 'test', 'prod')
 * @param {object} pgClient - PostgreSQL client instance
 * @param {string} runnerName - Name of the runner (e.g. 'dev', 'test', 'prod-01')
 * @param {number} startFrom - Index of the first user to fetch
 * @param {function} callback - Callback function to be called after processing is complete
 * @param {object} options
 * @param {string} options.realm - Keycloak realm to query (e.g. 'azureidir', 'idir')
 * @param {string} options.insertSql - Parameterised SQL INSERT statement for recording deleted users
 * @param {(user: object) => Promise<boolean>} options.shouldSkip - Callback function to determine if a user should be skipped
 * @param {(user: object, adminClient: object, env: string) => Promise<boolean>} options.shouldDelete - Callback function to determine if a user should be deleted
 */
export async function removeStaleUsersByEnv(
  env,
  pgClient,
  runnerName,
  startFrom,
  callback,
  { realm, insertSql, shouldSkip, shouldDelete }
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

      const usersDeleted = await processUserBatch(users, adminClient, env, pgClient, insertSql, runnerName, {
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

/**
 * @param {string} realm - Keycloak realm to query (e.g. 'azureidir', 'idir')
 * @param {string} id - Keycloak user ID
 * @param {KeycloakAdminClient} adminClient - Keycloak admin client instance
 * @returns {Promise<boolean>} - Returns true if the user was successfully deleted, false otherwise
 */
export async function removeRealmUserFromKc(adminClient, realm, id) {
  try {
    await adminClient.users.del({ realm, id });
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

/**
 * @param {KeycloakAdminClient} adminClient - Keycloak admin client instance
 * @param {string} userId - Keycloak user ID
 * @returns {Promise<{ realmRoles: string[], clientRoles: { client: string, roles: string[] }[] }>} - Returns an object containing the user's realm and client roles
 */
export async function getUserRolesMappings(adminClient, userId) {
  try {
    const clientRoles = [];
    const roleMappings = await adminClient.users.listRoleMappings({ realm: 'standard', id: userId });
    const realmRoles = roleMappings.realmMappings
      ? roleMappings.realmMappings.map((map) => map.name).filter((val) => !val.startsWith('default-roles'))
      : [];
    if (roleMappings.clientMappings) {
      for (const map in roleMappings.clientMappings) {
        clientRoles.push({
          client: roleMappings.clientMappings[map].client,
          roles: roleMappings.clientMappings[map].mappings.map((role) => role.name)
        });
      }
    }
    return { realmRoles, clientRoles };
  } catch (err) {
    console.error(err);
    throw new Error(`cannot fetch roles of user ${userId}`, { cause: err });
  }
}
