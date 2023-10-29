const format = require('pg-format');
const { getPgClient, log } = require('./helpers');
const KcAdminClient = require('keycloak-admin').default;

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'https://dev.oidc.gov.bc.ca';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'script-cli';
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET;

const kcAdminClient = new KcAdminClient({
  baseUrl: `${KEYCLOAK_URL}/auth`,
  realmName: 'master'
});

async function main() {
  let client;
  try {
    await kcAdminClient.auth({
      grantType: 'client_credentials',
      clientId: KEYCLOAK_CLIENT_ID,
      clientSecret: KEYCLOAK_CLIENT_SECRET
    });

    // see https://node-postgres.com/api/client#new-clientconfig-object
    client = getPgClient();

    const realms = await kcAdminClient.realms.find({});
    const dataset = [];
    await Promise.all(
      realms.map(async (realm) => {
        const sessions = await kcAdminClient.sessions.find({
          realm: realm.realm
        });
        sessions.map((session) => {
          const sessionActiveCount = parseInt(session.active, 10);
          const sessionClientID = session.clientId;
          if (sessionActiveCount > 0) {
            dataset.push([KEYCLOAK_URL, realm.realm, sessionClientID, sessionActiveCount]);
          }
        });
      })
    );

    const query = format(
      'INSERT INTO active_sessions (keycloak_url, realm, client_id, session_count) VALUES %L',
      dataset
    );

    await client.connect();
    if (dataset.length > 0) await client.query(query);
    else log('no sessions found');
  } catch (err) {
    console.log(err);
  } finally {
    await client.end();
  }
}

main();
