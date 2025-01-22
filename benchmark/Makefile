SHELL := /usr/bin/env bash

# make <comand> NAMESPACE="<namespace>"

.PHONY: run_job
run_job:
	oc -n $(NAMESPACE) process -f ./openshift/dc.yaml | oc -n $(NAMESPACE) apply -f -

.PHONY: cleanup
cleanup:
	oc -n $(NAMESPACE) delete job sso-benchmark-runner
	oc -n $(NAMESPACE) delete pvc sso-benchmark-runner-pvc
