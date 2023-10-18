const { saveFilesToDatabase, getDate, getClient } = require('../event-logs');
const fsPromises = require('fs').promises;
const path = require('path');
const { Client } = require('pg');

/**
 * First log is an empty line
 * Second log is missing expected "sequence" parameter
 * Third line contains all expected fields
 */
const unexpectedLogs = `
{"@timestamp":"a","loggerClassName":"a","loggerName":"a","level":"a","message":"type=USER_INFO_REQUEST","threadName":"a","threadId":1,"mdc":{},"ndc":"","hostName":"a","processName":"a","processId":1,"@version":"1"}
{"@timestamp":"a","sequence":1001,"loggerClassName":"a","loggerName":"a","level":"a","message":"type=USER_INFO_REQUEST","threadName":"a","threadId":1,"mdc":{},"ndc":"","hostName":"a","processName":"a","processId":1,"@version":"1"}`;

const fileDir = getDate(2);
const dir = `__tests__/fixtures/${fileDir}`;

jest.mock('pg', () => {
  const mockClient = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  };
  return { Client: jest.fn(() => mockClient) };
});

/**
 * Create some fixture data with usable dates
 */
const setupFixtures = async (fileData) => {
  console.log('current dir', __dirname);
  await fsPromises.mkdir(dir);
  await fsPromises.writeFile(path.join(`${dir}/test`), fileData);
};

const clearFiles = () => fsPromises.rmdir(dir, { force: true, recursive: true });

describe('Save Files to Database', () => {
  let client;
  beforeEach(() => {
    client = new Client();
  });

  afterAll(async () => {
    await clearFiles();
  });

  it('Logs an info message if could not parse a line, and continues on to remaining logs', async () => {
    console.info = jest.fn();

    await setupFixtures(unexpectedLogs);
    await saveFilesToDatabase('__tests__/fixtures');

    // Empty line in logs should log a message indicating could not be parsed
    const jsonParseError = console.info.mock.calls.find((call) =>
      call[0].startsWith('Error trying to JSON parse line'),
    );
    expect(jsonParseError).not.toBe(undefined);

    // Log with missing sequence should log a message indicating could not be uploaded
    const unexpectedFormatError = console.info.mock.calls.find((call) =>
      call[0].startsWith('Log does not have expected format'),
    );
    expect(unexpectedFormatError).not.toBe(undefined);

    // FInal valid log is still sent to DB insert command (log with sequence number 1001)
    const queries = client.query.mock.calls;
    const insertionQuery = queries.find((query) => query[0].startsWith('INSERT INTO sso_logs'));
    expect(insertionQuery[0].includes('1001')).toBe(true);
  });
});
