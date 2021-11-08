import { Pool, PoolConfig } from 'pg';
import format from 'pg-format';
import getConfig from 'next/config';

const { serverRuntimeConfig = {} } = getConfig() || {};
const { pg_host, pg_port, pg_user, pg_password, pg_database, pg_ssl } = serverRuntimeConfig;
let _pgPool: Pool | null = null;

const pgConfig: PoolConfig = {
  host: pg_host,
  port: parseInt(pg_port),
  user: pg_user,
  password: pg_password,
  database: pg_database,
};

if (pg_ssl) pgConfig.ssl = { rejectUnauthorized: false };

_pgPool = new Pool(pgConfig);

export const runQuery = async (fmt: string, args: any[] = []) => {
  if (!_pgPool) return;

  const query = format(fmt);
  return _pgPool.query(query, args);
};
