#!/bin/bash
set -e

namespaces=("3d5c3f-dev" "3d5c3f-prod" "3d5c3f-tools" "6d70e7-dev" "6d70e7-test" "6d70e7-dev" "6d70e7-tools" "c6af30-dev" "c6af30-test" "c6af30-prod" "eb75ad-dev" "eb75ad-test" "eb75ad-prod" "eb75ad-tools")
types=("sso" "metabase")

usage() {
    cat <<EOF

Deploy backup container in the target namespaces;

Usages:
    $0 <namespace> <backup-type>

Available namespaces:
$(
    for s in "${namespaces[@]}"
    do
      echo "- $s"
    done
)

Backup types:
$(
    for s in "${types[@]}"
    do
      echo "- $s"
    done
)

Examples:
    $ $0 c6af30-dev sso
EOF
}

if [ "$#" -lt 2 ]; then
    usage
    exit 1
fi

NAMESPACE=$1
TYPE=$2

if [[ ! " ${namespaces[@]} " =~ " ${NAMESPACE} " ]]; then
    >&2 echo "Not a valid namespace"
    usage
    exit 1
fi

if [[ ! " ${types[@]} " =~ " ${TYPE} " ]]; then
    >&2 echo "Not a valid backup type"
    usage
    exit 1
fi

if [[ ${TYPE} == metabase && ${NAMESPACE} != *tools ]]; then
    >&2 echo "Metabase can be installed only in tools namespaces"
    exit 1
fi

helm repo add bcgov https://bcgov.github.io/helm-charts

helm repo update

helm upgrade --install "${TYPE}-backup" bcgov/backup-storage -n "${NAMESPACE}" -f values.yaml -f "values-${NAMESPACE}-${TYPE}-backup.yaml"
