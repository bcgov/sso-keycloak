import pg from 'pg';
import axios from 'axios';
import jws from 'jws';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const removeTrailingSlash = (url) => {
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const getKcConfig = (environment) => {
  const env = environment.toUpperCase();
  return {
    url: removeTrailingSlash(process.env[`${env}_KEYCLOAK_URL`] || ''),
    username: process.env[`${env}_KEYCLOAK_USERNAME`] || '',
    password: process.env[`${env}_KEYCLOAK_PASSWORD`] || ''
  };
};

export async function removeUserFromKc(adminClient, id) {
  try {
    await adminClient.users.del({ realm: 'standard', id });
  } catch (err) {
    console.error(err);
  }
}

export async function getUserRolesMappings(adminClient, userId) {
  try {
    const clientRoles = [];
    const roleMappings = await adminClient.users.listRoleMappings({ realm: 'standard', id: userId });
    const realmRoles = roleMappings.realmMappings ? roleMappings.realmMappings.map((map) => map.name) : [];
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
    throw new Error(`cannot fetch roles of user ${userId}`);
  }
}

export const oneMin = 60 * 1000;

export async function getAdminClient(env) {
  try {
    const KcAdminClient = (await import('@keycloak/keycloak-admin-client')).default;
    const config = getKcConfig(env);
    if (!config) throw Error(`invalid env ${env}`);

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

export function log(msg) {
  console.log(`[${new Date().toLocaleString()}] ${msg}`);
}

export function getPgClient() {
  return new Client({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'rhsso',
    ssl: process.env.NODE_ENV === 'local' ? false : { rejectUnauthorized: false }
  });
}

export async function sendRcNotification(cronName, message, err) {
  try {
    const headers = { Accept: 'application/json' };
    const statusCode = err ? 'ERROR' : '';
    await axios.post(process.env.RC_WEBHOOK, { projectName: cronName, message, statusCode }, { headers });
  } catch (err) {
    console.error(err);
  }
}

export function handleError(error) {
  console.error(error);
  if (error.isAxiosError) {
    console.error((error.response && error.response.data) || error);
  } else {
    console.error(error);
  }
}

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
