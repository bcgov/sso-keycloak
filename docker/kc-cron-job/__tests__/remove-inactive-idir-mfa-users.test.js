import { beforeEach, describe, expect, it, vi } from 'vitest';

const removeStaleUsersByEnvMock = vi.fn();
const sendRcNotificationMock = vi.fn(async () => true);
const deleteLegacyDataMock = vi.fn(async () => true);
const getPgClientMock = vi.fn(() => ({ name: 'pgClient' }));
const acquireTokenByClientCredentialMock = vi.fn(async () => ({ accessToken: 'fake-token' }));
const axiosGetMock = vi.fn();

let parallelResults = [];

vi.mock('async', () => ({
  reflectAll: vi.fn((tasks) => tasks),
  parallel: vi.fn((tasks, done) => {
    for (const task of tasks) {
      task(() => {});
    }
    done(null, parallelResults);
  })
}));

vi.mock('../helpers.js', () => ({
  getPgClient: getPgClientMock,
  sendRcNotification: sendRcNotificationMock,
  deleteLegacyData: deleteLegacyDataMock
}));

vi.mock('../utils/inactive-user-helpers.js', () => ({
  removeStaleUsersByEnv: removeStaleUsersByEnvMock
}));

vi.mock('@azure/msal-node', () => ({
  ConfidentialClientApplication: vi.fn(() => ({
    acquireTokenByClientCredential: acquireTokenByClientCredentialMock
  }))
}));

vi.mock('axios', () => ({
  default: {
    get: axiosGetMock
  }
}));

async function importScript({ results = [], retentionDays } = {}) {
  vi.resetModules();
  parallelResults = results;

  process.env.MS_GRAPH_API_AUTHORITY_DEV = 'https://login.microsoftonline.com/dev';
  process.env.MS_GRAPH_API_CLIENT_ID_DEV = 'dev-client-id';
  process.env.MS_GRAPH_API_CLIENT_SECRET_DEV = 'dev-secret';
  process.env.MS_GRAPH_API_AUTHORITY_TEST = 'https://login.microsoftonline.com/test';
  process.env.MS_GRAPH_API_CLIENT_ID_TEST = 'test-client-id';
  process.env.MS_GRAPH_API_CLIENT_SECRET_TEST = 'test-secret';
  process.env.MS_GRAPH_API_AUTHORITY_PROD = 'https://login.microsoftonline.com/prod';
  process.env.MS_GRAPH_API_CLIENT_ID_PROD = 'prod-client-id';
  process.env.MS_GRAPH_API_CLIENT_SECRET_PROD = 'prod-secret';
  process.env.NAMESPACE = 'test-ns';

  if (typeof retentionDays === 'undefined') {
    delete process.env.INACTIVE_IDIR_USERS_RETENTION_DAYS;
  } else {
    process.env.INACTIVE_IDIR_USERS_RETENTION_DAYS = String(retentionDays);
  }

  await import('../remove-inactive-idir-mfa-users.js');
  await Promise.resolve();
}

describe('remove-inactive-idir-mfa-users script', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    parallelResults = [];
  });

  it('wires all environment runners with expected options', async () => {
    await importScript();

    expect(removeStaleUsersByEnvMock).toHaveBeenCalledTimes(7);

    const firstCall = removeStaleUsersByEnvMock.mock.calls[0];
    expect(firstCall[0]).toBe('dev');
    expect(firstCall[2]).toBe('dev');
    expect(firstCall[3]).toBe(0);
    expect(typeof firstCall[4]).toBe('function');
    expect(firstCall[5]).toMatchObject({
      realm: 'azureidir'
    });
    expect(firstCall[5].insertSql).toContain('INSERT INTO kc_deleted_idir_mfa_users');
    expect(typeof firstCall[5].shouldSkip).toBe('function');
    expect(typeof firstCall[5].shouldDelete).toBe('function');

    const lastCall = removeStaleUsersByEnvMock.mock.calls[6];
    expect(lastCall[0]).toBe('prod');
    expect(lastCall[2]).toBe('prod-05');
    expect(lastCall[3]).toBe(40000);
  });

  it('sends success notification when no runner errors are reported', async () => {
    await importScript({ results: [{ value: { runnerName: 'dev' } }, { value: { runnerName: 'test' } }] });

    expect(sendRcNotificationMock).toHaveBeenCalledTimes(1);
    const [jobName, message, hasError] = sendRcNotificationMock.mock.calls[0];
    expect(jobName).toBe('cron-remove-inactive-idir-mfa-users');
    expect(message).toContain('Successfully removed inactive IDIR MFA users');
    expect(hasError).toBeFalsy();
  });

  it('sends failed notification when any runner reports an error', async () => {
    await importScript({ results: [{ value: { runnerName: 'dev' } }, { error: 'boom' }] });

    expect(sendRcNotificationMock).toHaveBeenCalledTimes(1);
    const [, message, hasError] = sendRcNotificationMock.mock.calls[0];
    expect(message).toContain('Failed to remove inactive IDIR MFA users');
    expect(hasError).toBeTruthy();
  });

  it('uses retention env override when provided', async () => {
    await importScript({ retentionDays: 45 });

    expect(deleteLegacyDataMock).toHaveBeenCalledWith('kc_deleted_idir_mfa_users', 45);
  });

  it('defaults retention days to 60 when env value is missing', async () => {
    await importScript();

    expect(deleteLegacyDataMock).toHaveBeenCalledWith('kc_deleted_idir_mfa_users', 60);
  });

  it('exposes skip/delete callbacks in opts with expected decisions', async () => {
    await importScript();

    const opts = removeStaleUsersByEnvMock.mock.calls[0][5];

    expect(await opts.shouldSkip({ attributes: {} })).toBe(true);
    expect(await opts.shouldSkip({ attributes: { idir_user_guid: 'abc' } })).toBe(false);

    axiosGetMock.mockResolvedValueOnce({ data: { value: [] } });
    const shouldDeleteMissing = await opts.shouldDelete(
      { username: 'user1', attributes: { idir_user_guid: 'abc' } },
      {},
      'dev'
    );
    expect(shouldDeleteMissing).toBe(true);

    axiosGetMock.mockResolvedValueOnce({ data: { value: [{ id: 'entra-user' }] } });
    const shouldDeleteExisting = await opts.shouldDelete(
      { username: 'user2', attributes: { idir_user_guid: 'abc' } },
      {},
      'dev'
    );
    expect(shouldDeleteExisting).toBe(false);

    expect(acquireTokenByClientCredentialMock).toHaveBeenCalled();
    expect(axiosGetMock).toHaveBeenCalledTimes(2);
  });
});
