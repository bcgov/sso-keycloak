#!/bin/bash
# Todo, make this general for all namespaces



pwd="$(dirname "$0")"
source "./helm/keycloak/helpers.sh"
# TODO fix this context
# if ! check_kube_context "api-golddr-devops-gov-bc-ca"; then
#     echo "invalid context"
#     exit 1
# fi

helm repo add sso-charts https://bcgov.github.io/sso-helm-charts
helm repo update

cd ./helm/keycloak/

helm upgrade --install sso-keycloak sso-charts/sso-keycloak -n c6af30-test -f ./values-golddr-c6af30-test.yaml -f ./transition-scripts/deploy-golddr-active.sh --version v1.6.0

# helm repo add sso-charts https://bcgov.github.io/sso-helm-charts
# helm repo update



# helm upgrade --install sso-keycloak sso-charts/sso-keycloak -n c6af30-test -f ./helm/keycloak/values-gold-c6af30-test.yaml --version v1.2.1
