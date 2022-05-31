#!/bin/bash

pwd="$(dirname "$0")"
source "$pwd/../helpers.sh"

if ! check_kube_context "api-gold-devops-gov-bc-ca"; then
    echo "invalid context"
    exit 1
fi

helm repo add sso-charts https://bcgov.github.io/sso-helm-charts
helm repo update

helm upgrade --install sso-keycloak sso-charts/sso-keycloak -n eb75ad-dev -f values-gold-eb75ad-dev.yaml --version v1.6.0
