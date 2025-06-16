#!/bin/bash
if [[ -n "$1" ]]; then
 db="$1"
else
 db="otp"
fi

echo "SELECT 'CREATE DATABASE $db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db')\gexec" | psql -U postgres -d postgres
