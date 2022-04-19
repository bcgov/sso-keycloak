SHELL := /usr/bin/env bash

# TODO Create a random password for metabase to access the metabase database
.PHONY: create-random-db-secret
create-random-db-secret:
	kubectl create secret generic metabase-db-secret -n eb75ad-tools \
		--from-literal=metabase-postgres-user=metabase \
		--from-literal=metabase-postgres-password=$(shell bash -c 'echo $$RANDOM | md5sum | head -c 32')



# This installs metabase in the gold production tools namespace
.PHONY: install
install:
	helm install metabase . -n eb75ad-tools \
	-f values.yaml \
	-f "values-eb75ad-tools.yaml" \
	--set postgresql_password="$(shell bash -c 'echo $$RANDOM | md5sum | head -c 32')"

# Upgrade will not regenerate the secrets
.PHONY: upgrade
upgrade:
	helm upgrade --install metabase . \
	-n eb75ad-tools \
	-f values.yaml \
	-f "values-eb75ad-tools.yaml" \
	--set postgresql_password="$(shell bash -c 'echo $$RANDOM | md5sum | head -c 32')"
