const _ = require('lodash');
const { Client } = require('pg');
const format = require('pg-format');
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
const SAVE_LOGS_N_DAYS_AGO = process.env.SAVE_LOGS_N_DAYS_AGO || 2;

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
        version,
        namespace
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
      const queryLogs = [...logs];
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
  let client;

  try {
    client = getClient();
    await client.connect();
    if (!fs.existsSync(dirname)) {
      console.info(`Directory ${dirname} does not exist.`);
      return;
    }

    const files = await fsPromises.readdir(dirname);
    for (const filename of files) {
      const lineReader = readline.createInterface({
        input: fs.createReadStream(`${dirname}/${filename}`),
      });
      promises.push(saveLogsForFile(lineReader, client));
    }
    await Promise.all(promises);
  } catch (e) {
    console.error('error while reducing file data', e);
  } finally {
    await client.end();
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
    return Object.values({ ...log, message: json, namespace: process.env.NAMESPACE });
  } catch (e) {
    console.log('failed', message);
    return [];
  }
};

const getClient = () => {
  const client = new Client({
    host: PGHOST,
    port: parseInt(PGPORT),
    user: PGUSER,
    password: PGPASSWORD,
    database: PGDATABASE,
    ssl: { rejectUnauthorized: false },
  });
  return client;
};

const clearOldLogs = async (retentionPeriodDays) => {
  console.info('Removing old logs from database...');
  let client;
  try {
    client = getClient();
    await client.connect();
    const query = `DELETE from sso_logs where timestamp < NOW() - INTERVAL '${retentionPeriodDays} DAYS' and namespace = '${process.env.NAMESPACE}';`;
    console.info(`Running delete query: ${query}`);
    await client.query(query);
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
};

const parseLogStats = async () => {
  console.info('Collecting log stats...');
  let client;
  try {
    client = getClient();
    await client.connect();
    console.info('running save_log_types function...');
    const saveStatsQuery = `SELECT save_log_types();`;
    await client.query(saveStatsQuery);
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
};

const getDate = (daysAgo) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - daysAgo);
  return yesterday.toISOString().split('T')[0];
};

async function saveFilesToDatabase(dirname) {
  console.info('Saving Logs to database...');
  try {
    const dateToSave = getDate(SAVE_LOGS_N_DAYS_AGO);
    const previousDayLogsFolder = `${dirname}/${dateToSave}`;
    await clearOldLogs(RETENTION_PERIOD_DAYS);
    await reduceDataFromFiles(previousDayLogsFolder);
    await parseLogStats();
  } catch (err) {
    console.log(err);
  }
}

module.exports = { saveFilesToDatabase };
