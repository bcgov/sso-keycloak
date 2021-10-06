# Secrets Helm Chart

## Installing the Chart

To install the chart with the release name `secrets`:

```bash
$ helm install secrets . -n <namespace> -f ./values.yaml -f ./values.secret.yaml
```

To uninstall the chart

```bash
$ helm uninstall secrets -n <namespace>
```
