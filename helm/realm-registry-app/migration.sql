create table if not exists public.rosters (
    id serial not null,
    realm varchar(1000),
    product_name varchar(1000),
    openshift_namespace varchar(1000),
    product_owner_email varchar(1000),
    product_owner_idir_userid varchar(1000),
    technical_contact_email varchar(1000),
    technical_contact_idir_userid varchar(1000),
    ministry varchar(1000),
    division varchar(1000),
    branch varchar(1000),
    created_at timestamp with time zone default current_timestamp,
    updated_at timestamp with time zone default current_timestamp,
    primary key(id)
);

create table if not exists public.surveys_1 (
    idir_userid varchar(1000),
    contact_email varchar(1000),
    willing_to_move varchar(1000),
    when_to_move varchar(1000),
    created_at timestamp with time zone default current_timestamp,
    primary key(idir_userid)
);
