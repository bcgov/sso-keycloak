SHELL := /usr/bin/env bash

NAME=app
NAMESPACE=xxxxxx-dev

.PHONY: dep
dep:
	helm repo add etcd https://charts.helm.sh/incubator
	helm repo add zookeeper https://charts.helm.sh/incubator
	helm repo add consul https://charts.helm.sh/stable

.PHONY: install
install: dep
install:
	helm install "${NAME}" . -n "${NAMESPACE}" -f values.yaml -f "values-${NAMESPACE}-${NAME}.yaml"

.PHONY: upgrade
upgrade: dep
upgrade:
	helm upgrade --install "${NAME}" . -n "${NAMESPACE}" -f values.yaml -f "values-${NAMESPACE}-${NAME}.yaml"

.PHONY: lint
lint: dep
lint:
	helm upgrade --dry-run --install "${NAME}" . -n "${NAMESPACE}" -f values.yaml -f "values-${NAMESPACE}-${NAME}.yaml"

.PHONY: uninstall
uninstall:
	helm uninstall "${NAME}" -n ${NAMESPACE}

.PHONY: force-install
force-install: uninstall
force-install: install

.PHONY: create-random-db-secret
create-random-db-secret:
	kubectl create secret generic "${NAME}" -n "${NAMESPACE}" \
		--from-literal=username-superuser=postgres \
		--from-literal=username-admin=admin \
		--from-literal=username-standby=standby \
		--from-literal=username-appuser=appuser \
		--from-literal=password-superuser=$(shell bash -c 'echo $$RANDOM | md5sum | head -c 32') \
		--from-literal=password-admin=$(shell bash -c 'echo $$RANDOM | md5sum | head -c 32') \
		--from-literal=password-standby=$(shell bash -c 'echo $$RANDOM | md5sum | head -c 32') \
		--from-literal=password-appuser=$(shell bash -c 'echo $$RANDOM | md5sum | head -c 32')
