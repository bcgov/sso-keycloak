import { sleep } from 'k6';
import { hitIntrospectionRoute, getAccessToken, createClient, deleteClient } from './helpers.js';
import { client } from './constants.js';

let config = JSON.parse(open(__ENV.CONFIG));
const username = config.kcLoadTest.username;
const password = config.kcLoadTest.password;
const clientId = config.kcLoadTest.clientId;

const CONCURRENT_LOOPS = 1;
const ITERATIONS_PER_LOOP = 10;
const LOOP_DELAY = 0.01;
const MAX_ALLOWED_FAILURE_RATE = '0.01'

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
    const clientInternalId = createClient('master', accessToken)
    return { accessToken, clientInternalId };
}

// VU code
export default function ({ accessToken }) {
    sleep(LOOP_DELAY)
    // If running longer than the token lifetime this will be inactive. But should be similar load. Fetching a fresh token would
    // change this test to also include the load of requesting access tokens.
    hitIntrospectionRoute(accessToken, 'master', client.clientId, client.secret)
}

export function teardown({clientInternalId}) {
    const accessToken = getAccessToken({ username, password, clientId: client.clientId, confidential: true, secret: client.secret });
    deleteClient('master', clientInternalId, accessToken)
}
