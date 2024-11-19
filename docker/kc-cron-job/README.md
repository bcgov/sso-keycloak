# About

This repository contains cron jobs for managing the keycloak instances. It contains two jobs:

- [Remove Inactive IDIR Users](./remove-inactive-idir-users.js): A script to check keycloak users against the IDIR directory, and remove and users that are no longer in the directory.
- [Remove DC Users](./remove-dc-users.js): This script removes DC Users to prevent build up, as each authentication creates a unique user in keycloak.

Both jobs run in the tools namespace, and manage the three dev/test/prod environments at once.

## Local Development

1. The jobs integrate with the css-app and the dev/test/prod keycloak instances. To run those locally you can use the docker-compose file in the [sso-requests](https://github.com/bcgov/sso-requests) repository. Run `docker-compose up` from the root of that repository to start them.

1. You will also require a local postgres database running on port 5432. See the [DC helm chart](../../helm/kc-cron-job/templates/cron-remove-dc-users.yaml#L24) and [IDIR helm chart](../../helm/kc-cron-job/templates/cron-remove-inactive-users.yaml#L24) for the relevant migration details in the init container. i.e.:

   - `create database rhsso`
   - `\c rhsso`
   - run the create table command for the script you are using

1. Create a .env file rom .env.example: `cp .env.example .env`.
1. Many of the default values are pre-filled to connect with the docker-compose setup. See below for the remaining values:
   - Add your postgres user and password credentials that can connect to the rhsso database you created
   - The `kc-cron-jon-secret` in the sandbox-tools namespace can be used for the remaining values. Note that you will need to be using the VPN for the bceid webservice callouts to work.

The jobs can then be run locally from the relevant script, either `node remove-inactive-idir-users.js` or `node remove-dc-users.js`. These will connect to the keycloak instances on localhost ports 9080 (dev), 9081 (test), 9082 (prod). You can add dc or idir users to these instances to have them deleted.

**BCeID Webservice vx. Microsoft Entra**: We have previously attempted to move from the webservice to query against the entra graph API. Unfortunately these services are not kept completely in sync so the graph API is not currently usable. The function `checkUserExistsAtEntra` has been kept in case they are synced in the future. If using this function, the environment variables:

```
MS_GRAPH_API_AUTHORITY_DEV=
MS_GRAPH_API_CLIENT_ID_DEV=
MS_GRAPH_API_CLIENT_SECRET_DEV=

MS_GRAPH_API_AUTHORITY_TEST=
MS_GRAPH_API_CLIENT_ID_TEST=
MS_GRAPH_API_CLIENT_SECRET_TEST=

MS_GRAPH_API_AUTHORITY_PROD=
MS_GRAPH_API_CLIENT_ID_PROD=
MS_GRAPH_API_CLIENT_SECRET_PROD=
```

will be required. They are not currently needed.

## Deployment

The cron jobs can be redeployed from the [helm chart](../../helm/kc-cron-job/README.md). The repository contains make commands for deploying and upgrading.

The helm chart will deploy both jobs. Code changes merged into dev will deploy a new image which will be pulled for the next run in sandbox. For production the [production github action](../../.github/workflows/publish-kc-cron-production.yml) can be run.
