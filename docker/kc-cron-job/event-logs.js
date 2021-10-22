const _ = require('lodash');
const { Client } = require('pg');
const format = require('pg-format');

const PGHOST = process.env.PGHOST;
const PGPORT = process.env.PGPORT || '5432';
const PGUSER = process.env.PGUSER;
const PGPASSWORD = process.env.PGPASSWORD;
const PGDATABASE = process.env.PGDATABASE;

async function main() {
  try {
    // see https://node-postgres.com/api/client#new-clientconfig-object
    const client = new Client({
      host: PGHOST,
      port: parseInt(PGPORT),
      user: PGUSER,
      password: PGPASSWORD,
      database: PGDATABASE,
      ssl: { rejectUnauthorized: false },
    });

    // TODO: run previous day's log files and upload to the db
    // const query = format('INSERT INTO active_sessions (keycloak_url, realm, session_count) VALUES %L', dataset);

    // await client.connect();
    // await client.query(query);
    // await client.end();
  } catch (err) {
    console.log(err);
  }
}

main();
