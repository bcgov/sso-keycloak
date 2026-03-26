SHELL := /usr/bin/env bash

.PHONY: up
up:
	docker-compose -f keycloak-postgres.yml up

.PHONY: down
down:
	docker-compose -f keycloak-postgres.yml down
	docker volume rm localdev_log_data localdev_postgres_data
