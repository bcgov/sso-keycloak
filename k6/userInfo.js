import { sleep } from 'k6';
import { getAccessToken, hitUserInfoRoute } from './helpers.js';
import { username, password, clientId } from './env.js';

const CONCURRENT_LOOPS = 1;
const ITERATIONS_PER_LOOP = 100;
const LOOP_DELAY = 0.1;
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
    return accessToken
}

// VU code
export default function (accessToken) {
    sleep(LOOP_DELAY)
    hitUserInfoRoute(accessToken, 'master')
}
