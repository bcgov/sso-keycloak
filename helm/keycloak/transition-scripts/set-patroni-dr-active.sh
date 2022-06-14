#!/bin/bash

NAMESPACE=$1

pwd="$(dirname "$0")"

source "./helpers.sh"

if ! check_kube_context "api-golddr-devops-gov-bc-ca"; then
    echo "invalid context"
    exit 1
fi

OUTPUT = oc rsh -n ${NAMESPACE} sso-patroni-0 curl -s -XPATCH -d '{"standby_cluster_blah":null}' http://localhost:8008/config | jq .

