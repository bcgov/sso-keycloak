#!/bin/bash

if [[ -n "$1" ]]; then
    db="$1"
else
    db="realm_registry"
fi

echo "SELECT 'CREATE DATABASE $db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db')\gexec" | psql -d postgres

psql -d $db -f "../../helm/realm-registry-app/migration.sql" -qtA --set ON_ERROR_STOP=1
