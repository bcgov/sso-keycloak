import { sleep, check } from 'k6';
import { createRealm, deleteRealm, createUser, deleteUser, getAccessToken, clearRealmSessions } from './helpers.js';
import { user, realm } from './constants.js';
import {username, password, clientId} from './env.js';

const TEST_DURATION_SECONDS = '1';
const TOTAL_ACTIVE_SESSIONS = 1;
const REALM_NAME = realm.realm;

export const options = {
  stages: [
    {
      target: TOTAL_ACTIVE_SESSIONS,
      duration: `${TEST_DURATION_SECONDS}s`,
    },
  ],
};

export function setup() {
  const accessToken = getAccessToken(username, password, clientId);
  const res = createRealm(realm, accessToken);
  // console.log(JSON.stringify(res, null , 2))

  // createUser(user, REALM_NAME, accessToken);
}

export default function () {
  getAccessToken(user.username, user.credentials[0].value, clientId, REALM_NAME);
  sleep(TEST_DURATION_SECONDS);
}

export function teardown() {
  const accessToken = getAccessToken(username, password, clientId);
  clearRealmSessions(REALM_NAME, accessToken);
  deleteRealm(REALM_NAME, accessToken);
}
