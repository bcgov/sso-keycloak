# Keycloak Job Helm Chart

## Overview

See the `raw.sql` file for the sql commands that run. It creates:
- **sso_stats**: table for aggregated stats
- **save_log_types**: Function to save log type counts to the `sso_stats` table
- **update_stats**: trigger to update stats on any insert event to `sso_logs`

## Installing the Chart

To install the chart with the release name `kc-trigger-job`:

```bash
$ helm install kc-trigger-job . -n <namespace> -f values.yaml
```

To uninstall the chart

```bash
$ helm uninstall kc-trigger-job -n <namespace>
```
