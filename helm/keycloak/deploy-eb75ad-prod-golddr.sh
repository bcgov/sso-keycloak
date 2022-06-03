#!/bin/bash

pwd="$(dirname "$0")"
source "$pwd/../helpers.sh"

if ! check_kube_context "api-golddr-devops-gov-bc-ca"; then
    echo "invalid context"
    exit 1
fi

helm repo add sso-charts https://bcgov.github.io/sso-helm-charts
helm repo update

helm upgrade --install sso-keycloak sso-charts/sso-keycloak -n eb75ad-prod -f values-golddr-eb75ad-prod.yaml --version v1.5.3
