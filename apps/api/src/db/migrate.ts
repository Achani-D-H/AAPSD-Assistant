import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { getConfig } from '../config.js';

export async function runMigrations(): Promise<void> {
  const config = getConfig();
  const isRemote =
    config.databaseUrl.includes('supabase.com') ||
    config.databaseUrl.includes('sslmode=') ||
    config.databaseUrl.includes('pooler.supabase.com');
  const cleanUrl = config.databaseUrl
    .replace(/[?&]sslmode=[^&]+/g, '')
    .replace(/[?&]uselibpqcompat=[^&]+/g, '');
  const pool = new Pool({
    connectionString: cleanUrl,
    ssl: isRemote ? { rejectUnauthorized: false } : undefined,
  });

  const db = drizzle(pool);

  console.log('Running database migrations…');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations complete.');

  await pool.end();
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
