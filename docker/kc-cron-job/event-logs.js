const _ = require('lodash');
const { Client } = require('pg');
const format = require('pg-format');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs').promises;

const PGHOST = process.env.PGHOST || 'localhost';
const PGPORT = process.env.PGPORT || '5432';
const PGUSER = process.env.PGUSER || 'postgres';
const PGPASSWORD = process.env.PGPASSWORD || 'postgres';
const PGDATABASE = process.env.PGDATABASE || 'postgres';

const getFilename = (daysAgo) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - daysAgo);
  return `${yesterday.toISOString().split('T')[0]}.tar.gz`;
};

const reduceDataFromFiles = async (dirname, transformFileContents) => {
  try {
    const files = await fs.readdir(dirname);
    const contents = await Promise.all(files.map((file) => fs.readFile(dirname + file, 'utf-8')));
    return contents.map(transformFileContents);
  } catch (e) {
    console.error('error reading files:', e);
  }
};

const formatLog = (log) => {
  log['timestamp'] = log['@timestamp'];
  log['version'] = log['@version'];
  delete log['@timestamp'];
  delete log['@version'];
  try {
    let { message } = log;
    const json = {};
    const fields = message.split(', ');
    for (field of fields) {
      const [key, val] = field.split(/=(.+)/);
      json[key] = val;
    }
    return { ...log, message: json };
  } catch (e) {
    console.log('failed', message);
    return {};
  }
};

const formatLogs = (logFile) => {
  return logFile
    .split('\n')
    .filter((str) => str !== '')
    .map(JSON.parse)
    .map(formatLog)
    .map(Object.values);
};

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

    // const fileName = getFilename(5);
    const fileName = `2021-10-18.tar.gz`
    await exec(`mkdir /logs/tmp & tar -xvzf /logs/${fileName} -C /logs/tmp`);
    const data = await reduceDataFromFiles('/logs/tmp/', formatLogs);
    await exec(`rm -rf /logs/tmp`);
    await client.connect();

    for (dataset of data) {
      const query = format(`INSERT INTO sso_logs (
        sequence,
        logger_class_name,
        logger_name,
        level,
        message,
        thread_name,
        thread_id,
        mdc,
        ndc,
        host_name,
        process_name,
        process_id,
        timestamp,
        version
      ) VALUES %L`, dataset);
      await client.query(query);
    }
    await client.end();
  } catch (err) {
    console.log(err);
  }
}

main();
