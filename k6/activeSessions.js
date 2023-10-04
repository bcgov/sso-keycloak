import { sleep } from 'k6';
import { createRealm, deleteRealm, createUser, generateRealms, getAccessToken } from './helpers.js';
import { user } from './constants.js';
import { username, password, clientId } from './env.js';

// Alter configuration to run separate tests. See this test in the readme for configuration details.
const CONCURRENT_LOOPS = 5;
const ITERATIONS_PER_LOOP = 50;
const TOTAL_REALMS = 3;
const MAX_ALLOWED_FAILURE_RATE = '0.01';
const OFFLINE = false;
const LOOP_DELAY = 0.1

export const options = {
  scenarios: {
    synchronousExecutions: {
      executor: 'per-vu-iterations',
      vus: CONCURRENT_LOOPS,
      iterations: ITERATIONS_PER_LOOP,
    }
  },
  thresholds: {
    http_req_failed: [
      {
        threshold: `rate<${MAX_ALLOWED_FAILURE_RATE}`,
        // Set true if you want to exit at this threshold. Can be useful for heavy tests where you want to save the poor server if its failing.
        // abortOnFail: true,
      },
    ],
  },
};

export function setup() {
  const accessToken = getAccessToken({ username, password, clientId, confidential: true });
  const emptyRealms = generateRealms(TOTAL_REALMS);
  emptyRealms.forEach((realm, i) => {
    createRealm(realm, accessToken);
    // No spread operators allowed in k6, only es5 :(
    const newUser = Object.assign({}, user, { username: `${user.username}_${i}` })
    createUser(newUser, realm.realm, accessToken);
  });
  return emptyRealms;
}

export default function (realms) {
  realms.forEach((realm, i) => {
    sleep(LOOP_DELAY)
    getAccessToken({ 
      username: `${user.username}_${i}`, 
      password: user.credentials[0].value, 
      clientId, 
      confidential: true, 
      realm: realm.realm, 
      offline: OFFLINE 
    });
  })
}

export function teardown(realms) {
  const accessToken = getAccessToken({ username, password, clientId, confidential: true });
  realms.forEach((realm, i) => {
    deleteRealm(realm.realm, accessToken);
  });
}

