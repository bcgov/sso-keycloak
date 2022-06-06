#!/bin/bash
# This script installs (upgrades) the keycloak app in dr
# arguments state active vs standby
# namespace
# standby port

set -euxo pipefail

echo "Creating Helm installation $*"

cd helm/keycloak

helm dep up

echo "Made it here without crashing"
# helm upgrade --install --atomic -f ./values.yaml "$@" digital-marketplace . \
#   --debug --timeout=12m0s
# helm upgrade --install  \
#     "$@" \
#     --debug --timeout=12m0s
# helm upgrade --install "${NAME}" . \
#     -n "${NAMESPACE}" \
#     -f values.yaml \
#     -f "values-${NAMESPACE}-${NAME}.yaml" \
#     "$@"
