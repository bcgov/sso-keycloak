import { sleep, check } from 'k6';
import { createRealm, deleteRealm, createUser, generateRealms, getAccessToken, clearRealmSessions } from './helpers.js';
import { user, realm } from './constants.js';
import { username, password, clientId } from './env.js';

const TOTAL_ACTIVE_SESSIONS = 3000;
const TOTAL_REALMS = 30;

const RAMP_UP_TIME_SECONDS = 60;
const HOLD_TIME_SECONDS = 45;
const MAX_ALLOWED_FAILURE_RATE = '0.01';

const userPerRealm = Math.floor(TOTAL_ACTIVE_SESSIONS / TOTAL_REALMS);

export const options = {
  stages: [
    {
      target: userPerRealm,
      duration: `${RAMP_UP_TIME_SECONDS}s`,
    },
    {
      target: userPerRealm,
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
  const realms = generateRealms(TOTAL_REALMS);
  realms.forEach((realm) => {
    createRealm(realm, accessToken);
    createUser(user, realm.realm, accessToken);
  });
  return realms;
}

export default function (realms) {
  realms.forEach((realm) => {
    getAccessToken(user.username, user.credentials[0].value, clientId, realm.realm);
  });
  sleep(RAMP_UP_TIME_SECONDS + HOLD_TIME_SECONDS);
  return realms;
}

export function teardown(realms) {
  const accessToken = getAccessToken(username, password, clientId);
  realms.forEach((realm) => {
    deleteRealm(realm.realm, accessToken);
  });
}
