import { sleep, check } from 'k6';
import { createRealm, deleteRealm, createUser, generateRealms, getAccessToken, clearRealmSessions } from './helpers.js';
import { user, realm } from './constants.js';
import {username, password, clientId} from './env.js';

const TEST_DURATION_SECONDS = '20';
const TOTAL_ACTIVE_SESSIONS = 3000;
const TOTAL_REALMS = 25;

const USERS_PER_REALM = Math.floor(TOTAL_ACTIVE_SESSIONS / TOTAL_REALMS);

export const options = {
  stages: [
    {
      target: USERS_PER_REALM,
      duration: `${TEST_DURATION_SECONDS}s`,
    },
  ],
};

export function setup() {
  const accessToken = getAccessToken(username, password, clientId);
  const realms = generateRealms(TOTAL_REALMS);
  realms.forEach(realm => {
    createRealm(realm, accessToken);
    createUser(user, realm.realm, accessToken)
  });
  return realms;
}

export default function (realms) {
  getAccessToken(user.username, user.credentials[0].value, clientId, realms[0].realm);
  realms.forEach(realm => {
    getAccessToken(user.username, user.credentials[0].value, clientId, realm.realm);
  })
  sleep(TEST_DURATION_SECONDS);
  return realms
}

export function teardown(realms) {
  const accessToken = getAccessToken(username, password, clientId);
  realms.forEach(realm => {
    deleteRealm(realm.realm, accessToken);
  });
}
