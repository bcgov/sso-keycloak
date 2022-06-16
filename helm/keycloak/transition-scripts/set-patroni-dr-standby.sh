#!/bin/bash

NAMESPACE=$1
# The port of the tsc service used to connect gold and golddr
PORT=$2

pwd="$(dirname "$0")"

source "./helpers.sh"
# Confirm This Is run on DR cluster
if ! check_kube_context "api-golddr-devops-gov-bc-ca"; then
    echo "invalid context"
    exit 1
fi

# Set the patroni config to be in standby mode
RESPONSE=$(kubectl -n  ${NAMESPACE} exec sso-patroni-0 -- curl -s -w "%{http_code}" -XPATCH -d '{"standby_cluster": {"create_replica_methods": ["basebackup_fast_xlog"],"host": "sso-patroni-gold.c6af30-test.svc.cluster.local","port": '$PORT'}}' http://localhost:8008/config)
RESPONSE_CODE=${RESPONSE: -3}
PATRONIDRCONFIG=${RESPONSE:0:-3}
echo "The response code is: "$RESPONSE_CODE

if [ $RESPONSE_CODE = 200 ]; then
    echo "Patroni config response returned"
else
    echo "The golddr patroni instance did not return a 200 response"
    exit 1
fi

if [ -z $(echo $OUTPUT | jq .standby_cluster) ]; then
    echo "Patroni dr in standby mode"
else
    echo "Patroni dr not in standby"
    exit 1
fi
