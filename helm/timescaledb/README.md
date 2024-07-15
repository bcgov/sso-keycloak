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
