import { sleep, check } from 'k6';
import { createRealm, deleteRealm, createUser, generateRealms, getAccessToken, clearRealmSessions } from './helpers.js';
import { user, realm } from './constants.js';
import { username, password, clientId } from './env.js';

const TOTAL_ACTIVE_SESSIONS = 3000;
const TOTAL_REALMS = 30;
const MAX_ALLOWED_FAILURE_RATE = '0.01';

const RAMP_UP_TIME_SECONDS = 60;
const HOLD_TIME_SECONDS = 45;

export const options = {
  stages: [
    {
      target: TOTAL_ACTIVE_SESSIONS,
      duration: `${RAMP_UP_TIME_SECONDS}s`,
    },
    {
      target: TOTAL_ACTIVE_SESSIONS,
      duration: `${HOLD_TIME_SECONDS}s`,
    },
  ],
  thresholds: {
    http_req_failed: [
      {
        threshold: `rate<${MAX_ALLOWED_FAILURE_RATE}`,
        // abortOnFail: true,
      },
    ],
  },
};

export function setup() {
  const accessToken = getAccessToken(username, password, clientId);
  const emptyRealms = generateRealms(TOTAL_REALMS);
  emptyRealms.forEach((realm, i) => {
    createRealm(realm, accessToken);
    if (i === 0) createUser(user, realm.realm, accessToken);
  });
  return emptyRealms;
}

export default function (realms) {
  getAccessToken(user.username, user.credentials[0].value, clientId, realms[0].realm);
  sleep(RAMP_UP_TIME_SECONDS + HOLD_TIME_SECONDS);
  return realms;
}

export function teardown(realms) {
  const accessToken = getAccessToken(username, password, clientId);
  realms.forEach((realm, i) => {
    deleteRealm(realm.realm, accessToken);
  });
}
