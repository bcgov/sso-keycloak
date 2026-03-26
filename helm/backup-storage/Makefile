SHELL := /usr/bin/env bash

NAME=app
NAMESPACE=3d5c3f-dev

.PHONY: dep
dep:
	helm repo add bcgov https://bcgov.github.io/helm-charts
	# helm dependency build

.PHONY: install
install: dep
install:
	helm install "${NAME}" bcgov/backup-storage -n "${NAMESPACE}" -f values.yaml -f "values-${NAMESPACE}-${NAME}.yaml"

.PHONY: upgrade
upgrade: dep
upgrade:
	helm upgrade --install "${NAME}" bcgov/backup-storage -n "${NAMESPACE}" -f values.yaml -f "values-${NAMESPACE}-${NAME}.yaml"

.PHONY: lint
lint: dep
lint:
	helm upgrade --dry-run --install "${NAME}" bcgov/backup-storage -n "${NAMESPACE}" -f values.yaml -f "values-${NAMESPACE}-${NAME}.yaml"

.PHONY: uninstall
uninstall:
	helm uninstall "${NAME}" -n ${NAMESPACE}

.PHONY: force-install
force-install: uninstall
force-install: install
