# Backup and Restore Keycloak Database

Restoring a db from a backup in the same namespace it was created is documented in the [Backup Container Documentation](https://developer.gov.bc.ca/Backup-Container).  However if you need to restore a backup in a different namespace or cluster from it's source, the following approach will work.

## Set the environment

```sh
export SOURCE_NAMESPACE=
export DEST_NAMESPACE=
```

## Creating a backup

```sh
  oc -n $SOURCE_NAMESPACE exec $(oc -n $SOURCE_NAMESPACE get pod -l "app.kubernetes.io/name=sso-backup-storage" -o custom-columns=":metadata.name") -- ./backup.sh -s
```

## Restoring the database

- Scale down the keycloak pods to 0

  ```sh
  oc scale --replicas=0 deployment sso-keycloak
  ```

- Follow below steps to restore the database

  ```sh
  # copy latest backup to your local folder
  # Note: update YYYY-MON-DD_HOUR-MIN-SEC with latest date and time
  oc -n $SOURCE_NAMESPACE cp $(oc -n $SOURCE_NAMESPACE get pod -l "app.kubernetes.io/name=sso-backup-storage" -o custom-columns=":metadata.name"):/backups/daily/YYYY-MON-DD/sso-patroni-ssokeycloak_YYYY-MON-DD_HOUR-MIN-SEC.sql.gz /sso-patroni-ssokeycloak.sql.gz

  # copy the latest backup from your local folder to master patroni pod /tmp/backup folder
  oc -n $DEST_NAMESPACE cp ./ $(oc -n $DEST_NAMESPACE get pod -l "spilo-role=master" -o custom-columns=":metadata.name"):/tmp/backup

  # ssh to your master patroni pod
  oc -n $DEST_NAMESPACE exec -ti $(oc -n $DEST_NAMESPACE get pod -l "spilo-role=master" -o custom-columns=":metadata.name") -- bash

  # extract sql file
  gunzip /tmp/backup/sso-patroni-ssokeycloak.sql.gz

  # delete existing database
  psql -c "drop database ssokeycloak"

  # create new database
  psql -c "create database ssokeycloak"

  # run the sql file on the new database
  psql -d ssokeycloak -f /tmp/backup/patroni-spilo-ssokeycloak.sql
  ```

- Scale up keycloak pods

  ```sh
  oc scale --replicas=5 deployment sso-keycloak
  ```

- After restoration, update the `sso-keycloak-admin` secret in destination namespace using source namespace secret

## References

- https://developer.gov.bc.ca/Backup-Container
