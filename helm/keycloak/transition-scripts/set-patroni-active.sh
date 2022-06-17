#!/bin/bash

NAMESPACE=$1
CLUSTER=$2

pwd="$(dirname "$0")"
source "$pwd/../../helpers.sh"

echo "Setting patroni-"$CLUSTER" to active"
# Confirm that this action is running against $CLUSTER cluster
if ! check_kube_context "api-$CLUSTER-devops-gov-bc-ca"; then
    echo "invalid context"
    exit 1
fi

OUTPUT=$(kubectl -n  ${NAMESPACE} exec sso-patroni-0 -- curl -s -o /dev/null -w "%{http_code}" -XPATCH -d '{"standby_cluster":null}' http://localhost:8008/config)

echo "::set-output name=patroniconfig::${OUTPUT}"