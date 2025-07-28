# Keycloak Observability

## Introduction

Keycloak has introduced a new endpoint `/metrics` that publishes wide number of metrics helpful to analyze its performance. This endpoint can be enabled by by setting `--metrics-enabled=true`

Starting with Keycloak v26, this endpoint is now not exposed by default as it has been moved under port `9000`, which the management port of Keycloak. This requires a new ingress route that can be scraped by prometheus

There are broadly 7 categories of metrics provided by Keycloak and they are:

- [Self-provided metrics](https://docs.redhat.com/en/documentation/red_hat_build_of_keycloak/26.2/html/observability_guide/metrics-for-troubleshooting-#metrics-for-troubleshooting-keycloak-)
  - User Event Metrics: Count of occurences of user events. Enabled by setting `--event-metrics-user-enabled=true`, choose events by setting `--event-metrics-user-events=login,logout ...`, and choose user tags by setting `--event-metrics-user-tags=realm,idp,clientId ...`
  - Password Hashing: Cound of password hash validations
- [JVM Metrics](https://docs.redhat.com/en/documentation/red_hat_build_of_keycloak/26.2/html/observability_guide/metrics-for-troubleshooting-#metrics-for-troubleshooting-jvm-): Provides info about the performance of the Keycloak
  - JVM info
  - Heap memory usage
  - Garbage collection
  - CPU usage in OpenShift
- [Database Metrics](https://docs.redhat.com/en/documentation/red_hat_build_of_keycloak/26.2/html/observability_guide/metrics-for-troubleshooting-#metrics-for-troubleshooting-database-): Database connection pool
- [HTTP Metrics](https://docs.redhat.com/en/documentation/red_hat_build_of_keycloak/26.2/html/observability_guide/metrics-for-troubleshooting-#metrics-for-troubleshooting-http-): Processing of HTTP Requests
- [Clustering Metrics](https://docs.redhat.com/en/documentation/red_hat_build_of_keycloak/26.2/html/observability_guide/metrics-for-troubleshooting-#metrics-for-troubleshooting-clustering-and-network-): For monitoring the communication between nodes of Keycloak
- [Infinispan Metrics](https://docs.redhat.com/en/documentation/red_hat_build_of_keycloak/26.2/html/observability_guide/metrics-for-troubleshooting-#metrics-for-troubleshooting-embedded-caches-): For monitoring caching health and cluster replication for single and multisite deployments
- [External Data Grid](https://docs.redhat.com/en/documentation/red_hat_build_of_keycloak/26.2/html/observability_guide/metrics-for-troubleshooting-#metrics-for-troubleshooting-external-infinispan-multi-site-): Monitoring of external data grid performance

## Dashboards

The keycloak community offers couple of dashboards and they are available [here](https://github.com/keycloak/keycloak-grafana-dashboard/tree/main/dashboards)

1. Capacity Planning Dashboard

   - This dashboard shows metrics that are important when estimating the load handled by a Red Hat build of Keycloak deployment. For example, it shows the number of password validations or login flows performed by Red Hat build of Keycloak.
   - Particularly valuable for evaluating system load and provisioning appropriate CPU and memory resources to ensure optimal Keycloak performance.

2. Keycloak Troubleshooting Dashboard

   - This dashboard can be used when troubleshooting Keycloak

## Installation

- The `/metrics` endpoint can be scraped by either on-prem prometheus or the sysdig version of the prometheus.
- The on-prem version requires us deploying prometheus instance assigned with fair bit of storage
- If we want to use sysdig version of the prometheus then we need to add below annotations on the Keycloak for promscraper to collect metrics from that endpoint.

  ```yaml
  # This feature toggle is set to enable scraping.
  prometheus.io/scrape: 'true'
  # This annotation sets the port which the metrics can be scraped from.
  prometheus.io/port: 8080
  # This value defines the HTTP path for the metrics endpoint. This annotation is optional, its default value is /metrics.
  prometheus.io/path: /metrics
  # This toggle can be used to advertise the metrics endpoint as TLS-encrypted.
  prometheus.io/scheme: https
  ```
