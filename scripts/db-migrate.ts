/**
 * Apply any unapplied drizzle migrations.
 *
 * After Phase 2A backfill, this is the canonical way to apply NEW migrations
 * (created via `drizzle-kit generate`). Existing/legacy migrations are tracked
 * in `drizzle.__drizzle_migrations` and will be skipped automatically.
 *
 * SAFETY:
 *  - Only applies migrations whose hash is NOT yet in
 *    `drizzle.__drizzle_migrations`.
 *  - Refuses to run unless --confirm or DRIZZLE_MIGRATE_CONFIRM=1 is set.
 *    Even when confirmed, prints a plan (and book count) BEFORE applying.
 *  - Always reports book/chapter counts before and after.
 *  - Recommended pre-flight: take a Neon backup branch first.
 *
 * Usage (interactive plan, refuses to apply):
 *   npx dotenv -e .env.local -- tsx scripts/db-migrate.ts
 *
 * Usage (apply):
 *   npx dotenv -e .env.local -- tsx scripts/db-migrate.ts --confirm
 *
 * Usage (against a specific connection string, e.g. backup branch):
 *   DATABASE_URL=<branch-uri> npx tsx scripts/db-migrate.ts --confirm
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { neon, neonConfig } from '@neondatabase/serverless';

neonConfig.fetchConnectionCache = true;
neonConfig.poolQueryViaFetch = true;
neonConfig.fetchEndpoint = (host) => {
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}/sql`;
};

const url =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

if (!url) {
  console.error('DATABASE_URL is not set. Did you forget `dotenv -e .env.local --`?');
  process.exit(1);
}

const CONFIRMED =
  process.argv.includes('--confirm') || process.env.DRIZZLE_MIGRATE_CONFIRM === '1';

const MIGRATIONS_DIR = path.resolve('migrations');
const JOURNAL_PATH = path.join(MIGRATIONS_DIR, 'meta', '_journal.json');

interface JournalEntry {
  idx: number;
  tag: string;
  when: number;
}
interface Journal {
  entries: JournalEntry[];
}

function readJournal(): Journal {
  return JSON.parse(fs.readFileSync(JOURNAL_PATH, 'utf8')) as Journal;
}

function hashFile(file: string): string {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'))
    .digest('hex');
}

async function main(): Promise<void> {
  const sqlClient = neon(url!);
  const db = drizzle(sqlClient);

  console.log(`[db:migrate] target: ${url!.split('@')[1]?.split('/')[0] ?? 'unknown'}`);

  // Snapshot before
  const beforeBooks = (await sqlClient.query(
    'SELECT COUNT(*)::int AS n FROM generated_books',
  )) as Array<{ n: number }>;
  const beforeChapters = (await sqlClient.query(
    'SELECT COUNT(*)::int AS n FROM book_chapters',
  )) as Array<{ n: number }>;
  console.log(
    `[db:migrate] BEFORE: ${beforeBooks[0]?.n ?? '?'} books, ${beforeChapters[0]?.n ?? '?'} chapters`,
  );

  // Plan
  const journal = readJournal();
  let appliedHashes = new Set<string>();
  try {
    const rows = (await sqlClient.query(
      'SELECT hash FROM drizzle.__drizzle_migrations',
    )) as Array<{ hash: string }>;
    appliedHashes = new Set(rows.map((r) => r.hash));
  } catch (err) {
    console.error(
      '[db:migrate] could not read drizzle.__drizzle_migrations. Run scripts/backfill-drizzle-journal.ts first.',
    );
    throw err;
  }

  const pending = journal.entries.filter((e) => {
    const file = `${e.tag}.sql`;
    if (!fs.existsSync(path.join(MIGRATIONS_DIR, file))) return false;
    return !appliedHashes.has(hashFile(file));
  });

  if (pending.length === 0) {
    console.log('[db:migrate] no pending migrations ✓');
    return;
  }

  console.log(`[db:migrate] ${pending.length} pending migration(s):`);
  for (const e of pending) console.log(`              + ${e.tag}`);

  if (!CONFIRMED) {
    console.log('\n[db:migrate] REFUSING TO APPLY. Re-run with --confirm to apply.');
    console.log('[db:migrate] STRONGLY recommended: take a Neon backup branch first.');
    process.exit(1);
  }

  console.log('\n[db:migrate] applying via drizzle-orm migrate()…');
  await migrate(db, { migrationsFolder: './migrations' });

  // Snapshot after
  const afterBooks = (await sqlClient.query(
    'SELECT COUNT(*)::int AS n FROM generated_books',
  )) as Array<{ n: number }>;
  const afterChapters = (await sqlClient.query(
    'SELECT COUNT(*)::int AS n FROM book_chapters',
  )) as Array<{ n: number }>;
  console.log(
    `[db:migrate] AFTER:  ${afterBooks[0]?.n ?? '?'} books, ${afterChapters[0]?.n ?? '?'} chapters`,
  );

  if ((afterBooks[0]?.n ?? -1) < (beforeBooks[0]?.n ?? -2)) {
    console.error('[db:migrate] ⚠ BOOK COUNT DECREASED — investigate the migration immediately!');
    process.exit(2);
  }

  console.log('[db:migrate] ✓ done');
}

main().catch((err) => {
  console.error('[db:migrate] failed:', err);
  process.exit(1);
});
