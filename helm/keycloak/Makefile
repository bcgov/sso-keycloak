SHELL := /usr/bin/env bash
SLUG=3d5c3f
ENV=dev
NAMESPACE="${SLUG}-${ENV}"

.PHONY: install
install:
	helm install sso-keycloak . -n "${NAMESPACE}" -f values.yaml -f "values-${NAMESPACE}.yaml"

.PHONY: upgrade
upgrade:
	helm upgrade --install sso-keycloak . -n "${NAMESPACE}" -f values.yaml -f "values-${NAMESPACE}.yaml"

.PHONY: lint
lint:
	helm upgrade --dry-run --install sso-keycloak -n "${NAMESPACE}" -f values.yaml -f "values-${NAMESPACE}.yaml"

.PHONY: uninstall
uninstall:
	helm uninstall sso-keycloak -n ${NAMESPACE}

.PHONY: force-install
force-install: uninstall
force-install: install
