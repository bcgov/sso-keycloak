import { vi, expect, describe, it, beforeEach } from 'vitest';
import {
  removeUserFromCssApp,
  MAX_DELETED_USERS_PER_RUNNER,
  removeStaleUsersByEnv
} from '../utils/inactive-user-helpers.js';
import axios from 'axios';

const pgMock = {
  connect: vi.fn(() => Promise.resolve(true)),
  query: vi.fn(() => Promise.resolve(true)),
  end: vi.fn(() => Promise.resolve(true))
};

const mockUser = {
  id: '123',
  username: 'testuser@idir',
  email: 'testemail',
  firstName: 'john',
  lastName: 'doe',
  attributes: { idir_user_guid: 1, display_name: 'testuser' }
};

const makeMockUser = () => structuredClone(mockUser);

const realmRoles = ['realmRole'];
const clientRoles = [
  {
    client: 'test-client',
    roles: ['role1', 'role2']
  }
];

vi.mock('../utils/bceid-webservice.js', () => ({
  checkUserExistsAtIDIM: vi.fn(() => Promise.resolve('notexists'))
}));

vi.mock('pg', async () => {
  const actual = await vi.importActual('pg');
  return {
    ...actual,
    default: {
      ...actual.default,
      Client: vi.fn().mockImplementation(() => ({
        connect: vi.fn(),
        query: vi.fn(),
        end: vi.fn()
      }))
    }
  };
});

vi.mock('../helpers.js', async () => {
  const originalModule = await vi.importActual('../helpers.js');
  return {
    ...originalModule,
    getAdminClient: vi.fn(() =>
      Promise.resolve({
        users: {
          find: vi.fn((query) => {
            if (query.realm === 'standard') {
              return Promise.resolve([makeMockUser()]);
            }
            const users = Array.from({ length: 100 }, () => makeMockUser());
            return Promise.resolve(users);
          }),
          listRoleMappings: vi.fn(() =>
            Promise.resolve({
              realmMappings: [],
              clientMappings: []
            })
          ),
          del: vi.fn(() => Promise.resolve(true))
        },
        reauth: vi.fn()
      })
    ),
    removeUserFromKc: vi.fn(() => Promise.resolve()),
    getUserRolesMappings: vi.fn(() =>
      Promise.resolve({
        clientRoles,
        realmRoles
      })
    )
  };
});

vi.mock('axios', () => ({
  default: vi.fn()
}));

describe('removeUserFromCssApp', () => {
  it('Calls the CSS api with userdata, clientdata and environment', async () => {
    axios.post = vi.fn().mockResolvedValue({ status: 200 });
    const user = { id: 1, username: 'test' };
    const clientData = [{ client: 'client', roles: ['role1', 'role2'] }];
    await removeUserFromCssApp({ id: 1, username: 'test' }, [{ client: 'client', roles: ['role1', 'role2'] }], 'dev');

    expect(axios.post).toHaveBeenCalledTimes(1);
    const firstCallArgs = axios.post.mock.calls[0];
    expect(firstCallArgs[1]).toEqual({ ...user, clientData, env: 'dev' });
  });
});

describe('removeStaleUsersByEnv', () => {
  const opts = {
    realm: 'idir',
    insertSql:
      'INSERT INTO kc_deleted_idir_users (realm, environment, user_data, realm_roles, client_roles, css_app_deleted) VALUES($1, $2, $3, $4, $5, $6)',
    shouldSkip: vi.fn(async () => false),
    shouldDelete: vi.fn(async () => true)
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Stops deleting once maximum is reached', async () => {
    axios.post = vi.fn().mockResolvedValue({ status: 200 });
    await removeStaleUsersByEnv('dev', pgMock, 'runnername', 0, () => {}, opts);

    // Each deleted user removes one user from idir and one from standard.
    expect(opts.shouldDelete).toHaveBeenCalledTimes(MAX_DELETED_USERS_PER_RUNNER);
    expect(axios.post).toHaveBeenCalledTimes(MAX_DELETED_USERS_PER_RUNNER);
  });

  it('Saves deletion record to the database', async () => {
    axios.post = vi.fn().mockResolvedValue({ status: 200 });
    await removeStaleUsersByEnv('dev', pgMock, 'runnername', 0, () => {}, opts);
    expect(pgMock.connect).toHaveBeenCalledTimes(1);

    // Each deletion inserts one record for idir and one for standard.
    expect(pgMock.query).toHaveBeenCalledTimes(MAX_DELETED_USERS_PER_RUNNER * 2);
    pgMock.query.mock.calls.forEach((args, i) => {
      const pgValues = args[0].values;
      const isIdirInsert = i % 2 === 0;
      const savedUser = JSON.parse(pgValues[2]);

      if (isIdirInsert) {
        expect(pgValues[0]).toBe('idir');
        expect(pgValues[1]).toBe('dev');
        expect(savedUser.id).toBe(mockUser.id);
        expect(savedUser.username).toBe(mockUser.username);
        expect(pgValues[3]).toEqual([]);
        expect(pgValues[4]).toEqual([]);
        expect(pgValues[5]).toBe(false);
      } else {
        expect(pgValues[0]).toBe('standard');
        expect(pgValues[1]).toBe('dev');
        expect(savedUser.id).toBe(mockUser.id);
        expect(savedUser.username).toBe(mockUser.username);
        expect(pgValues[3]).toEqual([]);
        expect(pgValues[4]).toEqual([]);
        expect(pgValues[5]).toBe(true);
      }
    });
  });

  it('Records whether CSS App callout was successful to the database', async () => {
    // Fail axios calls with not found
    axios.post = vi.fn().mockResolvedValue({ status: 404 });
    await removeStaleUsersByEnv('test', pgMock, 'runnername', 0, () => {}, opts);

    expect(pgMock.query).toHaveBeenCalledTimes(MAX_DELETED_USERS_PER_RUNNER * 2);
    pgMock.query.mock.calls.forEach((args, i) => {
      const pgValues = args[0].values;
      const isIdirInsert = i % 2 === 0;
      const savedUser = JSON.parse(pgValues[2]);

      if (isIdirInsert) {
        expect(pgValues[0]).toBe('idir');
        expect(pgValues[1]).toBe('test');
        expect(savedUser.id).toBe(mockUser.id);
        expect(savedUser.username).toBe(mockUser.username);
        expect(pgValues[3]).toEqual([]);
        expect(pgValues[4]).toEqual([]);
        expect(pgValues[5]).toBe(false);
      } else {
        expect(pgValues[0]).toBe('standard');
        expect(pgValues[1]).toBe('test');
        expect(savedUser.id).toBe(mockUser.id);
        expect(savedUser.username).toBe(mockUser.username);
        expect(pgValues[3]).toEqual([]);
        expect(pgValues[4]).toEqual([]);
        // Records the CSS Failure
        expect(pgValues[5]).toBe(false);
      }
    });
  });

  it('Calls the realm registry at the expected url when users are deleted from production', async () => {
    axios.delete = vi.fn().mockResolvedValue({ status: 200 });

    // When deleted from lower env no need to call realm registry
    await removeStaleUsersByEnv('test', pgMock, 'runnername', 0, () => {}, opts);
    expect(axios.delete).not.toHaveBeenCalled();

    // Should call when deleted from production
    await removeStaleUsersByEnv('prod', pgMock, 'runnername', 0, () => {}, opts);
    expect(axios.delete).toHaveBeenCalled();
    const firstCallURL = axios.delete.mock.calls[0][0];
    expect(firstCallURL).toContain(`/users/${mockUser.attributes.idir_user_guid}`);
  });
});
