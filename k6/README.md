# Overview

This folder contains load tests for our sso application

## Setting up

### Leveraging sysdig for extra metrics

While running the load tests it is worth leveraging sysdig in the sanbox environments to detect latency in requests during testing.  These monitorin alerts can be manually created in the sysdig dashboard, or added to the terraform [sysdig repo](https://github.com/bcgov/sso-sysdig).

### Local environment

**Developing and Running tests in a local environment**: If you would like to use a local environment for developing and running tests, there is a [podman-compose.yaml](./local_setup/podman-compose.yaml) file in this repository you can use to run our custom redhat image with a postgres database. To use it, from the [loca setup folder](./local_setup/), run:

- `podman-compose up`

**Note**: _You will need to have installed podman and podman-compose. Alternatively, you can use the same commands with docker compose, just specify the file with the -f flag._

This will start our custom keycloak image on localhost:8080, you can login with credentials username=admin, password=admin. To stop the image, you can ctrl+c out (alternatively, add the -d flag to run detached), and run `podman-compose down`. To clear out the volumes, with the image stopped, run `podman volume prune` (or specify the volumes if you have additional ones to keep). The image is currently set to use `ghcr.io/bcgov/sso:7.6.25-build.1`, this can be updated as later builds come up.

**Tracking stats locally**: If you would like to compare resource usage of the different tests on your local machine, there is a small electron app to graph the output of podman stats. With the podman-compose running, you can run:

- `npm i`
- `npm start`

from the [podman-grapher](./local_setup/podman-grapher/) directory. This will launch a browser window graphing the CPU and Memory usage of the local keycloak docker container over time. You can run tests with it open, and save the png's if you want to check the relative differences.

**Note**:  _In `podman stats`, the CPU usage is per core. So the percent used can go up to 100 * (number of machine cores)_.

## Using

This test requires a client with a service account to run. E.g if using the default `admin-cli` client of the master realm locally, make sure the following are configured for it:

- In the client settings, set the **Access Type** to confidential, and then toggle on **Service accounts enabled**.
- Make sure that the clientID and clientSecret in [config.json](./k6-runner/src/config/config.json) match that client's credentials.

### Testing the Quarkus release:

Make certain that 'Client authentication' is toggled on and select 'Direct access grants' and 'Service accounts roles' from Authentication Flow.

**Do not do this in a production environment**. In the master realm, go to `Authentication->Direct grant` and disable "Condition- user configured" and "OTP".

If testing a live application, pick an appropriate client to use with a confidential service account.

- Copy `k6-runner/src/config/config.example.json` to `k6-runner/src/config/config.json`. Provide credentials for an account with permissions to create realms and users. If you are setting up locally, use the baseURL `http://localhost:8080/auth`, and you can use the admin-cli client ID with the admin admin credentials for username and password.

#### Running the test locally

These tests are adapted from the Ministry of Education's Student Online Access Module (SOAM), [load testing framework](https://github.com/bcgov/EDUC-KEYCLOAK-SOAM/blob/refs%2Fheads%2Fmaster/testing%2Fk6%2FREADME.md).  The tests can be un locally by using the `docker-compose.yml` file in the `k6-runner` directory. From the `k6-runner` directory, run:

```
docker-compose run k6 run -e CONFIG=/config/config.json /scripts/constantRateAllFlows.js
```

#### Running the test remotely

The remote test runs on the script `/k6/k6-runner/openshift/k6/start.sh`. To change the test, point the run command at a different file.

To run the test from a kubernetes pod you will need to do the following:

Create a docker image a push it to be hosted in the bcgov ghcr repos.  **Note: do not build any secrets into the image, it is a public repo**. From the `ku-runner` directiory run:
```
docker build . -t ghcr.io/bcgov/sso-k6:latest
docker push ghcr.io/bcgov/sso-k6:latest
```
This will create the image and host it. Each time you change the test code of config, this image will need to be rebuilt and pushed.

Next create the k6-config file in the namespace from which you want to run the tests:
```
make config NAMESPACE="<NAMESPACE>"
```

Lastly deploy the config from the `sso-keycloak/k6/k6-runner/openshift/k6` directory.
```
make run_job NAMESPACE="<NAMESPACE>"
```

Be sure to delete the job when done to prevent the load test from re-running in the cluster.

```
make delete  NAMESPACE="<NAMESPACE>"
```

#### Running the test locally without docker.

The tests can also be run without docker, by running:
`k6 run -e CONFIG=../config/config.json ./tests/constantRateAllFlows.js`
from the `sso-keycloak/k6/k6-runner/src` directory.


## Tests

### [Active Sessions](./activeSessions.js)

This test is setup to see how requesting access tokens affects the system. It can be configured with the following variables at the top of the file:

**CONCURRENT_LOOPS**: The number of loops to run concurrently. Increasing this number will allow the test to fire more requests at the same time. E.g running 3 concurrent loops would send 3 requests for an access token at once, and then wait the **LOOP_DELAY**, then fire all three again in the next realm.
**ITERATIONS_PER_LOOP**: The number of times each loop will run. Each loop requests an access token from every realm, waiting a small delay between access token requests set by the **LOOP_DELAY** variable.
**TOTAL_REALMS** = The number of realms to create. Each loop will request an access token from all realms on an iteration. So the total number of requested access tokens by a test will be `TOTAL_REALMS * ITERATIONS_PER_LOOP * CONCURRENT_LOOPS`. Increase this number to test if requesting access tokens from different realms with different users affects performance.
**MAX_ALLOWED_FAILURE_RATE**: The percentage of requests to allow to fail before counting the test as failed. Enter as a string of a decimal number, e.g `'0.01'` is 1%.
**OFFLINE** Set true to request offline_access tokens.
**LOOP_DELAY**: The amount of time to wait between token requests in each loop, in seconds. e.g 0.1 is 100ms. Set to 0 to fire as soon as possible.

### [Token Introspection](./tokenIntrospection.js)

Run this test to see how hitting the token introspection endpoint affects the system.

The test run can be configured with the following variables at the top of the file:

**CONCURRENT_LOOPS**: The number of loops to run concurrently. Increasing this number will allow the test to fire more requests at the same time. E.g running 3 concurrent loops would send 3 requests to the introspection endpoint at once, and then wait the **LOOP_DELAY**, then fire all three again in the next realm.
**ITERATIONS_PER_LOOP**: The number of times each loop will run. Each loop will hit the introspection endpoint this number of times, waiting a small delay between requests set by the **LOOP_DELAY** variable.
**LOOP_DELAY**: The amount of time to wait between requests in each loop, in seconds. e.g 0.1 is 100ms. Set to 0 to fire as soon as possible.

### [User Info](./userInfo.js)

Run this test to see how hitting the user info endpoint affects the system.

The test run can be configured with the following variables at the top of the file:

**CONCURRENT_LOOPS**: The number of loops to run concurrently. Increasing this number will allow the test to fire more requests at the same time. E.g running 3 concurrent loops would send 3 requests to the user info endpoint at once, and then wait the **LOOP_DELAY**, then fire all three again in the next realm.
**ITERATIONS_PER_LOOP**: The number of times each loop will run. Each loop will hit the user info endpoint this number of times, waiting a small delay between requests set by the **LOOP_DELAY** variable.
**LOOP_DELAY**: The amount of time to wait between requests in each loop, in seconds. e.g 0.1 is 100ms. Set to 0 to fire as soon as possible.

### [Constant Rate all Flows](./constantRateAllFlows.js)

Run this test to simulate fetching an access token, grabbing user info, and introspecting the token all together. This test has two scenarios, `peakProfile` and `stress`. The peak profile test is used to imitate our peak traffic running against the application for a two hour period. The stress test will ramp up traffic linearly over a 1 hour period until API requests start to fail, and then abort.

When stress testing, the application may get saturated with requests which prevents the teardown logic from succeeding, since it depends on the keycloak API being able to receive and act on requests. In this case, the test realms will not delete properly. These realms are all prefixed with "newrealm" and will need to be deleted manually.

The test run can be configured with the following variables at the top of the file:

**TOTAL_REALMS** = The number of realms to create.
**MAX_ALLOWED_FAILURE_RATE**: The percentage of requests to allow to fail before counting the test as failed. Enter as a string of a decimal number, e.g `'0.01'` is 1%.
**OFFLINE** Set true to request offline_access tokens.
**BASELINE_RATE**: If running the peakProfile scenario, this is the peak rate per minute of requests to use. It will also determine the start rate of the stress test.
