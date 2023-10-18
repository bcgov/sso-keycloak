# About

This is the codebase for the [related helm chart](../../helm/kc-cron-job/).

## Zip Logs

The [zip logs](./zip-logs.js) job is designed to create zip files of the logs as the buildup in keycloak, and insert a copy into our database. Keycloak's [configuration](/docker/keycloak/configuration/standalone-openshift-7.6.xml#L68) periodically aggregates log files into dated files. The workflow for this job uses that to:

- zip logs files from the same date together into one folder
- delete zipped logs older than the EXPIRY_LENGTH_DAYS variable
- insert logs into a database for longer storage

### Testing

Tests for this job can be run with `yarn test`.
