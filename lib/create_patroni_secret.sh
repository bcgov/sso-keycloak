#!/bin/bash

set -euxo pipefail

echo "Creating Helm installation $*"

cd helm/patroni
helm dep up
# helm upgrade --install --atomic -f ./values.yaml "$@" digital-marketplace . \
#   --debug --timeout=12m0s
helm upgrade --install  \
    "$@" \
    --debug --timeout=12m0s
# helm upgrade --install "${NAME}" . \
#     -n "${NAMESPACE}" \
#     -f values.yaml \
#     -f "values-${NAMESPACE}-${NAME}.yaml" \
#     "$@"
