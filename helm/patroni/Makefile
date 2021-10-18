SHELL := /usr/bin/env bash
NAME=sample-app
NAMESPACE=3d5c3f-dev

.PHONY: dep
dep:
	helm repo add etcd https://charts.helm.sh/incubator
	helm repo add zookeeper https://charts.helm.sh/incubator
	helm repo add consul https://charts.helm.sh/stable

.PHONY: install
install:
	helm install "${NAME}" . -n "${NAMESPACE}" -f values.yaml -f "values-${NAME}.yaml"

.PHONY: upgrade
upgrade:
	helm upgrade --install "${NAME}" . -n "${NAMESPACE}" -f values.yaml -f "values-${NAME}.yaml"

.PHONY: lint
lint:
	helm upgrade --dry-run --install "${NAME}" -n "${NAMESPACE}" -f values.yaml -f "values-${NAME}.yaml"

.PHONY: uninstall
uninstall:
	helm uninstall "${NAME}" -n ${NAMESPACE}

.PHONY: force-install
force-install: uninstall
force-install: install
