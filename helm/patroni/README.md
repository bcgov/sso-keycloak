# Patroni Helm Chart

This directory contains a Kubernetes chart to deploy a [Patroni](https://github.com/zalando/patroni/) cluster using a [Spilo](https://github.com/zalando/spilo) and a StatefulSet.

## Prerequisites Details

- Kubernetes 1.9+
- PV support on the underlying infrastructure

## Chart Details

This chart will do the following:

- Implement a HA scalable PostgreSQL 10 cluster using a Kubernetes StatefulSet.

## Usages

### Add this chart repository

```console
$ helm repo add sso-keycloak https://bcgov.github.io/sso-keycloak
$ helm dependency update
```

### Install this chart repository

```console
$ helm install <release-name> sso-keycloak/patroni [--namespace <my-namespace>] [--version <x.y.z>] [--values ./custom-values.yaml]

# To create a randomly generated db credentials secret
$ kubectl create secret generic <secret-name> -n <my-namespace> \
  --from-literal=username-superuser=postgres \
  --from-literal=username-admin=admin \
  --from-literal=username-standby=standby \
  --from-literal=password-superuser="$(< /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c32)" \
  --from-literal=password-admin="$(< /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c32)" \
  --from-literal=password-standby="$(< /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c32)"
```

### Upgrade this chart repository

```console
$ helm upgrade <release-name> sso-keycloak/patroni [--namespace <my-namespace>] [--version <x.y.z>] [--values ./custom-values.yaml]
```

### Uninstall this chart repository

```console
$ helm uninstall <release-name> [--namespace <my-namespace>]
```

## Configuration

The following table lists the configurable parameters of the patroni chart and their default values.

| Parameter                        | Description                                                                                                                    | Default                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `nameOverride`                   | Override the name of the chart                                                                                                 | `nil`                                               |
| `fullnameOverride`               | Override the fullname of the chart                                                                                             | `nil`                                               |
| `replicaCount`                   | Amount of pods to spawn                                                                                                        | `5`                                                 |
| `image.repository`               | The image to pull                                                                                                              | `registry.opensource.zalan.do/acid/spilo-10`        |
| `image.tag`                      | The version of the image to pull                                                                                               | `1.5-p5`                                            |
| `image.pullPolicy`               | The pull policy                                                                                                                | `IfNotPresent`                                      |
| `auth.existingSecret`            | Using existing credentials secret                                                                                              | `nil`                                               |
| `auth.superuser.username`        | Username of the superuser                                                                                                      | `postgres`                                          |
| `auth.superuser.password`        | Password of the superuser                                                                                                      | `tea`                                               |
| `auth.admin.username`            | Username of the admin                                                                                                          | `admin`                                             |
| `auth.admin.password`            | Password of the admin                                                                                                          | `cola`                                              |
| `auth.standby.username`          | Username of the standby                                                                                                        | `standby`                                           |
| `auth.standby.password`          | Password of the standby                                                                                                        | `pinacolada`                                        |
| `kubernetes.dcs.enable`          | Using Kubernetes as DCS                                                                                                        | `true`                                              |
| `kubernetes.configmaps.enable`   | Using Kubernetes configmaps instead of endpoints                                                                               | `false`                                             |
| `etcd.enable`                    | Using etcd as DCS                                                                                                              | `false`                                             |
| `etcd.deployChart`               | Deploy etcd chart                                                                                                              | `false`                                             |
| `etcd.host`                      | Host name of etcd cluster                                                                                                      | `nil`                                               |
| `etcd.discovery`                 | Domain name of etcd cluster                                                                                                    | `nil`                                               |
| `zookeeper.enable`               | Using ZooKeeper as DCS                                                                                                         | `false`                                             |
| `zookeeper.deployChart`          | Deploy ZooKeeper chart                                                                                                         | `false`                                             |
| `zookeeper.hosts`                | List of ZooKeeper cluster members                                                                                              | `host1:port1,host2:port,etc...`                     |
| `consul.enable`                  | Using Consul as DCS                                                                                                            | `false`                                             |
| `consul.deployChart`             | Deploy Consul chart                                                                                                            | `false`                                             |
| `consul.host`                    | Host name of consul cluster                                                                                                    | `nil`                                               |
| `env`                            | Extra custom environment variables                                                                                             | `{}`                                                |
| `walE.enable`                    | Use of Wal-E tool for base backup/restore                                                                                      | `false`                                             |
| `walE.scheduleCronJob`           | Schedule of Wal-E backups                                                                                                      | `00 01 * * *`                                       |
| `walE.retainBackups`             | Number of base backups to retain                                                                                               | `2`                                                 |
| `walE.s3Bucket:`                 | Amazon S3 bucket used for wal-e backups                                                                                        | `nil`                                               |
| `walE.gcsBucket`                 | GCS storage used for Wal-E backups                                                                                             | `nil`                                               |
| `walE.kubernetesSecret`          | K8s secret name for provider bucket                                                                                            | `nil`                                               |
| `walE.backupThresholdMegabytes`  | Maximum size of the WAL segments accumulated after the base backup to consider WAL-E restore instead of pg_basebackup          | `1024`                                              |
| `walE.backupThresholdPercentage` | Maximum ratio (in percents) of the accumulated WAL files to the base backup to consider WAL-E restore instead of pg_basebackup | `30`                                                |
| `resources`                      | Any resources you wish to assign to the pod                                                                                    | `{}`                                                |
| `nodeSelector`                   | Node label to use for scheduling                                                                                               | `{}`                                                |
| `tolerations`                    | List of node taints to tolerate                                                                                                | `[]`                                                |
| `affinityTemplate`               | A template string to use to generate the affinity settings                                                                     | Anti-affinity preferred on hostname                 |
| `affinity`                       | Affinity settings. Overrides `affinityTemplate` if set.                                                                        | `{}`                                                |
| `schedulerName`                  | Alternate scheduler name                                                                                                       | `nil`                                               |
| `persistentVolume.accessModes`   | Persistent Volume access modes                                                                                                 | `[ReadWriteOnce]`                                   |
| `persistentVolume.annotations`   | Annotations for Persistent Volume Claim`                                                                                       | `{}`                                                |
| `persistentVolume.mountPath`     | Persistent Volume mount root path                                                                                              | `/home/postgres/pgdata`                             |
| `persistentVolume.size`          | Persistent Volume size                                                                                                         | `2Gi`                                               |
| `persistentVolume.storageClass`  | Persistent Volume Storage Class                                                                                                | `volume.alpha.kubernetes.io/storage-class: default` |
| `persistentVolume.subPath`       | Subdirectory of Persistent Volume to mount                                                                                     | `""`                                                |
| `rbac.create`                    | Create required role and rolebindings                                                                                          | `true`                                              |
| `serviceAccount.create`          | If true, create a new service account                                                                                          | `true`                                              |
| `serviceAccount.name`            | Service account to be used. If not set and `serviceAccount.create` is `true`, a name is generated using the fullname template  | `nil`                                               |

Specify each parameter using the `--set key=value[,key=value]` argument to `helm install`.

## Cleanup

To remove the spawned pods you can run a simple `helm uninstall <release-name> [--namespace <my-namespace>]`.

Helm will however preserve created persistent volume claims and configmaps,
to also remove them execute the commands below.

```console
$ release=<release-name>
$ helm delete $release
$ kubectl delete pvc -l release=$release
$ kubectl delete configmaps -l release=$release
```

## Internals

Patroni is responsible for electing a PostgreSQL master pod by leveraging the
DCS of your choice. After election it adds a `spilo-role=master` label to the
elected master and set the label to `spilo-role=replica` for all replicas.
Simultaneously it will update the `<release-name>-patroni` endpoint to let the
service route traffic to the elected master.

```console
$ kubectl get pods -l spilo-role -L spilo-role
NAME                   READY     STATUS    RESTARTS   AGE       SPILO-ROLE
my-release-patroni-0   1/1       Running   0          9m        replica
my-release-patroni-1   1/1       Running   0          9m        master
my-release-patroni-2   1/1       Running   0          8m        replica
```
