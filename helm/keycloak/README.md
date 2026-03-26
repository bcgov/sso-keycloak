# SSO Keycloak Helm Chart

The `SSO Keycloak Helm Chart` provides a easy way to deploy (RedHat SSO)[https://access.redhat.com/products/red-hat-single-sign-on], which is specifically designed for BCGov SSO services, on Openshift.

## Usages

### Add this chart repository

```console
$ helm repo add sso-keycloak https://bcgov.github.io/sso-keycloak
```

### Install this chart repository

```console
$ helm install <release-name> sso-keycloak/sso-keycloak [--namespace <my-namespace>] [--version <x.y.z>] [--values ./custom-values.yaml]
```

### Upgrade this chart repository

```console
$ helm upgrade <release-name> sso-keycloak/sso-keycloak [--namespace <my-namespace>] [--version <x.y.z>] [--values ./custom-values.yaml]
```

### Uninstall this chart repository

```console
$ helm uninstall <release-name> [--namespace <my-namespace>]
```

## Configuration

The following table lists the configurable parameters of the Keycloak chart and their default values.

| Parameter                            | Description                                    | Default                                                                                    |
| ------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `replicaCount`                       | Number of pods to create                       | `1`                                                                                        |
| `image.repository`                   | container image repository                     | `ghcr.io/bcgov/sso`                                                                        |
| `image.tag`                          | container image tag                            | `dev`                                                                                      |
| `image.pullPolicy`                   | container image pull policy                    | `Always`                                                                                   |
| `nameOverride`                       | override for the chart name                    | `sso-keycloak`                                                                             |
| `fullNameOverride`                   | override for the full chart name               | `sso-keycloak`                                                                             |
| `service.type`                       | type of service to create                      | `ClusterIP`                                                                                |
| `service.port`                       | port of service                                | `8080`                                                                                     |
| `pingService.enabled`                | enable DNS ping                                | `true`                                                                                     |
| `pingService.port`                   | exposed port of ping service                   | `8888`                                                                                     |
| `postgres.host`                      | host of postgres service                       | `sso-pgsql-master`                                                                         |
| `postgres.database`                  | name of database                               | `rhsso`                                                                                    |
| `postgres.port`                      | exposed port of database                       | `5432`                                                                                     |
| `postgres.credentials.secret`        | name of secret containing database credentials | `sso-pgsql`                                                                                |
| `postgres.credentials.adminUsername` | name of admin database user                    | `postgres`                                                                                 |
| `postgres.credentials.passwordKey`   | Secret key of admin password                   | `password-superuser`                                                                       |
| `postgres.poolSize.min`              | Minimum pool size                              | `5`                                                                                        |
| `postgres.poolSize.max`              | Maximum pool size                              | `20`                                                                                       |
| `additionalServerOptions`            | Additional command line options for server     | `-Dkeycloak.profile.feature.authorization=enabled -Djboss.persistent.log.dir=/var/log/eap` |
| `tls.enabled`                        | Enable tls                                     | `false`                                                                                    |
| `tls.httpsSecret`                    | Name of secret for tls cert                    | `sso-x509-https-secret`                                                                    |
| `tls.jgroupsSecret`                  | Name of secret for jgroups                     | `sso-x509-jgroups-secret`                                                                  |
| `persistentLog.enabled`              | Enable persistent logs                         | `true`                                                                                     |
| `persistentLog.storageClassName`     | Storage class name of volume                   | `netapp-file-standard`                                                                     |
| `persistentLog.path`                 | Path to save logs                              | `/var/log/eap`                                                                             |
| `resources.limits.memory`            | memory limit for pods                          | `2Gi`                                                                                      |
| `resources.limits.cpu`               | CPU limit for pods                             | `2`                                                                                        |
| `resources.requests.cpu`             | cpu request for pods                           | `1250m`                                                                                    |
| `resources.requests.memory`          | memory request for pods                        | `1Gi`                                                                                      |
| `nodeSelector`                       | node labels for pod assignment                 | `{}`                                                                                       |
| `tolerations`                        | toleration settings                            | `[]`                                                                                       |
| `affinity`                           | affinity settings                              | `{}`                                                                                       |
| `annotations.timeout`                | route timeout                                  | null                                                                                       |
### Notes

- The helm chart installs two `Secret` k8s objects:

  1. `<release-name>-admin-secret`: it stores the Keycloak admin password.
  1. `<release-name>-jgroups`: it stores the Keycloak cluster jgroups password.

- k8s resource object label conventions
  1. see https://kubernetes.io/docs/concepts/overview/working-with-objects/common-labels/#labels
