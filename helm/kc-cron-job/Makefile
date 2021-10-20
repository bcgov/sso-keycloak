SHELL := /usr/bin/env bash
NAMESPACE="3d5c3f-dev"

.PHONY: install
install:
	helm install kc-cron-job . -n "${NAMESPACE}" -f values.yaml

.PHONY: upgrade
upgrade:
	helm upgrade --install kc-cron-job . -n "${NAMESPACE}" -f values.yaml

.PHONY: lint
lint:
	helm upgrade --dry-run --install kc-cron-job -n "${NAMESPACE}" -f values.yaml

.PHONY: uninstall
uninstall:
	helm uninstall kc-cron-job -n ${NAMESPACE}

.PHONY: force-install
force-install: uninstall
force-install: install
