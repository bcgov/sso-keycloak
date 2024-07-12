SHELL := /usr/bin/env bash

.PHONY: influxdb-secret
influxdb-secret:
	oc create -n $(NAMESPACE) secret generic k6-influxdb-secret --from-literal=DOCKER_INFLUXDB_INIT_USERNAME=$(DOCKER_INFLUXDB_INIT_USERNAME) --from-literal=DOCKER_INFLUXDB_INIT_PASSWORD=$(DOCKER_INFLUXDB_INIT_PASSWORD) --from-literal=DOCKER_INFLUXDB_INIT_ORG=$(DOCKER_INFLUXDB_INIT_ORG) --from-literal=DOCKER_INFLUXDB_INIT_BUCKET=$(DOCKER_INFLUXDB_INIT_BUCKET) --from-literal=DOCKER_INFLUXDB_INIT_ADMIN_TOKEN=$(DOCKER_INFLUXDB_INIT_ADMIN_TOKEN) && oc -n $(NAMESPACE) label secret k6-influxdb-secret app=k6-influxdb

.PHONY: install-influxdb
install-influxdb:
	oc -n $(NAMESPACE) process -f ./openshift/influxdb/template.yaml | oc -n $(NAMESPACE) apply -f -

.PHONY: destroy-influxdb
destroy-influxdb:
	oc -n $(NAMESPACE) delete statefulset,pvc,secret,service,route,networkpolicy -l app=k6-influxdb

.PHONY: k6-config
k6-config:
	oc create -n $(NAMESPACE) configmap k6-config --from-file=./src/config/config.json

.PHONY: create-k6-job
create-k6-job:
	oc -n $(NAMESPACE) process -f ./openshift/k6/template.yaml | oc -n $(NAMESPACE) apply -f -

.PHONY: destroy-k6-job
destroy-k6-job:
	oc -n $(NAMESPACE) delete job sso-k6
	oc -n $(NAMESPACE) delete configmap k6-config
