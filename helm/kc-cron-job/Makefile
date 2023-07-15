SHELL := /usr/bin/env bash
NAMESPACE=""
URL=''
CLIENTSECRET=''
CLIENTNAME=''

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
# the client is located in the master realm CLIENTNAME=script-cli for silver and
# and gold sandbox projects, CLIENTNAME=viewer-cli in gold production.
.PHONY: service-acount-secret
service-acount-secret:
	kubectl create secret generic kc-cron-service-account -n "${NAMESPACE}" \
		--from-literal=keycloak-url=${URL} \
		--from-literal=client-id=${CLIENTNAME} \
		--from-literal=client-secret=${CLIENTSECRET}

.PHONY: kc-cron-rm-inactive-users
kc-cron-rm-inactive-users:
	kubectl create secret generic kc-cron-rm-inactive-users -n "${NAMESPACE}" \
		--from-literal=dev-kc-client-id=${DEV_KEYCLOAK_CLIENT_ID} \
		--from-literal=bceid-service-id-prod=${BCEID_SERVICE_ID_PROD} \
		--from-literal=test-kc-client-id=${TEST_KEYCLOAK_CLIENT_ID} \
		--from-literal=bceid-service-id-dev=${BCEID_SERVICE_ID_DEV} \
		--from-literal=bceid-service-basic-auth=${BCEID_SERVICE_BASIC_AUTH} \
		--from-literal=css-api-url=${CSS_API_URL} \
		--from-literal=prod-kc-client-secret=${PROD_KEYCLOAK_CLIENT_SECRET} \
		--from-literal=bceid-requester-idir-guid=${BCEID_REQUESTER_IDIR_GUID} \
		--from-literal=dev-kc-client-secret=${DEV_KEYCLOAK_CLIENT_SECRET} \
		--from-literal=test-kc-client-secret=${TEST_KEYCLOAK_CLIENT_SECRET} \
		--from-literal=css-api-auth-secret=${CSS_API_AUTH_SECRET} \
		--from-literal=bceid-service-id-test=${BCEID_SERVICE_ID_TEST} \
		--from-literal=prod-kc-client-id=${PROD_KEYCLOAK_CLIENT_ID}
