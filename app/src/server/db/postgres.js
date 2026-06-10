import pg from 'pg';

const { Pool } = pg;

let pool;

export function getDatabaseUrl() {
  return process.env.DATABASE_URL || '';
}

export function isPostgresEnabled() {
  return Boolean(getDatabaseUrl());
}

export function getPool() {
  const connectionString = getDatabaseUrl();

  if (!connectionString) {
    throw new Error('DATABASE_URL is required for PostgreSQL storage');
  }

  if (!pool) {
    const ssl =
      connectionString.includes('render.com')
        ? { rejectUnauthorized: false }
        : undefined;

    pool = new Pool({
      connectionString,
      ssl,

      max: Number(process.env.DATABASE_POOL_MAX || 3),

      idleTimeoutMillis: Number(
        process.env.DATABASE_IDLE_TIMEOUT_MS || 30000
      ),

      connectionTimeoutMillis: 10000,

      keepAlive: true,
    });
  }

  return pool;
}
export async function query(text, params) {
  return getPool().query(text, params);
}
