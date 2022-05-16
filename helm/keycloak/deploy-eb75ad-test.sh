#!/bin/bash

helm repo add sso-charts https://bcgov.github.io/sso-helm-charts
helm repo update

helm upgrade --install sso-keycloak sso-charts/sso-keycloak -n eb75ad-test -f values-eb75ad-test.yaml --version v1.2.3
