SHELL := /usr/bin/env bash
NAMESPACE="b861c7-dev"

.PHONY: install
install:
	helm install realm-profile-app . -n "${NAMESPACE}" -f values.yaml -f "values-${NAMESPACE}.yaml"

.PHONY: upgrade
upgrade:
	helm upgrade --install realm-profile-app . -n "${NAMESPACE}" -f values.yaml -f "values-${NAMESPACE}.yaml"

.PHONY: lint
lint:
	helm upgrade --dry-run --install realm-profile-app -n "${NAMESPACE}" -f values.yaml -f "values-${NAMESPACE}.yaml"

.PHONY: uninstall
uninstall:
	helm uninstall realm-profile-app -n ${NAMESPACE}

.PHONY: force-install
force-install: uninstall
force-install: install
