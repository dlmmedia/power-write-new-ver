/**
 * Phase 2A — Drizzle migration journal backfill (ADDITIVE-ONLY).
 *
 * Backfills the `drizzle.__drizzle_migrations` tracking table for migration
 * files that have already been applied manually. After this script runs,
 * `drizzle-kit migrate` will be a no-op until you generate a NEW migration
 * with `drizzle-kit generate`.
 *
 * SAFETY:
 *  - Performs DDL only on the `drizzle` schema (CREATE SCHEMA, CREATE TABLE).
 *  - Performs DML only on `drizzle.__drizzle_migrations` (INSERT only).
 *  - Never touches public schema tables. Never modifies user data.
 *  - Idempotent: re-running is a no-op once all hashes are present.
 *  - --dry-run mode prints the plan and exits without writing anything.
 *
 * Usage:
 *   # Inspect what would change (no writes):
 *   npx dotenv -e .env.local -- tsx scripts/backfill-drizzle-journal.ts --dry-run
 *
 *   # Apply against the configured DATABASE_URL:
 *   npx dotenv -e .env.local -- tsx scripts/backfill-drizzle-journal.ts
 *
 *   # Apply against a specific connection string (e.g. backup branch):
 *   DATABASE_URL=<branch-uri> npx tsx scripts/backfill-drizzle-journal.ts
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { neon, neonConfig } from '@neondatabase/serverless';

neonConfig.fetchConnectionCache = true;
neonConfig.poolQueryViaFetch = true;
neonConfig.fetchEndpoint = (host) => {
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}/sql`;
};

const DRY_RUN = process.argv.includes('--dry-run');

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set. Did you forget `dotenv -e .env.local --`?');
  process.exit(1);
}

interface JournalEntry {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
}

interface Journal {
  version: string;
  dialect: string;
  entries: JournalEntry[];
}

const MIGRATIONS_DIR = path.resolve('migrations');
const JOURNAL_PATH = path.join(MIGRATIONS_DIR, 'meta', '_journal.json');

function readJournal(): Journal {
  const raw = fs.readFileSync(JOURNAL_PATH, 'utf8');
  return JSON.parse(raw) as Journal;
}

function listMigrationFiles(): string[] {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

function hashFile(file: string): string {
  const fullPath = path.join(MIGRATIONS_DIR, file);
  const content = fs.readFileSync(fullPath, 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function main(): Promise<void> {
  console.log(
    `[backfill] target: ${connectionString!.split('@')[1]?.split('/')[0] ?? 'unknown'}`,
  );
  if (DRY_RUN) console.log('[backfill] DRY RUN — no writes will be performed');

  const sqlClient = neon(connectionString!);

  // ---- READ current journal ----
  const journal = readJournal();
  const tagsInJournal = new Set(journal.entries.map((e) => e.tag));
  console.log(
    `[backfill] _journal.json currently tracks ${journal.entries.length} migration(s): ${[...tagsInJournal].join(', ') || '(none)'}`,
  );

  // ---- Discover all migration .sql files ----
  const allFiles = listMigrationFiles();
  console.log(`[backfill] /migrations contains ${allFiles.length} .sql file(s):`);
  for (const f of allFiles) console.log(`            - ${f}`);

  // ---- Plan journal additions ----
  // Anything in /migrations but NOT in _journal.json gets appended with a
  // timestamp earlier than `now()` so drizzle-kit treats it as historical.
  const baseTimestamp = 1_700_000_000_000; // 2023-11-14 — comfortably in the past
  const newJournalEntries: JournalEntry[] = [];
  let nextIdx = journal.entries.reduce((max, e) => Math.max(max, e.idx), -1) + 1;

  for (const file of allFiles) {
    const tag = file.replace(/\.sql$/, '');
    if (tagsInJournal.has(tag)) continue;
    newJournalEntries.push({
      idx: nextIdx,
      version: '7',
      when: baseTimestamp + nextIdx * 1000,
      tag,
      breakpoints: true,
    });
    nextIdx++;
  }

  if (newJournalEntries.length === 0) {
    console.log('[backfill] _journal.json already includes every .sql file ✓');
  } else {
    console.log(
      `[backfill] would append ${newJournalEntries.length} entry/entries to _journal.json:`,
    );
    for (const e of newJournalEntries) console.log(`            + ${e.tag} (idx=${e.idx})`);
  }

  // ---- Build the FINAL journal we'd write ----
  const finalJournal: Journal = {
    ...journal,
    entries: [...journal.entries, ...newJournalEntries].sort((a, b) => a.idx - b.idx),
  };

  // ---- Plan DB additions ----
  // Ensure the drizzle schema + table exist. Then insert any missing hashes.
  // We can't read drizzle.__drizzle_migrations until it exists, so we ensure
  // it exists FIRST (additive, idempotent) before computing the diff.
  if (!DRY_RUN) {
    await sqlClient.query('CREATE SCHEMA IF NOT EXISTS drizzle');
    await sqlClient.query(
      'CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)',
    );
  }

  let existingHashes = new Set<string>();
  if (!DRY_RUN) {
    const rows = (await sqlClient.query(
      'SELECT hash FROM drizzle.__drizzle_migrations',
    )) as Array<{ hash: string }>;
    existingHashes = new Set(rows.map((r) => r.hash));
    console.log(`[backfill] drizzle.__drizzle_migrations currently has ${rows.length} row(s)`);
  } else {
    console.log('[backfill] (dry-run) skipping query against drizzle.__drizzle_migrations');
  }

  // ---- Compute hashes & decide what to insert ----
  const planned: Array<{ tag: string; hash: string; createdAt: number }> = [];
  for (const entry of finalJournal.entries) {
    const file = `${entry.tag}.sql`;
    if (!fs.existsSync(path.join(MIGRATIONS_DIR, file))) {
      console.warn(`[backfill] WARN: journal references ${file} but file is missing, skipping`);
      continue;
    }
    const hash = hashFile(file);
    if (existingHashes.has(hash)) {
      console.log(`[backfill] ✓ ${entry.tag} already tracked (hash ${hash.slice(0, 8)}…)`);
      continue;
    }
    planned.push({ tag: entry.tag, hash, createdAt: entry.when });
  }

  if (planned.length === 0) {
    console.log('[backfill] nothing to insert — journal table fully covers /migrations ✓');
  } else {
    console.log(`[backfill] would INSERT ${planned.length} row(s) into drizzle.__drizzle_migrations:`);
    for (const p of planned)
      console.log(`            + tag=${p.tag} hash=${p.hash.slice(0, 12)}… created_at=${p.createdAt}`);
  }

  if (DRY_RUN) {
    console.log('\n[backfill] DRY RUN complete. No changes written.');
    return;
  }

  // ---- WRITE journal (additive: only adds entries) ----
  if (newJournalEntries.length > 0) {
    fs.writeFileSync(JOURNAL_PATH, JSON.stringify(finalJournal, null, 2) + '\n');
    console.log(`[backfill] wrote ${JOURNAL_PATH}`);
  }

  // ---- WRITE database rows (INSERT only into drizzle.__drizzle_migrations) ----
  for (const p of planned) {
    await sqlClient.query(
      'INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)',
      [p.hash, p.createdAt],
    );
    console.log(`[backfill] inserted ${p.tag}`);
  }

  // ---- VERIFY: re-read row count and confirm books are intact ----
  const finalRows = (await sqlClient.query(
    'SELECT COUNT(*)::int AS n FROM drizzle.__drizzle_migrations',
  )) as Array<{ n: number }>;
  const bookCount = (await sqlClient.query(
    'SELECT COUNT(*)::int AS n FROM generated_books',
  )) as Array<{ n: number }>;
  const chapterCount = (await sqlClient.query(
    'SELECT COUNT(*)::int AS n FROM book_chapters',
  )) as Array<{ n: number }>;

  console.log('\n[backfill] ✓ done');
  console.log(`           drizzle.__drizzle_migrations rows: ${finalRows[0]?.n ?? '?'}`);
  console.log(`           generated_books rows: ${bookCount[0]?.n ?? '?'}`);
  console.log(`           book_chapters rows: ${chapterCount[0]?.n ?? '?'}`);
}

main().catch((err) => {
  console.error('[backfill] failed:', err);
  process.exit(1);
});
