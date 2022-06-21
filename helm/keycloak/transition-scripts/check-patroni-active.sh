#!/bin/bash

NAMESPACE=$1

CLUSTER=$2

pwd="$(dirname "$0")"
source "$pwd/../../helpers.sh"

# Confirm that this action is running against $CLUSTER cluster
if ! check_kube_context "api-$CLUSTER-devops-gov-bc-ca"; then
    echo "invalid context"
    exit 1
fi


# Confirm that patroni pods are in a running state
OUTPUT=$(kubectl -n  ${NAMESPACE} exec sso-patroni-0 -- curl -s http://localhost:8008/patroni)
STATE=$(echo $OUTPUT | jq '.state')
if [[ $STATE == '"running"' ]]; then
    echo "The $CLUSTER patroni pod is running"
else
    echo "The $CLUSTER patroni pods must be running"
    exit 1
fi


# Confirm that patroni $CLUSTER is in active state
RESPONSE=$(kubectl -n ${NAMESPACE} exec sso-patroni-0 -- curl -s -w "%{http_code}" http://localhost:8008/config)
RESPONSE_CODE=${RESPONSE: -3}
echo "The response code is "$RESPONSE_CODE
CLUSTERCONFIG=${RESPONSE:0:-3}
STANDBY_CLUSTER_CONFIG_LENGTH=$(echo $CLUSTERCONFIG | jq .standby_cluster | jq length )
echo "The length of the standby config json is: "$STANDBY_CLUSTER_CONFIG_LENGTH
if [[ $RESPONSE_CODE == 200 ]]; then
    echo "Patroni config response returned"
else
    echo "The $CLUSTER patroni pods did not return a 200 response"
    exit 1
fi

# The length of the standby config json is 0 when patroni is in active mode
if [[ $STANDBY_CLUSTER_CONFIG_LENGTH == 0 ]]; then
    echo "Patroni $CLUSTER config in active mode"
else
    echo "The $CLUSTER patroni pods must not be in standby mode"
    exit 1
fi

#TODO: Check that the TSC service is running?
