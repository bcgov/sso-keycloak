# K6 Runner for Load Tests

## Requirements

- `k6-patroni` timescaleDB built on top of postgreSQL managed by patroni
- `grafana` is the open source analytics & monitoring solution

## Setup

- Ensure `k6-patroni` is deployed in a namespace as a statefulset. Refer to this [guide](../../timescaledb/README.md) on setting up TimescaleDB.
- Copy `sso-keycloak/k6/k6-runner/src/config/config.example.json` to `sso-keycloak/k6/k6-runner/src/config/config.json` and update values accordingly

  ```sh
  # initialize env vars
  export NAMESPACE=
  export DB_USER=
  export DB_PASSWORD=

  # one of ('peakProfile', 'stressProfile', 'soakProfile')
  export SCENARIO=

  # create configmap with all the configurations
  make config

  # create a job to run load tests
  make run_job

  # clean up job and config map
  make cleanup
  ```
