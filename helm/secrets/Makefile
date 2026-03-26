SHELL := /usr/bin/env bash
NAMESPACE=

.PHONY: install
install:
	helm install sso-secrets . -n "${NAMESPACE}" -f values.yaml -f "values-${NAMESPACE}.secret.yaml"

.PHONY: upgrade
upgrade:
	helm upgrade --install sso-secrets . -n "${NAMESPACE}" -f values.yaml -f "values-${NAMESPACE}.secret.yaml"

.PHONY: lint
lint:
	helm upgrade --dry-run --install sso-secrets -n "${NAMESPACE}" -f values.yaml -f "values-${NAMESPACE}.secret.yaml"

.PHONY: uninstall
uninstall:
	helm uninstall sso-secrets -n ${NAMESPACE}

.PHONY: force-install
force-install: uninstall
force-install: install
