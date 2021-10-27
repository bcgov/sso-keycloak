#!/bin/bash

if [[ -n "$1" ]]; then
    db="$1"
else
    db="realm_profile"
fi

echo "SELECT 'CREATE DATABASE $db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db')\gexec" | psql -d postgres

psql -d $db -qtA --set ON_ERROR_STOP=1 <<EOF
create table if not exists public.roster (
    id serial not null,
    realm varchar(1000),
    product_name varchar(1000),
    openshift_namespace varchar(1000),
    product_owner_email varchar(1000),
    product_owner_idir_userid varchar(1000),
    technical_contact_email varchar(1000),
    technical_contact_idir_userid varchar(1000),
    created_at timestamp with time zone default current_timestamp,
    updated_at timestamp with time zone default current_timestamp,
    primary key(id)
);
EOF
