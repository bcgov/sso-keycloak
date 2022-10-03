# Patroni chart for the silver keycloak deployments.

## Purpose

This helm chart is used for the silver keycloak apps.


## Create a values file in silver-patroni folder.

1. )


```console
$ helm repo add sso-charts https://bcgov.github.io/sso-helm-charts
```

```
helm install test-patorni sso-charts/patroni --namespace 3d5c3f-prod --version 0.0.1 --values ./values-3d5c3f-prod.yaml
```

```
helm upgrade test-patorni sso-charts/patroni --namespace 3d5c3f-prod --version 0.0.1 --values ./values-3d5c3f-prod.yaml
```


```
helm uninstall test-patorni --namespace 3d5c3f-prod
```

For now try using
```
helm upgrade test-patorni sso-charts/patroni --namespace 3d5c3f-prod --values ./values-3d5c3f-prod.yaml
```


Create copies of the secrets.  The helm chart was doing weird stuff

sso-keycloak-admin-secret
sso-keycloak-jgroups
in the postgres cred, rename the admin cred:
 username-superuser password-superuser






Write up attempt:






Goal upgrade from postgres 10 to 11. Since we are hoping to


Upgrade path:

 - Create the docker image pull credential in the namespace

 - Build the values file for the patroni helm chart (copy over the secrets)

 - Deploy the patroni helm chart with the correct image and postgress version 11. Use the same passwords as in active database.

 - Backup the database
   `./backup.sh -s`

 - Get the leader pod `patronictl list` log into that terminal

 - Get the db name

 `psql`
 `\l`

 - scale down keycloak, put patroni leader in maintenance mode

  `patronictl pause`
  `patronictl resume`



Create a local backup with dump all:

`kubectl -n 3d5c3f-prod exec -i sso-pgsql-prod-0 -- /usr/bin/pg_dumpall -U postgres > sand_prod_dumpall`

run `tail sand_prod_dumpall`

The output should be "PostgreSQL database cluster dump complete."

Verify the new cluster:
oc -n 3d5c3f-prod get pods
oc -n 3d5c3f-prod rsh test-patorni-3-patroni-0
patronictl list

Create the rhsso user:

CREATE USER rhsso WITH PASSWORD '****************';

THIS LINE DID NOT WORK!
<!-- kubectl -n 3d5c3f-prod exec -i test-patorni-3-patroni-0 -- psql -U rhsso < sand_prod_dumpall -->


kubectl -n 3d5c3f-prod exec -i test-patorni-3-patroni-0 -- psql < sand_prod_dumpall


modify the helm keycloak chart
`sso-keycloak/helm/keycloak/values-3d5c3f-prod.yaml`

host points at the new service

```
postgres:
  host: test-patorni-3-patroni
```

make upgrade NAMESPACE=3d5c3f-prod

There are secrets not being generated properly



<!-- sso-keycloak-admin-secret
sso-keycloak-jgroups
in the postgres cred, rename the admin cred:
 username-superuser password-superuser -->

Scale down the old patroni pods
Delete 2 of the 3 PVCs
Scale up the new patroni pods

## In the silver patroni folder run

Chang pod number in values-3d5c3f-prod.yaml from 1 to 3
Comment out the credential creation step (they have already been created)
helm upgrade test-patorni sso-charts/patroni --namespace 3d5c3f-prod --values ./values-3d5c3f-prod.yaml

Connect the backup container to the new db
Connect metabase to the new db
KC cron jobs?
