#!/bin/bash

NAMESPACE=$1
# The port of the tsc service used to connect gold and golddr
PORT=$2

CLUSTER=$3

echo "Setting patroni-"$CLUSTER" to standby"

pwd="$(dirname "$0")"
source "$pwd/../../helpers.sh"

# Confirm this is run on $CLUSTER
if ! check_kube_context "api-$CLUSTER-devops-gov-bc-ca"; then
    echo "invalid context"
    exit 1
fi

if [ $CLUSTER == golddr ]; then
    $HOST="sso-patroni-gold.${NAMESPACE}.svc.cluster.local"
else
    $HOST="sso-patroni-golddr.${NAMESPACE}.svc.cluster.local"
fi

# Set the patroni config to be in standby mode
RESPONSE=$(kubectl -n  ${NAMESPACE} exec sso-patroni-0 -- curl -s -w "%{http_code}" -XPATCH -d '{"standby_cluster": {"create_replica_methods": ["basebackup_fast_xlog"],"host": '$HOST',"port": '$PORT'}}' http://localhost:8008/config)
RESPONSE_CODE=${RESPONSE: -3}
CLUSTERCONFIG=${RESPONSE:0:-3}
echo "The response code is: "$RESPONSE_CODE

if [ $RESPONSE_CODE = 200 ]; then
    echo "Patroni-$CLUSTER config response returned"
else
    echo "The $CLUSTER patroni instance did not return a 200 response"
    exit 1
fi

STANDBY_CLUSTER_CONFIG_LENGTH=$(echo $CLUSTERCONFIG | jq .standby_cluster | jq length )

# The length of the standby config json is 0 when patroni is in active mode
if [ -z $STANDBY_CLUSTER_CONFIG_LENGTH ]; then
    echo "The patroni-$CLUSTER config in active mode"
    exit 1
else
    echo "The patroni-$CLUSTER  pods must not be in standby mode"
fi