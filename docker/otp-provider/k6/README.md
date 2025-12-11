# SETUP

These load tests can be run against OTP. To work, the running image must have the env var TEST_MODE=true, this bypasses the email and sets a known code for the test to use. In dev sandbox you can use the task definition "otp-provider-test-mode" which has it set.

You will also need to ensure the otp server has a client setup in the "ClientConfig" table with a client id, secret, and redirect uris you can use. The test is setup to use a confidential client.

## Config

Each VU in the test will run a full auth code to get a token, sleep 1 second, and repeat. Configure more VUs to have more logins/second.

The default options are set to:

``` js
export const options = {
    vus: 5,
    duration: '10s',
    thresholds: {
        // Fail if any request takes longer than 5s
        http_req_duration: ['max<5000'],
        http_req_failed: ['rate<0.001'], // fail if more than 0.1% fail
    },
};
```

So 5 logins per second, lasting 10 seconds. The test will fail on more than 1/1000 failures, or if any http request takes longer than 5 seconds. Adjust these parameters to check different cases.

## Usage

When running provide the env vars for CLIENT_ID, CLIENT_SECRET, REDIRECT_URI and the server base url:

`k6 run -e CLIENT_ID=<client-id> -e CLIENT_SECRET=<client-secret> -e REDIRECT_URI=<redirect-uri> -e OTP_BASE_URL="https://dev.sandbox.otp.loginproxy.gov.bc.ca" load-test.js`
