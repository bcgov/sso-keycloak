const {
  removeStaleUsersByEnv,
  checkUserExistsAtIDIM,
  removeUserFromCssApp,
  MAX_DELETED_USERS_PER_RUNNER
} = require('../remove-inactive-idir-users');
const { getAdminClient, removeUserFromKc, getUserRolesMappings } = require('../helpers');
const axios = require('axios');

const pgMock = {
  connect: jest.fn(() => Promise.resolve(true)),
  query: jest.fn(() => Promise.resolve(true)),
  end: jest.fn(() => Promise.resolve(true))
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

jest.mock('../helpers', () => {
  return {
    ...jest.requireActual('../helpers'),
    getAdminClient: jest.fn(() =>
      Promise.resolve({
        users: {
          find: jest.fn(() => {
            const users = Array(100).fill(mockUser);
            return Promise.resolve(users);
          }),
          listRoleMappings: jest.fn(() =>
            Promise.resolve({
              realmMappings: [],
              clientMappings: []
            })
          ),
          del: jest.fn(() => Promise.resolve(true))
        },
        reauth: jest.fn()
      })
    ),
    removeUserFromKc: jest.fn(() => Promise.resolve()),
    getUserRolesMappings: jest.fn(() =>
      Promise.resolve({
        clientRoles,
        realmRoles
      })
    )
  };
});

jest.mock('../utils/bceid-webservice', () => {
  const actualModule = jest.requireActual('../utils/bceid-webservice');
  return {
    ...actualModule,
    checkUserExistsAtIDIM: jest.fn(() => Promise.resolve('notexists'))
  };
});

jest.mock('axios', () => {
  return {
    ...jest.requireActual('axios'),
    post: jest.fn(() => Promise.resolve({ status: 200 }))
  };
});

describe('removeUserFromCssApp', () => {
  it('Calls the CSS api with userdata, clientdata and environment', async () => {
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
    jest.clearAllMocks();
  });

  it('Stops deleting once maximum is reached', async () => {
    await removeStaleUsersByEnv('dev', pgMock, 'runnername', 0, () => {});
    expect(removeUserFromKc).toHaveBeenCalledTimes(MAX_DELETED_USERS_PER_RUNNER);
    expect(axios.post).toHaveBeenCalledTimes(MAX_DELETED_USERS_PER_RUNNER);
  });

  it('Saves deletion record to the database', async () => {
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
    // Fail axios calls with not found
    axios.post.mockResolvedValue({ status: 404 });
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
});
