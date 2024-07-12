# Load Testing Infra

The folder contains the necessary tools that can be deployed on OpenShift and are used to run the performance tests on Keycloak

## Installation

### Setup InfluxDB

- Run `export NAMESPACE=xxxx` to set the namespace where the InfluxDB shall be installed
- Run `make install-influxdb` to install the DB
- Access the InfluxDB site and create user/password, org and bucket. Ensure to copy the values.
- Copy the API token
- Set below environment vars with copied values

  ```sh
  export DOCKER_INFLUXDB_INIT_USERNAME=
  export DOCKER_INFLUXDB_INIT_PASSWORD=
  export DOCKER_INFLUXDB_INIT_ORG=
  export DOCKER_INFLUXDB_INIT_BUCKET=
  export DOCKER_INFLUXDB_INIT_ADMIN_TOKEN=
  ```

- Run `make influxdb-secret` to generate a secret that holds the above configuration. The secret is used by the `K6` runner to publish metrics

### Setup K6

- Copy `sso-keycloak/k6/k6-runner/src/config/config.example.json` to `sso-keycloak/k6/k6-runner/src/config/config.json` and populate all the values.
- Run `make k6-config` to create a config map
- Run `make create-k6-job` to create a `K6` runner job that runs all the tests

## Uninstallation

- Run `export NAMESPACE=xxxx` to set the namespace.
- Run `make destroy-influxdb` to remove InfluxDB from the namespace.
- Run `make destroy-k6-job` to remove `K6` runner job and config map from the namespace.
