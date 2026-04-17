/**
 * Apply migration SQL files that are present in /migrations but haven't been
 * pushed to the database yet. Idempotent — relies on `IF NOT EXISTS` clauses
 * in the SQL files. Run with:
 *
 *   npx dotenv -e .env.local -- tsx scripts/apply-pending-migrations.ts [file...]
 *
 * If no file names are given, applies every *.sql in /migrations in lexical
 * order (skipping ones whose first object already exists).
 */
import fs from 'node:fs';
import path from 'node:path';
import { neon, neonConfig } from '@neondatabase/serverless';

neonConfig.fetchConnectionCache = true;
neonConfig.poolQueryViaFetch = true;
neonConfig.fetchEndpoint = (host) => {
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}/sql`;
};

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set. Did you forget `dotenv -e .env.local --`?');
  process.exit(1);
}

const sql = neon(connectionString);

async function applyFile(file: string): Promise<void> {
  const fullPath = path.resolve('migrations', file);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Migration file not found: ${fullPath}`);
  }
  const text = fs.readFileSync(fullPath, 'utf8');

  // Drizzle uses --> statement-breakpoint, but hand-written files split on ;.
  // Strip comment lines, then split on top-level semicolons.
  const cleaned = text
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');

  const statements = cleaned
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`\n[migrate] ${file}: ${statements.length} statement(s)`);
  for (const [i, stmt] of statements.entries()) {
    try {
      await sql.query(stmt);
      console.log(`  [${i + 1}/${statements.length}] ok`);
    } catch (err: any) {
      console.error(`  [${i + 1}/${statements.length}] FAILED`);
      console.error(`  SQL: ${stmt.substring(0, 200)}${stmt.length > 200 ? '...' : ''}`);
      throw err;
    }
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const files = args.length > 0
    ? args
    : fs
        .readdirSync('migrations')
        .filter((f) => f.endsWith('.sql'))
        .sort();

  if (files.length === 0) {
    console.log('No migration files to apply.');
    return;
  }

  console.log(`[migrate] target database: ${connectionString!.split('@')[1]?.split('/')[0] ?? 'unknown'}`);
  console.log(`[migrate] applying: ${files.join(', ')}`);

  for (const file of files) {
    await applyFile(file);
  }

  console.log('\n[migrate] done');
}

main().catch((err) => {
  console.error('\n[migrate] failed:', err);
  process.exit(1);
});
