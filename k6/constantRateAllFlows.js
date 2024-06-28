import { sleep } from 'k6';
import { createRealm, deleteRealm, createUser, generateRealms, getAccessToken, hitIntrospectionRoute, hitUserInfoRoute, createClient } from './helpers.js';
import { user, client } from './constants.js';
import { username, password, clientId } from './env.js';

// Alter configuration to run separate tests. See this test in the readme for configuration details.
const TOTAL_REALMS = 1;
// This essentially just means no dropped requests allowed since we dont get to 10000 on the peak profile.
const MAX_ALLOWED_FAILURE_RATE = '0.0001';
const OFFLINE = false;

// Peak requests per minutes we've seen on the system
const BASELINE_RATE = 34;

export const options = {
    scenarios: {
        peakProfile: {
          executor: 'constant-arrival-rate',
          duration: '2h',
          timeUnit: '1m',
          rate: 34,
          preAllocatedVUs: 5,
        },
        // stress: {
        //     executor: 'ramping-arrival-rate', //Assure load increase if the system slows
        //     startRate: 0,
        //     timeUnit: '1m',
        //     preAllocatedVUs: 10000,
        //     stages: [
        //         // Ramp in 100 req/sec intervals, and hold 5 mins.
        //         // Each loop runs 3 req/sec, so (target * 3) / 60 = req/sec.
        //         { duration: '5m', target: 2000 },
        //         { duration: '5m', target: 2000 },
        //         { duration: '5m', target: 4000 },
        //         { duration: '5m', target: 4000 },
        //         { duration: '5m', target: 6000 },
        //         { duration: '5m', target: 6000 },
        //         { duration: '5m', target: 8000 },
        //         { duration: '5m', target: 8000 },
        //         { duration: '5m', target: 10000 },
        //         { duration: '5m', target: 10000 },
        //     ],
        // }


        // stress: {
        //     executor: 'ramping-arrival-rate', //Assure load increase if the system slows
        //     startRate: BASELINE_RATE,
        //     timeUnit: '1m',
        //     preAllocatedVUs: 20000,
        //     stages: [
        //         { duration: '1m', target: BASELINE_RATE }, // just slowly ramp-up to a HUGE load
        //         // just slowly ramp-up to an EPIC load.
        //         { duration: '1h', target: 20000 },
        //     ],
        // }
    },
    thresholds: {
        http_req_failed: [
            {
                threshold: `rate<${MAX_ALLOWED_FAILURE_RATE}`,
                // Leave this in! Don't keep hammering the poor server after its failing, requests will queue
                abortOnFail: true,
            },
        ],
        // Requests tend to drop after 60 second timeout. Can use below to fail earlier
        // http_req_duration: [
        //     {
        //         threshold: `p(95)<15000`,
        //         abortOnFail: true,
        //     },
        // ]
    },
};

export function setup() {
    const accessToken = getAccessToken({ username, password, clientId, confidential: true });
    const emptyRealms = generateRealms(TOTAL_REALMS);
    emptyRealms.forEach((realm, i) => {
        createRealm(realm, accessToken);
        const newUser = Object.assign({}, user, { username: `${user.username}_${i}` })
        createUser(newUser, realm.realm, accessToken);
        // Create a confidential client to be able to use the introspection endpoint with this realm
        createClient(realm.realm, accessToken)
    });
    return emptyRealms;
}

export default function (realms) {
    realms.forEach((realm, i) => {
        const accessToken = getAccessToken({
            username: `${user.username}_${i}`,
            password: user.credentials[0].value,
            clientId,
            confidential: true,
            realm: realm.realm,
            offline: OFFLINE
        });
        hitUserInfoRoute(accessToken, realm.realm)
        hitIntrospectionRoute(accessToken, realm.realm, client.clientId, client.secret)
    })
}

export function teardown(realms) {
    // When stress testing, the enqueued requests can block teardown api requests from succeeding. Adding in a sleep to let the system recover a bit before trying to cleaunup.
    sleep(45)
    console.log('tearing down...')
    const accessToken = getAccessToken({ username, password, clientId, confidential: true });
    realms.forEach((realm, i) => {
        deleteRealm(realm.realm, accessToken);
    });
}
