SHELL := /usr/bin/env bash

.PHONY: influxdbsecret
influxdbsecret:
	oc create -n $(NAMESPACE) secret generic k6-influxdb-secret --from-literal=DOCKER_INFLUXDB_INIT_USERNAME=$(DOCKER_INFLUXDB_INIT_USERNAME) --from-literal=DOCKER_INFLUXDB_INIT_PASSWORD=$(DOCKER_INFLUXDB_INIT_PASSWORD) --from-literal=DOCKER_INFLUXDB_INIT_ORG=$(DOCKER_INFLUXDB_INIT_ORG) --from-literal=DOCKER_INFLUXDB_INIT_BUCKET=$(DOCKER_INFLUXDB_INIT_BUCKET) --from-literal=DOCKER_INFLUXDB_INIT_ADMIN_TOKEN=$(DOCKER_INFLUXDB_INIT_ADMIN_TOKEN)

.PHONY: install-influxdb
install-influxdb:
	oc -n $(NAMESPACE) apply -f ./openshift/influxdb/statefulset.yaml

.PHONY: destroy-influxdb
destroy-influxdb:
	oc -n $(NAMESPACE) delete statefulset,pvc -l app=k6-influxdb

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
