const _ = require('lodash');
const { Client } = require('pg');
const format = require('pg-format');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fsPromises = require('fs').promises;
const fs = require('fs');
const readline = require('readline');

const PGHOST = process.env.PGHOST || 'localhost';
const PGPORT = process.env.PGPORT || '5432';
const PGUSER = process.env.PGUSER || 'postgres';
const PGPASSWORD = process.env.PGPASSWORD || 'postgres';
const PGDATABASE = process.env.PGDATABASE || 'postgres';
const LOG_BATCH_SIZE = process.env.LOG_BATCH_SIZE || 1000;
const RETENTION_PERIOD_DAYS = process.env.RETENTION_PERIOD_DAYS || 30;

const getFilename = (daysAgo) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - daysAgo);
  return `${yesterday.toISOString().split('T')[0]}.tar.gz`;
};

const getQuery = (logs) => {
  const query = format(
    `INSERT INTO sso_logs (
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
      ) VALUES %L`,
    logs,
  );
  return query;
};

const saveLogsForFile = async (lineReader, client) => {
  let i = 0;
  let logs = [];
  lineReader.on('line', async function (line) {
    i++;
    const formattedLog = formatLog(JSON.parse(line));
    logs.push(formattedLog);
    if (i === LOG_BATCH_SIZE) {
      i = 0;
      const queryLogs = [...logs]
      logs = [];
      await client.query(getQuery(queryLogs));
    }
  });

  return new Promise((resolve, reject) => {
    lineReader.on('close', async () => {
      await client.query(getQuery(logs));
      resolve();
    });
  });
};

const reduceDataFromFiles = async (dirname) => {
  const promises = [];
  const client = new Client({
    host: PGHOST,
    port: parseInt(PGPORT),
    user: PGUSER,
    password: PGPASSWORD,
    database: PGDATABASE,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    const files = await fsPromises.readdir(dirname);
    for (const filename of files) {
      const lineReader = readline.createInterface({
        input: fs.createReadStream(`${dirname}/${filename}`),
      });
      promises.push(saveLogsForFile(lineReader, client));
    }
    await Promise.all(promises);
    await client.end();
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
    return Object.values({ ...log, message: json });
  } catch (e) {
    console.log('failed', message);
    return [];
  }
};

const clearOldLogs = async (retentionPeriodDays) => {
  const client = new Client({
    host: PGHOST,
    port: parseInt(PGPORT),
    user: PGUSER,
    password: PGPASSWORD,
    database: PGDATABASE,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const query = `DELETE from sso_logs where timestamp < NOW() - INTERVAL '${retentionPeriodDays} DAYS'`;
  await client.query(query);
  await client.end();
}

async function main() {
  try {
    const fileName = getFilename(2);
    await clearOldLogs(RETENTION_PERIOD_DAYS);
    await exec(`mkdir /logs/tmp & tar -xvzf /logs/${fileName} -C /logs/tmp`);
    await reduceDataFromFiles('/logs/tmp/');
    await exec(`rm -rf /logs/tmp`);
  } catch (err) {
    console.log(err);
  }
}

main();
