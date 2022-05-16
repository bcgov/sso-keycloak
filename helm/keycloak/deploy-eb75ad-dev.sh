#!/bin/bash

helm repo add sso-charts https://bcgov.github.io/sso-helm-charts
helm repo update

helm upgrade --install sso-keycloak sso-charts/sso-keycloak -n eb75ad-dev -f values-eb75ad-dev.yaml --version v1.4.1
