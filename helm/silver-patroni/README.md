# Patroni chart for the silver keycloak deployments.

## Purpose

This helm chart is used for the silver keycloak apps. These charts will make upgrading postgres more reliable if another version is needed before keycloak silver is decomissioned.


## Installing a new patroni instance

```console
$ helm repo add sso-charts https://bcgov.github.io/sso-helm-charts
```

```
helm install <<patroni-name>> sso-charts/patroni --namespace <<namespace>> --version 0.0.1 --values ./<<values_file>>.yaml
```

To change an existing chart use the upgrade command:

```
helm upgrade <<patroni-name>> sso-charts/patroni --namespace <<namespace>> --values ./<<values_file>>.yaml
```

## Potential issues

When upgrading there is a limitation in the sso patroni helm chart used.  It will only create additional databases whose user username matches the database name.  This is a patern followed in the gold cluster but not silver.

If there is a silver database that is being upgraded, it is best to create an app db matching the existing db name then adding a new user matching the old db username

```
  additionalCredentials:
    - username: <<old_db_name>>
      password:
```

This will create a database in the new statefull set with the old name.  Logging into the postgres cluster as the speruser, we can create a new user via:

```
create user <<old_db_username>> with encrypted password '<<user_password>>';
grant all privileges on database <<old_db_name>> to <<old_db_username>>;
```

This creates a username and database that will allow a seamless upgrade from one postgres version to another. Note a kubernetes secret will need to be passed to

```
kubectl create secret generic patroni-11-test-secret -n 6d70e7-test \
  --from-literal=username=<<old_db_username>> \
  --from-literal=password=<<user_password>>
```
