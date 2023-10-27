const format = require('pg-format');
const fsPromises = require('fs').promises;
const fs = require('fs');
const readline = require('readline');
const { deleteLegacyData, getPgClient } = require('./helpers');

const LOG_BATCH_SIZE = process.env.LOG_BATCH_SIZE || 1000;
const RETENTION_PERIOD_DAYS = process.env.RETENTION_PERIOD_DAYS || 30;
const SAVE_LOGS_N_DAYS_AGO = process.env.SAVE_LOGS_N_DAYS_AGO || 2;

const logFields = [
  'sequence',
  'loggerClassName',
  'loggerName',
  'level',
  'message',
  'threadName',
  'threadId',
  'mdc',
  'ndc',
  'hostName',
  'processName',
  'processId',
  'timestamp',
  'version'
];

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
    logs
  );
  return query;
};

const saveLogsForFile = async (lineReader, client) => {
  let i = 0;
  let logs = [];
  lineReader.on('line', async function (line) {
    try {
      // If cannot format or parse the log, move to next log without incrementing the batch size.
      const formattedLog = formatLog(JSON.parse(line));
      if (!formattedLog) return;
      logs.push(formattedLog);
    } catch (e) {
      return console.info('Error trying to JSON parse line', e, line);
    }

    i++;
    if (i === LOG_BATCH_SIZE) {
      i = 0;
      const queryLogs = [...logs];
      logs = [];
      await client.query(getQuery(queryLogs));
    }
  });

  return new Promise((resolve, reject) => {
    lineReader.on('close', async () => {
      try {
        await client.query(getQuery(logs));
        resolve();
      } catch (err) {
        console.info('Error when inserting log data', err, logs);
        reject(err);
      }
    });
  });
};

const reduceDataFromFiles = async (dirname) => {
  const promises = [];
  let client;

  try {
    client = getPgClient();
    await client.connect();
    if (!fs.existsSync(dirname)) {
      console.info(`Directory ${dirname} does not exist.`);
      return;
    }

    const files = await fsPromises.readdir(dirname);
    for (const filename of files) {
      const lineReader = readline.createInterface({
        input: fs.createReadStream(`${dirname}/${filename}`)
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
  log.timestamp = log['@timestamp'];
  log.version = log['@version'];
  delete log['@timestamp'];
  delete log['@version'];
  try {
    const logKeys = Object.keys(log);
    const logHasAllExpectedFields = logFields.every((field) => logKeys.includes(field));
    const logHasUnexpectedFields = logKeys.some((key) => !logFields.includes(key));

    if (!logHasAllExpectedFields || logHasUnexpectedFields) {
      console.info('Log does not have expected format: ', log);
      return null;
    }

    const { message } = log;
    const json = {};
    const fields = message.split(', ');
    for (const field of fields) {
      const [key, val] = field.split(/=(.+)/);
      json[key] = val;
    }
    return Object.values({ ...log, message: json, namespace: process.env.NAMESPACE });
  } catch (e) {
    console.log('failed to format log', log);
    return [];
  }
};

const parseLogStats = async () => {
  console.info('Collecting log stats...');
  let client;
  try {
    client = getPgClient();
    await client.connect();
    console.info('running save_log_types function...');
    const saveStatsQuery = 'SELECT save_log_types();';
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
    await deleteLegacyData('sso_logs', RETENTION_PERIOD_DAYS);
    await reduceDataFromFiles(previousDayLogsFolder);
    await parseLogStats();
  } catch (err) {
    console.log(err);
  }
}

module.exports = { saveFilesToDatabase, getDate };
