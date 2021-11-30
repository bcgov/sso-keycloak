import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    {
      target: 300,
      duration: '10s',
    },
    {
      target: 10,
      duration: '10s',
    },
  ],
  thresholds: {
    // 95% of requests must finish within 200ms.
    http_req_duration: ['p(95)<200'],
    // During the whole test execution, the error rate must be lower than 1%.
    http_req_failed: ['rate<0.01'],

    // Alternative syntax to abort test if failing
    // http_req_failed: [{
    // threshold: 'p(99) < 10',
    // abortOnFail: true,
    // }],
  },
};

export function setup() {
  // Run any code to setup before the VUs start here
  console.log('setting up...');
  // Any returned data will be an argument to the default function and teardown function
  return 'Custom stuff';
}

export default function (data) {
  const res = http.get(
    'https://sso-prod-3d5c3f-prod.apps.silver.devops.gov.bc.ca/auth/realms/onestopauth/.well-known/openid-configuration',
  );
  check(res, {
    'is status 200': (r) => r.status === 200,
  });
  sleep(1);
}

export function teardown() {
  // Run any code to teardown after the test here
  console.log('tearing down...');
}
