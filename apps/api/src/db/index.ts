import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';
import { getConfig } from '../config.js';

let db: ReturnType<typeof drizzle> | null = null;
let pool: Pool | null = null;

export function getDb() {
  if (!db) {
    const config = getConfig();
    const isRemote =
      config.databaseUrl.includes('supabase.com') ||
      config.databaseUrl.includes('sslmode=') ||
      config.databaseUrl.includes('pooler.supabase.com');
    const cleanUrl = config.databaseUrl
      .replace(/[?&]sslmode=[^&]+/g, '')
      .replace(/[?&]uselibpqcompat=[^&]+/g, '');
    pool = new Pool({
      connectionString: cleanUrl,
      connectionTimeoutMillis: 10000,
      ssl: isRemote ? { rejectUnauthorized: false } : undefined,
    });
    db = drizzle(pool, { schema });
  }
  return db;
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}

export async function testConnection(): Promise<boolean> {
  const client = await getPool().connect();
  try {
    await client.query('SELECT 1');
    return true;
  } finally {
    client.release();
  }
}

function getPool(): Pool {
  if (!pool) {
    getDb();
  }
  if (!pool) throw new Error('Database pool not initialized');
  return pool;
}
