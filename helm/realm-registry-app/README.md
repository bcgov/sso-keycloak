# Realm Registry App Helm Chart

The helm chart installs k8s objects with the release name `realm-registry-app`.

## Installing the Chart

To install the chart on a specific namespace.

```bash
$ make install NAMESPACE=<namespace>
```

To upgrade the chart on a specific namespace.

```bash
$ make upgrade NAMESPACE=<namespace>
```

To uninstall the chart on a specific namespace.

```bash
$ make uninstall NAMESPACE=<namespace>
```

To lint the chart on a specific namespace.

```bash
$ make lint NAMESPACE=<namespace>
```
