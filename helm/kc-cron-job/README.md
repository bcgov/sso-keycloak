# Keycloak CronJob Helm Chart

Full steps for installing the `kc-cron-job` as of May 2022.

The `kc-cron-jobs` are currently used to pull two types of data from the running keycloak application and storing it in the databse cluster `kc-cron-patroni`.  This data is then accessible by the project's metabase deployment, allowing long term metrics to be preserved and analysed.

The two jobs preserve the number of active sessions in the application and the event logs of the application.  These logs may also be preserved through our Hive/splunk integration however that process is unrelated to the cron jobs deployed here.

The deplouyment steps for a new namespace follow:

## 1. Create the patroni secret.

Create the secret in the relevant tools namespace: `kc-cron-patroni` look up the patroni requirements on the script
in the folder `helm/patroni` run:

```
make create-random-db-secret NAME=kc-cron-patroni NAMESPACE=<namespace>
```

## 2. Expand the resources in the namespace

If there is not enough space in the tools namespace for the logs you may need to request more.

## 3. Create the database in the tools namespace

In the `helm/patroni` folder, run:

```
make install NAME=kc-cron-patroni NAMESPACE=<namespace>
```

## 4. Create a service account

Create a service account in key cloak.  This should eventually be set up in terraform, but for now do it manually.  In the `master` realm create the followin client if it does not exist:

Name: `script-cli`
Standard Flow Enabled" `OFF`
Access type: `confidential`

The credential key will be added to the `kc-cron-service-account` secret for the cron job to access. To create this secret in the tools namespace, run the following command in the `helm/kc-cron-job` folder.

```
make service-acount-secret \
NAME=kc-cron-patroni \
NAMESPACE=<namespace> \
URL=<keycloak_url> \
CLIENTSECRET=<credential_secret>
```

## 5. Install the helm chart for `kc-cron-job`

In the `helm/kc-cron-job` folder you will need to run:

```
make install NAMESPACE=<namespace>
```

or

```
make upgrade NAMESPACE=<namespace>
```

As usual the unsitall command is:

```
make uninstall NAMESPACE=<namespace>
```

Note, unistall process may be slightly buggy and will not remove the helm patroni deployments.

## 6. Add the db to metabase

Once the cron job is running and the database is set up we can connect to the metabase instance. See the folder `helm/metabase/README.md` for details on connecting to metabase instances and setting network policies.
