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
