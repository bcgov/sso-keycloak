#!/bin/bash

set -euxo pipefail

echo "Setting patroni-dr to active"
# TODO set namespace as a variable
oc project
# oc rsh -n c6af30-test sso-patroni-0
# curl -s -XPATCH -d '{  "standby_cluster":null}' http://localhost:8008/config
exit