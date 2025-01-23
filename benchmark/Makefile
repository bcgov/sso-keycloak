SHELL := /usr/bin/env bash
NAMESPACE :=
SCENARIO := keycloak.scenario.authentication.ClientSecret
SERVER_URL :=
ADMIN_USERNAME :=
ADMIN_PASSWORD :=
ADDITIONAL_CONFIG := ""

# make <comand> NAMESPACE="<namespace>"

.PHONY: run_job
run_job:
	oc -n $(NAMESPACE) process -f ./openshift/dc.yaml -p SCENARIO=$(SCENARIO) -p SERVER_URL=$(SERVER_URL) -p ADMIN_USERNAME=$(ADMIN_USERNAME) -p ADMIN_PASSWORD=$(ADMIN_PASSWORD) -p ADDITIONAL_CONFIG=$(ADDITIONAL_CONFIG)| oc -n $(NAMESPACE) apply -f -

.PHONY: cleanup
cleanup:
	oc -n $(NAMESPACE) delete job sso-benchmark-runner
	oc -n $(NAMESPACE) delete pvc sso-benchmark-runner-pvc
