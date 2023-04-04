#!/bin/bash
set -e

namespaces=("e4ca1d-dev" "e4ca1d-prod" "e4ca1d-test")

usage() {
    cat <<EOF

Deploy sso-keycloak in the target namespace;

Usages:
    $0 <namespace>

Available namespaces:
$(
    for s in "${namespaces[@]}"
    do
      echo "- $s"
    done
)

Examples:
    $ $0 e4ca1d-dev
EOF
}

if [ "$#" -lt 1 ]; then
    usage
    exit 1
fi

NAMESPACE=$1

if [[ ! " ${namespaces[@]} " =~ " ${NAMESPACE} " ]]; then
    >&2 echo "Not a valid namespace"
    usage
    exit 1
fi

if [[ ${NAMESPACE} == *tools ]]; then
    >&2 echo "Metabase can be installed only in dev, test and prod namespaces"
    exit 1
fi

helm repo add sso-charts https://bcgov.github.io/sso-helm-charts

helm repo update

helm upgrade --install sso-keycloak sso-charts/sso-keycloak -n "${NAMESPACE}" -f "values-e4ca1d.yaml" --version v1.14.2
