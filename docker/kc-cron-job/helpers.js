import pg from 'pg';
import axios from 'axios';
import jws from 'jws';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

/**
 * Removes a single trailing slash from a URL string.
 * @param {string} url - URL to normalize
 * @returns {string} - Normalized URL without a trailing slash
 */
const removeTrailingSlash = (url) => {
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

/**
 * @param {string} env - Environment name (e.g. 'dev', 'test', 'prod')
 * @returns {object} - Returns Keycloak configuration for the specified environment
 */
const getKcConfig = (environment) => {
  const env = environment.toUpperCase();
  return {
    url: removeTrailingSlash(process.env[`${env}_KEYCLOAK_URL`] || ''),
    username: process.env[`${env}_KEYCLOAK_USERNAME`] || '',
    password: process.env[`${env}_KEYCLOAK_PASSWORD`] || ''
  };
};

export const oneMin = 60 * 1000;

/**
 *
 * @param {string} env - Environment name (e.g. 'dev', 'test', 'prod')
 * @returns {Promise<object|null>} - Returns the Keycloak admin client instance or null if an error occurred
 */
export async function getAdminClient(env) {
  try {
    const KcAdminClient = (await import('@keycloak/keycloak-admin-client')).default;
    const config = getKcConfig(env);
    if (!config) throw new Error(`invalid env ${env}`);

    const kcAdminClient = new KcAdminClient({
      baseUrl: `${config.url}/auth`,
      realmName: 'master',
      requestConfig: {
        /* Axios request config options https://github.com/axios/axios#request-config */
        timeout: 60000
      }
    });

    let decodedToken;

    const auth = async () => {
      await kcAdminClient.auth({
        grantType: 'password',
        clientId: 'admin-cli',
        username: config.username,
        password: config.password
      });

      decodedToken = jws.decode(kcAdminClient.accessToken);
    };

    const refreshAsNeeded = async () => {
      const expiresIn = decodedToken.payload.exp * 1000 - Date.now();
      console.log(expiresIn < this.oneMin);
      if (expiresIn < this.oneMin) await auth();
    };

    kcAdminClient.reauth = auth;
    kcAdminClient.refreshAsNeeded = refreshAsNeeded;
    kcAdminClient.url = config.url;

    await auth();
    return kcAdminClient;
  } catch (err) {
    console.error(err);
    return null;
  }
}

/**
 * @param {string} msg - Message to log
 */
export function log(msg) {
  console.log(`[${new Date().toLocaleString()}] ${msg}`);
}

/**
 * @returns {pg.Client} - Returns a new PostgreSQL client instance
 */
export function getPgClient() {
  return new Client({
    host: process.env.PGHOST || 'localhost',
    port: Number.parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'rhsso',
    ssl: process.env.NODE_ENV === 'local' ? false : { rejectUnauthorized: false }
  });
}

/**
 * @param {string} cronName - Name of the cron job
 * @param {string} message - Message to be sent in the notification
 * @param {Error} [err] - Optional error object to include in the notification
 * @returns {Promise<void>} - Returns a promise that resolves when the notification is sent
 */
export async function sendRcNotification(cronName, message, err) {
  try {
    const headers = { Accept: 'application/json' };
    const statusCode = err ? 'ERROR' : '';
    await axios.post(process.env.RC_WEBHOOK, { projectName: cronName, message, statusCode }, { headers });
  } catch (err) {
    console.error(err);
  }
}

/**
 *
 * @param {*} error
 */
export function handleError(error) {
  console.error(error);
  if (error.isAxiosError) {
    console.error(error.response?.data || error);
  } else {
    console.error(error);
  }
}

/**
 * @param {string} tableName - Name of the table to delete old logs from
 * @param {number} retentionPeriodDays - Number of days to retain logs before deletion
 * @returns {Promise<void>} - Returns a promise that resolves when the deletion is complete
 */
export async function deleteLegacyData(tableName, retentionPeriodDays) {
  console.info('Removing old logs from database...');
  let client;
  try {
    client = getPgClient();
    await client.connect();
    const query = `DELETE from ${tableName} where timestamp < NOW() - INTERVAL '${retentionPeriodDays} DAYS';`;
    console.info(`Running delete query: ${query}`);
    await client.query(query);
    console.info('Completed running delete query');
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
