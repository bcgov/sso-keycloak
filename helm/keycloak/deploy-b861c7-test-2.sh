#!/bin/bash

helm repo add sso-charts https://bcgov.github.io/sso-helm-charts
helm repo update

helm upgrade --install sso-keycloak-2 sso-charts/sso-keycloak -n b861c7-test -f values-b861c7-test-2.yaml --version v1.14.0-nodep
