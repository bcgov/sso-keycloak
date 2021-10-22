const _ = require('lodash');
const { Client } = require('pg');
const format = require('pg-format');
const KcAdminClient = require('keycloak-admin').default;

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'https://dev.oidc.gov.bc.ca';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'script-cli';
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET;
const PGHOST = process.env.PGHOST;
const PGPORT = process.env.PGPORT || '5432';
const PGUSER = process.env.PGUSER;
const PGPASSWORD = process.env.PGPASSWORD;
const PGDATABASE = process.env.PGDATABASE;

const kcAdminClient = new KcAdminClient({
  baseUrl: `${KEYCLOAK_URL}/auth`,
  realmName: 'master',
});

async function main() {
  try {
    await kcAdminClient.auth({
      grantType: 'client_credentials',
      clientId: KEYCLOAK_CLIENT_ID,
      clientSecret: KEYCLOAK_CLIENT_SECRET,
    });

    // see https://node-postgres.com/api/client#new-clientconfig-object
    const client = new Client({
      host: PGHOST,
      port: parseInt(PGPORT),
      user: PGUSER,
      password: PGPASSWORD,
      database: PGDATABASE,
      ssl: { rejectUnauthorized: false },
    });

    const realms = await kcAdminClient.realms.find({});
    const dataset = [];
    await Promise.all(
      realms.map(async (realm) => {
        const sessions = await kcAdminClient.sessions.find({
          realm: realm.realm,
        });
        const totalActive = _.sum(_.map(sessions, 'active').map(Number));
        if (totalActive > 0) dataset.push([KEYCLOAK_URL, realm.realm, totalActive]);
      }),
    );

    const query = format('INSERT INTO active_sessions (keycloak_url, realm, session_count) VALUES %L', dataset);

    await client.connect();
    await client.query(query);
    await client.end();
  } catch (err) {
    console.log(err);
  }
}

main();
