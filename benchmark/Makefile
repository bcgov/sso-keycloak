include .env

SHELL := /usr/bin/env bash
NAME := sso-benchmark-runner
NAMESPACE := c6af30-dev
SCENARIO := keycloak.scenario.authentication.AuthorizationCode
ADDITIONAL_CONFIG := "--measurement=30"

# make <comand> NAMESPACE="<namespace>"

.PHONY: run_job
run_job:
	oc -n $(NAMESPACE) process -f ./openshift/dc.yaml \
	-p SCENARIO=$(SCENARIO) \
	-p SERVER_URL=$(SERVER_URL) \
	-p ADMIN_USERNAME=$(ADMIN_USERNAME) \
	-p ADMIN_PASSWORD=$(ADMIN_PASSWORD) \
	-p ADDITIONAL_CONFIG=$(ADDITIONAL_CONFIG) \
	-p CHES_CLIENT_ID=$(CHES_CLIENT_ID) \
	-p CHES_CLIENT_SECRET=$(CHES_CLIENT_SECRET) \
	-p RECEPIENT=$(RECEPIENT) \
	-p NAME=$(NAME) \
	-p MAIL_SERVER=$(MAIL_SERVER) \
	-p CHES_TOKEN_URL=$(CHES_TOKEN_URL) \
	| oc -n $(NAMESPACE) apply -f -

.PHONY: cleanup
cleanup:
	oc -n $(NAMESPACE) delete job $(NAME)
	oc -n $(NAMESPACE) delete secret $(NAME)-secret
