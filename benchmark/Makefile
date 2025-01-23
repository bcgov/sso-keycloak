SHELL := /usr/bin/env bash
NAMESPACE :=
SCENARIO := keycloak.scenario.authentication.AuthorizationCode
SERVER_URL :=
ADMIN_USERNAME :=
ADMIN_PASSWORD :=

# make sure scenario is set to the correct value
# test #1 - 34 users per second for 30 minutes (1800 seconds) with 101 users per realm and 101 clients per realm
ADDITIONAL_CONFIG := "--users-per-sec=34 --ramp-up=300 --users-per-realm=101 --measurement=1800 --clients-per-realm=101"

# make <comand> NAMESPACE="<namespace>"

.PHONY: run_job
run_job:
	oc -n $(NAMESPACE) process -f ./openshift/dc.yaml -p SCENARIO=$(SCENARIO) -p SERVER_URL=$(SERVER_URL) -p ADMIN_USERNAME=$(ADMIN_USERNAME) -p ADMIN_PASSWORD=$(ADMIN_PASSWORD) -p ADDITIONAL_CONFIG=$(ADDITIONAL_CONFIG)| oc -n $(NAMESPACE) apply -f -

.PHONY: cleanup
cleanup:
	oc -n $(NAMESPACE) delete job sso-benchmark-runner
	oc -n $(NAMESPACE) delete pvc sso-benchmark-runner-pvc
