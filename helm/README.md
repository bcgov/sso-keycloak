# Helm Charts

This directory contains Helm Charts related to any workflows needed for deploying and managing Single sign-on services.

## How to install Helm

- This repository sets up the local development environment using a tool called `ASDF`.
- Please follow the [Developer Guide](../docs/developer-guide.md) to install `ASDF`, otherwise,
  install `Helm` with the [official installation guide](https://helm.sh/docs/intro/install/).

## Adding the repository

The helm charts are published to github pages. To use them, first install the repository:

- `helm repo add sso-keycloak https://bcgov.github.io/sso-keycloak/`

To see available charts, use `helm search repo sso-keycloak`.
Then reference the chart you want to install, e.g

- `helm install keycloak sso-keycloak/sso-keycloak`

## Uninstalling

When uninstalling our patroni instance, there will be remaining configmaps and PVCs that will will not be deleted. The PVCs
will have the name `storage-volume-<chart name>-<replica number>`, and the configmap will be named `<chart-name>-<config|leader>`.
These should be cleaned up as part of the process.

## Values

**sso-keycloak**

name | description
---- | ----
replicaCount | The number of pods to create
image.tag    | The tag of the rh-sso image to use
service.type | The type of service
service.port | The port of the service
postgres.host | The name of the service exposing your postgres database
postgres.dbName | The name of the database to create for keycloak
postgres.credentials.secret | The name of the secret containing postgres login credentials
postgres.credentials.adminUserName | The username of an admin account for the database
postgres.credentials.passwordKey | The key for the password in the secret
postgres.credentials.passwordKey | The key for the password in the secret
credentials.random | Set to true to randomly generate password
credentials.adminUsername | The username of the admin account
credentials.adminPasswordKey | The key for the password in the secret

**patroni**

See the [values file](./patroni/values.yaml) for all optional configuration.
