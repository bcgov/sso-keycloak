SHELL := /usr/bin/env bash

# make <comand> NAMESPACE="<namespace>"

.PHONY: config
config:
	oc create -n $(NAMESPACE) configmap k6-config --from-file=./src/config/config.json

.PHONY: run_job
run_job:
	oc -n $(NAMESPACE) process -f ./openshift/k6/dc.yaml | oc -n $(NAMESPACE) apply -f -

.PHONY: delete
delete:
	oc -n $(NAMESPACE) delete job sso-k6
	oc -n $(NAMESPACE) delete configmap k6-config
