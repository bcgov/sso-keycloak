# Benchmark Guide

## Building Images

### Server Image

- You need a keycloak server with dataset provider added to be able to use it for generating test data
- To build such server image, run `.github/workflows/publish-image-keycloak-benchmark.yml` that builds an image using `docker/keycloak/Dockerfile-26-perf` that explicitly copies `docker/keycloak/dataset-providers/keycloak-benchmark-dataset-0.15-SNAPSHOT.jar` provider
- Deploy keycloak server run from this image **ONLY** in a test namespace.  See the [sso-helm-charts repo](https://github.com/bcgov/sso-helm-charts/tree/main/charts/keycloak).
- After the testing is complete, uninstall the server from the namespace

### Runner Image

- The runner image is required if you need to run benchmark tests against test keycloak server in an openshift pod
- The image can be built using `.github/workflows/publish-image-benchmark-runner.yml` that uses `benchmark/Dockerfile`
- Existing image `sso-benchmark-runner:dev` can be used and if not found, re-build the image
- The instructions for running the benchmark runner are provided [here](#running-the-tests)

## Dataset

- The dataset is required to pre-populate realms, clients, and users in Keycloak under test
- The dataset comes with a jar file that embeds a provider for generating the data
- The dataset can be invoked through API endpoints
- The `./docker/keycloak/Dockerfile-26-perf` is used to build Keycloak image with dataset provider. To build the image run `./.github/workflows/publish-image-keycloak-benchmark.yml` if image (`sso-benchmark:dev`) doesn't exist already

**DO NOT ADD THIS PROVIDER OR USE THIS IMAGE IN PROD ENVIRONMENTS**

### Generate Data

```sh
export KC_BASE_URL=

# create 1 realm (realm-0)
GET https://${KC_BASE_URL}/auth/realms/master/dataset/create-realms?count=1

# create 10000 users under realm-0
GET https://${KC_BASE_URL}/auth/realms/master/dataset/create-users?count=10000&realm-name=realm-0

# create 400 clients under realm-0
GET https://${KC_BASE_URL}/auth/realms/master/dataset/create-clients?count=400&realm-name=realm-0

# check the status of data generation
GET https://${KC_BASE_URL}/auth/realms/master/dataset/status
```

## Running the Tests

#### Pre-requisites

- Java 21 if running locally
- Access to Openshift cluster if running in a pod
- CHES service account
- Test instance of keycloak pre-loaded with test data using dataset

### Locally - without entrypoint.sh

- Download the benchmark test suite from `https://github.com/keycloak/keycloak-benchmark/releases/download/0.15-SNAPSHOT/keycloak-benchmark-0.15-SNAPSHOT.tar.gz`
- Extract the folder and run

```sh
export SCENARIO=
export SERVER_URL=
export ADMIN_USERNAME=
export ADMIN_PASSWORD=

# using 100 users and 100 clients to make 34 req/s for a duration of upto 30 mins
./bin/kcb.sh --scenario=${SCENARIO} --server-url=${SERVER_URL}/auth --admin-username=${ADMIN_USERNAME} --admin-password=${ADMIN_PASSWORD} --users-per-sec=34 --ramp-up=300 --users-per-realm=101 --measurement=1800 --clients-per-realm=101
```
### Locally - with entrypoint.sh

- Create `.env` from `.env.example` and set the appropriate values for the variables
- Run `./entrypoint.sh`

### Openshift Pod

- Create `.env` from `.env.example` and set the appropriate values for the variables
- Ensure you are logged onto the Openshift cluster
- Run `make cleanup` to ensure old resources get deleted
- Run `make run_job` to deploy a secret and a job that executes `entrypoint.sh` script in a pod

## ADDITIONAL_CONFIG

There are four runs we have done with the previous versions of keycloak.  In order for runs to be comparable the same runs should be done on future versions. These are controlled by the `ADDITIONAL_CONFIG` env var.

### Run 1

ADDITIONAL_CONFIG := "--users-per-sec=34 --ramp-up=300 --users-per-realm=101 --measurement=1800 --clients-per-realm=101"

### Run 2
--users-per-sec=100 --ramp-up=300 --users-per-realm=5001 --measurement=1800 --clients-per-realm=301
`

### Run 3
--users-per-sec=200 --ramp-up=300 --users-per-realm=9000 --measurement=1800 --clients-per-realm=301

### Run 4
--users-per-sec=500 --ramp-up=300 --users-per-realm=9995 --measurement=1800 --clients-per-realm=395

## Reports

- The html report will be generated under the `./results` directory if running locally without using `entrypoint.sh`
- Running `entrypoint.sh` locally or in a pod would send the report via email to the email address set under `RECEPIENT` environment variable
- Download the attachment from the email and use `base64 --decode` to decode the file `base64 --decode results.tar.gz>decoded_results.tar.gz`
- After the decode, you can extract the contents from the archive and use the browser to preview them `file://<<PATH_TO_FILE>>/req_browser-to-log---<<TIMESTAMP>>.html`

## References

- https://www.keycloak.org/keycloak-benchmark/benchmark-guide/latest/scenario-overview
- https://github.com/keycloak/keycloak-benchmark
