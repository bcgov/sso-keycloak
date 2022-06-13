#!/bin/bash

NAMESPACE=$1

pwd="$(dirname "$0")"

source "./helpers.sh"

if ! check_kube_context "api-golddr-devops-gov-bc-ca"; then
    echo "invalid context"
    exit 1
fi

# helm repo add sso-charts https://bcgov.github.io/sso-helm-charts
# helm repo update

# cd ./keycloak/
oc rsh -n ${NAMESPACE} sso-patroni-0 curl -s -XPATCH -d '{  "standby_cluster":null}' http://localhost:8008/config | jq .

