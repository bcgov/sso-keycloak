#!/bin/bash
# Todo, make this general for all namespaces
helm repo add sso-charts https://bcgov.github.io/sso-helm-charts
helm repo update



helm upgrade --install sso-keycloak sso-charts/sso-keycloak -n c6af30-test -f ./helm/keycloak/values-gold-c6af30-test.yaml --version v1.2.1
