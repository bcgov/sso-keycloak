# Benchmark Guide

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

## Reports

- The html report will be generated under the `./results` directory if running locally without using `entrypoint.sh`
- Running `entrypoint.sh` locally or in a pod would send the report via email to the email address set under `RECEPIENT` environment variable
- Download the attachment from the email and use `base64 --decode` to decode the file
- After the decode, you can extract the contents from the archive

## References

- https://www.keycloak.org/keycloak-benchmark/benchmark-guide/latest/scenario-overview
- https://github.com/keycloak/keycloak-benchmark
