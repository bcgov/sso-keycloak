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
