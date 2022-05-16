#!/bin/bash

helm repo add sso-charts https://bcgov.github.io/sso-helm-charts
helm repo update

helm upgrade --install sso-keycloak sso-charts/sso-keycloak -n eb75ad-prod -f values-eb75ad-prod.yaml --version v1.3.0
