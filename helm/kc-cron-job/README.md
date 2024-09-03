# Keycloak CronJob Helm Chart

Full steps for installing the `kc-cron-job` as of May 2022.

The `kc-cron-jobs` are currently used to pull two types of data from the running keycloak application and storing it in the databse cluster `kc-cron-patroni`. This data is then accessible by the project's grafana deployment, allowing long term metrics to be preserved and analysed.

The two jobs preserve the number of active sessions in the application and the event logs of the application. These logs may also be preserved through our Hive/splunk integration however that process is unrelated to the cron jobs deployed here.

The deployment steps for a new namespace follow:

## 1. Create `kc-cron-job-secret` secret

- **This step is optional and can be ignored if not installing `cron-remove-inactive-users.yaml`**

```sh
# update rest of the values
export DEV_KEYCLOAK_USERNAME=
export DEV_KEYCLOAK_PASSWORD=
export DEV_KEYCLOAK_URL=https://dev.loginproxy.gov.bc.ca
export TEST_KEYCLOAK_USERNAME=
export TEST_KEYCLOAK_PASSWORD=
export TEST_KEYCLOAK_URL=https://test.loginproxy.gov.bc.ca
export PROD_KEYCLOAK_USERNAME=
export PROD_KEYCLOAK_PASSWORD=
export PROD_KEYCLOAK_URL=https://loginproxy.gov.bc.ca
export PGHOST=
export PGPORT=5432
export PGUSER=postgres
export PGPASSWORD=
export PGDATABASE=
export CSS_API_URL=http://localhost:8080/app
export CSS_API_AUTH_SECRET=
export RC_WEBHOOK=
export DC_USERS_RETENTION_DAYS=
export INACTIVE_IDIR_USERS_RETENTION_DAYS=

# update <namespace> and run to create the secret
make kc-cron-job-secret NAMESPACE=<namespace>
```

## 2. Expand the resources in the namespace

If there is not enough space in the tools namespace for the logs you may need to request more. This can be done through the (Platform Services Registry)[https://registry.developer.gov.bc.ca/]

## 3. Create a service account

Create a service account in key cloak. This should eventually be set up in terraform, but for now do it manually. In the `master` realm create the following client if it does not exist:

### Client Configuration

- Name: `script-cli`
- Client Protocol: `Openid-Connect`
- Standard Flow Enabled: `False`
- Access Type: `Confidential`
- Service Accounts Enabled: `True`
- Service Account Roles:
  - Realm Roles: `viewer` and `master-viewer`

The credential key will be added to the `kc-cron-service-account` secret for the cron job to access. To create this secret in the tools namespace, run the following command in the `helm/kc-cron-job` folder.

```sh
make service-acount-secret \
NAME=kc-cron-service-account \
NAMESPACE=<namespace> \
URL=<keycloak_url> \
CLIENTNAME=<client_name> \
CLIENTSECRET=<credential_secret>
```

## 4. Install the helm chart for `kc-cron-job`

In the `helm/kc-cron-job` folder you will need to run:

```sh
make install NAMESPACE=<namespace>
```

or

```sh
make upgrade NAMESPACE=<namespace>
```

As usual the unsitall command is:

```sh
make uninstall NAMESPACE=<namespace>
```

Note, unistall process may be slightly buggy and will not remove the helm patroni deployments.

## 5. Create the patroni secret in other namespaces.

- `cron-event-logs.yaml` expects `kc-cron-patroni` secret to be available in the namespace so repeat below step in all the namespaces where the `cron-event-logs.yaml` has to run
- To create the secret in the relevant namespace: `kc-cron-patroni` run:

```sh
make create-postgres-db-secret NAME=kc-cron-patroni NAMESPACE=<namespace> SECRET=<postgres-superuser-secret>
```
