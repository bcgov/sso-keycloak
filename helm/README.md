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

## Gold and Gold DR Integration

Any service that needs to connect to Gold from Gold DR will require a transfer service claim and network policy set up see [Gov Docs](https://docs.developer.gov.bc.ca/s/bn6v0ac6f9gue7hhirbg/protected-platform-services/d/c46p83i1tev0e75glpkg/guide-for-product-teams-building-apps-in-the-gold-hosting-tier-of-bc-govs-devops-platform) for details.  We store those policies in the `/network-policies-gold-golddr/` folder.

### Deploying patroni with a standby cluster in golddr

Once the patroni cluster is deployed in gold and the network policy and tsc are set up, copy the `sso-patroni` secret into the golddr cluster's choresponding golddr namespace.  The secrets must match for the standby cluster to access the leader cluster.

Check which port has been exposed by the tsc claim by running

`oc get services`

in the golddr cluster.  This port will be used in the values `env.PORT` of the standby patroni instances values file.

In the golddr cluster, install the patroni template.

`make install NAME=sso-patroni-standby NAMESPACE=<Namespace>`

This will trigger a build with the values file: `values-c6af30-dev-sso-patroni-standby.yaml`.
