SHELL := /usr/bin/env bash


# This installs metabase in the gold production tools namespace
.PHONY: install
install:
	helm install metabase . -n eb75ad-tools \
	-f values.yaml \
	-f "values-eb75ad-tools.yaml" \
	--set postgresql_password="$(shell bash -c 'echo $$RANDOM | md5sum | head -c 32')"

# Upgrade will change an existing metabase deployment. The secret gets regenerated each time this is run
.PHONY: upgrade
upgrade:
	helm upgrade --install metabase . \
	-n eb75ad-tools \
	-f values.yaml \
	-f "values-eb75ad-tools.yaml" \
	--set postgresql_password="$(shell bash -c 'echo $$RANDOM | md5sum | head -c 32')"
