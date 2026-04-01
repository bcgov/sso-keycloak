import { vi, expect, describe, it, beforeEach } from 'vitest';
import {
  removeUserFromCssApp,
  MAX_DELETED_USERS_PER_RUNNER,
  removeStaleUsersByEnv
} from '../remove-inactive-idir-users.js';
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
          find: vi.fn(() => {
            const users = Array(100).fill(mockUser);
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Stops deleting once maximum is reached', async () => {
    axios.post = vi.fn().mockResolvedValue({ status: 200 });
    const { removeUserFromKc } = await import('../helpers.js');
    await removeStaleUsersByEnv('dev', pgMock, 'runnername', 0, () => {});
    expect(removeUserFromKc).toHaveBeenCalledTimes(MAX_DELETED_USERS_PER_RUNNER);
    expect(axios.post).toHaveBeenCalledTimes(MAX_DELETED_USERS_PER_RUNNER);
  });

  it('Saves deletion record to the database', async () => {
    axios.post = vi.fn().mockResolvedValue({ status: 200 });
    await removeStaleUsersByEnv('dev', pgMock, 'runnername', 0, () => {});
    expect(pgMock.connect).toHaveBeenCalledTimes(1);

    expect(pgMock.query).toHaveBeenCalledTimes(MAX_DELETED_USERS_PER_RUNNER);
    pgMock.query.mock.calls.forEach((args) => {
      // pg query arguments are Objects with keys text, values. Checking expected values match input data
      const pgValues = args[0].values;
      expect(pgValues).toEqual([
        'dev',
        mockUser.id,
        mockUser.username,
        mockUser.email,
        mockUser.firstName,
        mockUser.lastName,
        JSON.stringify(mockUser.attributes),
        realmRoles,
        clientRoles.map((r) => JSON.stringify(r)),
        // True indicates successful CSS response
        true
      ]);
    });
  });

  it('Records whether CSS App callout was successful to the database', async () => {
    const { removeStaleUsersByEnv } = await import('../remove-inactive-idir-users.js');
    // Fail axios calls with not found
    axios.post = vi.fn().mockResolvedValue({ status: 404 });
    await removeStaleUsersByEnv('test', pgMock, 'runnername', 0, () => {});

    expect(pgMock.query).toHaveBeenCalledTimes(MAX_DELETED_USERS_PER_RUNNER);
    pgMock.query.mock.calls.forEach((args) => {
      // pg query arguments are Objects with keys text, values. Checking expected values match input data
      const pgValues = args[0].values;
      expect(pgValues).toEqual([
        'test',
        mockUser.id,
        mockUser.username,
        mockUser.email,
        mockUser.firstName,
        mockUser.lastName,
        JSON.stringify(mockUser.attributes),
        realmRoles,
        clientRoles.map((r) => JSON.stringify(r)),
        // Records the CSS Failure
        false
      ]);
    });
  });

  it('Calls the realm registry at the expected url when users are deleted from production', async () => {
    axios.delete = vi.fn().mockResolvedValue({ status: 200 });

    // When deleted from lower env no need to call realm registry
    await removeStaleUsersByEnv('test', pgMock, 'runnername', 0, () => {});
    expect(axios.delete).not.toHaveBeenCalled();

    // Should call when deleted from production
    await removeStaleUsersByEnv('prod', pgMock, 'runnername', 0, () => {});
    expect(axios.delete).toHaveBeenCalled();
    const firstCallURL = axios.delete.mock.calls[0][0];
    expect(firstCallURL).toContain(`/users/${mockUser.attributes.idir_user_guid}`);
  });
});
