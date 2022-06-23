#!/bin/bash

helm repo add sso-charts https://bcgov.github.io/sso-helm-charts
helm repo update

helm upgrade --install sso-keycloak sso-charts/sso-keycloak -n c6af30-dev -f values-gold-c6af30-dev.yaml --version v1.7.1
