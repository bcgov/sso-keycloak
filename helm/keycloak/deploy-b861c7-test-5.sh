#!/bin/bash

helm repo add sso-charts https://bcgov.github.io/sso-helm-charts
helm repo update

helm upgrade --install sso-keycloak-5 sso-charts/sso-keycloak -n b861c7-test -f values-b861c7-test-5.yaml --version v1.14.2-nodep
