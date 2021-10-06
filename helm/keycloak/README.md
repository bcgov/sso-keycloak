# Keycloak Helm Chart

## Installing the Chart

To install the chart with the release name `sso-keycloak`:

```bash
$ helm install sso-keycloak . -n <namespace> -f ./values.yaml
```

To uninstall the chart

```bash
$ helm uninstall sso-keycloak -n <namespace>
```
