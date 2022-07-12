SHELL := /usr/bin/env bash
NAMESPACE=""
URL=''
CLIENTSECRET=''

.PHONY: install
install:
	helm install kc-cron-job . -n "${NAMESPACE}" -f values-${NAMESPACE}.yaml

.PHONY: upgrade
upgrade:
	helm upgrade --install kc-cron-job . -n "${NAMESPACE}" -f values-${NAMESPACE}.yaml

.PHONY: lint
lint:
	helm upgrade --dry-run --install kc-cron-job -n "${NAMESPACE}" -f values-${NAMESPACE}.yaml

.PHONY: uninstall
uninstall:
	helm uninstall kc-cron-job -n ${NAMESPACE}

.PHONY: force-install
force-install: uninstall
force-install: install

# The service account secrets are located in the prod keycloak app
# the client is located in the master realm
.PHONY: service-acount-secret
service-acount-secret:
	kubectl create secret generic kc-cron-service-account -n "${NAMESPACE}" \
		--from-literal=keycloak-url=${URL} \
		--from-literal=client-id=script-cli \
		--from-literal=client-secret=${CLIENTSECRET}

.PHONY: service-acount-secret-gold-prod
service-acount-secret-gold-prod:
	kubectl create secret generic kc-cron-service-account -n "${NAMESPACE}" \
		--from-literal=keycloak-url=${URL} \
		--from-literal=client-id=viewer-cli \
		--from-literal=client-secret=${CLIENTSECRET}
