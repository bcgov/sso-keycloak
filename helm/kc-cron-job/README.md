# Keyclaok CronJob Helm Chart

## Installing the Chart

To install the chart with the release name `kc-cron-job`:

```bash
$ helm install kc-cron-job . -n <namespace> -f values.yaml -f values.secret.yaml
```

To uninstall the chart

```bash
$ helm uninstall kc-cron-job -n <namespace>
```
