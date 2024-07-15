# Installing TimescaleDB

## Setup

- Run below to install the patroni managed postgres instance

```sh
export NAMESPACE=

helm repo add sso-charts https://bcgov.github.io/sso-helm-charts

helm upgrade --install k6-patroni sso-charts/patroni -n ${NAMESPACE} --version 1.6.0 -f ${NAMESPACE}-values.yaml
```

- Create a database and enable the timescaleDB extension

```sql
CREATE DATABASE k6loadtests;

\c k6loadtests;

CREATE EXTENSION IF NOT EXISTS timescaledb;
```

### Grafana

- Existing [grafana](https://sso-grafana-sandbox.apps.gold.devops.gov.bc.ca/) instance is being used to host the dashboards.
- Ensure a data source exists with below config.

  ```yaml
  name: 'K6 Load Tests TimeScaleDB'
  type: postgres
  url: k6-patroni.xxx.svc.cluster.local:5432
  database: k6loadtests
  user: xxx
  isDefault: false
  secureJsonData:
    password: xxx
  jsonData:
    sslmode: 'disable' # disable/require/verify-ca/verify-full
    maxOpenConns: 0 # Grafana v5.4+
    maxIdleConns: 2 # Grafana v5.4+
    connMaxLifetime: 14400 # Grafana v5.4+
    postgresVersion: 15
    timescaledb: true
  ```

- Pre-built dashboards can be found [here](https://github.com/grafana/xk6-output-timescaledb/tree/main/grafana/dashboards)](https://github.com/grafana/xk6-output-timescaledb/tree/main/grafana/dashboards)
