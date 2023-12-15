
## **BEFORE RUNNING HELM UPGRADE:**

Make sure to add the rocket chat webhook to production facing values files.  Make sure not to commit this value.

## Intro to backup container

The current patroni clusters are backud up using a modified version of the platform services backup container.  This is due to an issue with the spilo patroni image.

The backup container repo is [here](https://github.com/BCDevOps/backup-container).

The modified postgres plugin can be found [here](https://github.com/bcgov/sso-keycloak/blob/dev/docker/backup-container/backup.postgres.plugin).

A side effect of this conflict is that we cannot currently verify the daily backups with a test restoration.

## Installing and upgrading backups

These charts can be upgraded using make commands:

`make upgrade NAME=sso-backup NAMESPACE=<<namespace>>`

To restore from the most recent backup, follow the docs `sso-keycloak/docs/bkp-and-restore-keycloak-db.md`


Deprecated method left as an example: rsh into the backup pod in the namespace in question and run:

**dev silver production**:

`./backup.sh -r postgres=sso-pgsql-dev-11-patroni:5432/rhsso`
