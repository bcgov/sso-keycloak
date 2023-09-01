CREATE TABLE IF NOT EXISTS public.sso_logs (
  id serial NOT NULL,
  timestamp timestamp,
  sequence int,
  logger_class_name varchar(1000),
  logger_name varchar(1000),
  level varchar(1000),
  message jsonb,
  thread_name varchar(1000),
  thread_id int,
  mdc jsonb,
  ndc varchar(1000),
  host_name varchar(1000),
  process_name varchar(1000),
  process_id int,
  version varchar(1000)
);

ALTER TABLE IF EXISTS public.sso_logs
ADD COLUMN IF NOT EXISTS namespace varchar(255);

CREATE TABLE IF NOT EXISTS sso_stats (
  realm_id varchar(255),
  date date,
  login integer,
  code_to_token integer,
  refresh_token integer,
  user_info_request integer,
  introspect_token integer,
  client_login integer,
  refresh_token_error integer,
  login_error integer,
  UNIQUE (realm_id, date)
);

ALTER TABLE IF EXISTS public.sso_stats
DROP CONSTRAINT IF EXISTS sso_stats_realm_id_date_key;

ALTER TABLE IF EXISTS public.sso_stats
ADD COLUMN IF NOT EXISTS namespace varchar(255);

ALTER TABLE IF EXISTS public.sso_stats
ADD UNIQUE (realm_id, date, namespace);

DROP TRIGGER IF EXISTS update_stats ON public.sso_logs;

DROP FUNCTION IF EXISTS save_log_types();

CREATE OR REPLACE FUNCTION save_log_types ()
  RETURNS VOID
  AS $BODY$
DECLARE
  event_types text[];
  event_type character varying;
  counter character varying;
BEGIN
  counter := '';
  event_types := ARRAY['LOGIN', 'CODE_TO_TOKEN', 'REFRESH_TOKEN', 'USER_INFO_REQUEST', 'INTROSPECT_TOKEN', 'CLIENT_LOGIN', 'REFRESH_TOKEN_ERROR', 'LOGIN_ERROR'];
  FOREACH event_type IN ARRAY event_types LOOP
    EXECUTE format('
    INSERT INTO sso_stats (realm_id, %s, date, namespace)
      SELECT
        message ->> %L AS realm_id,
        count(message ->> %L) AS %s,
        DATE(timestamp) AS date,
        NAMESPACE
      FROM
        sso_logs
      WHERE
        message ->> %L = %L
      GROUP BY
        message ->> %L,
        message ->> %L,
        DATE(timestamp),
        NAMESPACE
      ON CONFLICT (namespace, date, realm_id) DO UPDATE set %s = excluded.%s;
   ', event_type, 'realmId', 'type', event_type, 'type', event_type, 'realmId', 'type', event_type, event_type);
  END LOOP;
END;
$BODY$
LANGUAGE 'plpgsql';
