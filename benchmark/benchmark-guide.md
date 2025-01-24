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

## Benchmark

- Download the benchmark test suite from `https://github.com/keycloak/keycloak-benchmark/releases/download/0.15-SNAPSHOT/keycloak-benchmark-0.15-SNAPSHOT.tar.gz`
- Extract the folder and run

```sh
# using 100 users and 100 clients to make 34 req/s for a duration of upto 30 mins
./bin/kcb.sh --scenario=keycloak.scenario.authentication.AuthorizationCode --server-url=${KC_BASE_URL}/auth --admin-username=xxx --admin-password=xxxx --users-per-sec=34 --ramp-up=300 --users-per-realm=101 --measurement=1800 --clients-per-realm=101
```

## Reports

- The html report will be generated under the `./results` directory

## References

- https://www.keycloak.org/keycloak-benchmark/benchmark-guide/latest/scenario-overview
- https://github.com/keycloak/keycloak-benchmark
