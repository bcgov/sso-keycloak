These charts can be upgraded using make commands:

`make upgrade NAME=patroni-backup-storage NAMESPACE=<<namespace>>`

To restore from the most recent backup, rsh into the backup pod in the namespace in question and run:

**dev silver production**:

`./backup.sh -r postgres=sso-pgsql-dev-11-patroni:5432/rhsso`

**test silver production**:

`./backup.sh -r postgres=sso-pgsql-test-11-patroni:5432/keycloak`

**prod silver production**:

`./backup.sh -r postgres=sso-pgsql-prod-11-patroni:5432/rhsso`
