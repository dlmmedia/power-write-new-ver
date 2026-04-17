/**
 * Node-only instrumentation. Imported lazily by `instrumentation.ts` so the
 * edge runtime bundle never sees pg drivers, fs, or process.cwd references.
 *
 * Responsibilities (in order):
 *  1. Force evaluation of `lib/env.ts` so misconfiguration fails fast.
 *  2. READ-ONLY database health check: confirms we can SELECT from
 *     `generated_books` and reports the row count.
 *  3. READ-ONLY schema drift check: compares the columns declared in
 *     `lib/db/schema.ts` against the live database and logs any mismatches.
 *
 * IMPORTANT — SAFETY:
 *  - This file MUST NOT execute any DDL or DML against the database.
 *    No CREATE/ALTER/DROP, no INSERT/UPDATE/DELETE, no migration runner.
 *  - All findings are logged. The process is never aborted on drift; we
 *    surface the warning so a human decides what to do.
 *  - Health checks happen in a fire-and-forget Promise so they cannot block
 *    request serving even on cold start.
 */

export {}; // ensure this file is treated as a module

import { createLogger } from './lib/log';

const log = createLogger('instrumentation');

// Top-level await is allowed in modules; we want env to load before anything else.
try {
  await import('./lib/env');
} catch (err) {
  log.error({ err }, 'environment validation failed at boot');
  // Do not throw — Next.js would crash the server before any logging UI loads.
}

// Fire-and-forget so we don't delay the dev server's "Ready in" line.
void runReadOnlyHealthChecks();

// In-process BullMQ worker bootstrap.
//
// When WORKER_IN_PROCESS=true and REDIS_URL is set, this Next.js server
// also drains the queue. Cheaper than running a dedicated Railway service
// and fine for our concurrency profile (book-generation: 1, audio: 4,
// export: 2 in-flight per process).
//
// Keep this OFF in local dev unless explicitly testing the queue pipeline,
// otherwise every `npm run dev` reload spawns and tears down workers.
if (process.env.WORKER_IN_PROCESS === 'true') {
  void bootInProcessWorker();
}

async function bootInProcessWorker(): Promise<void> {
  try {
    const [{ isQueueEnabled }, { startWorkers, bindSignalHandlers }] =
      await Promise.all([
        import('./lib/queue/redis'),
        import('./lib/queue/worker'),
      ]);

    if (!isQueueEnabled()) {
      log.warn(
        'WORKER_IN_PROCESS=true but REDIS_URL is missing; not starting workers',
      );
      return;
    }

    bindSignalHandlers();
    const workers = startWorkers();
    log.info(
      { workerCount: workers.length, queues: workers.map((w) => w.name) },
      'in-process worker booted',
    );
  } catch (err) {
    log.error({ err }, 'failed to boot in-process worker (non-fatal)');
  }
}

async function runReadOnlyHealthChecks(): Promise<void> {
  try {
    const [{ db, withRetry }, schemaModule, drizzleOrm] = await Promise.all([
      import('./lib/db'),
      import('./lib/db/schema'),
      import('drizzle-orm'),
    ]);

    const start = Date.now();

    let bookCount: number | null = null;
    try {
      const raw = await withRetry(async () =>
        db.execute(drizzleOrm.sql`SELECT COUNT(*)::int AS count FROM generated_books`),
      );
      const rows = extractRows<{ count: number | string }>(raw);
      const first = rows[0];
      bookCount = first ? Number(first.count) : null;
      log.info({ bookCount, durationMs: Date.now() - start }, 'db ok');
    } catch (err) {
      log.error({ err }, 'db health check failed');
      return;
    }

    await checkSchemaDrift(db, schemaModule, drizzleOrm);
  } catch (err) {
    log.error({ err }, 'startup checks errored');
  }
}

/**
 * Drizzle's `db.execute()` return shape varies by driver and version. Handle:
 *  - plain array (neon-http on some versions)
 *  - { rows: [...] } (pg-style)
 *  - { rowCount, rows } (older drizzle)
 */
function extractRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === 'object' && 'rows' in result) {
    const rows = (result as { rows: unknown }).rows;
    if (Array.isArray(rows)) return rows as T[];
  }
  return [];
}

async function checkSchemaDrift(
  db: typeof import('./lib/db').db,
  schemaModule: typeof import('./lib/db/schema'),
  drizzleOrm: typeof import('drizzle-orm'),
): Promise<void> {
  try {
    const raw = await db.execute(
      drizzleOrm.sql`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'`,
    );
    const rows = extractRows<{ table_name: string; column_name: string }>(raw);

    if (rows.length === 0) {
      log.warn('schema drift check: information_schema returned no rows, skipping');
      return;
    }

    const liveColumns = new Map<string, Set<string>>();
    for (const r of rows) {
      let cols = liveColumns.get(r.table_name);
      if (!cols) {
        cols = new Set();
        liveColumns.set(r.table_name, cols);
      }
      cols.add(r.column_name);
    }

    const allTables = (Object.values(schemaModule) as unknown[]).filter(
      (v): v is Record<symbol | string, unknown> =>
        !!v && typeof v === 'object' && Symbol.for('drizzle:Name') in (v as object),
    );

    const missingTables: string[] = [];
    const missingColumns: Array<{ table: string; column: string }> = [];

    for (const table of allTables) {
      const tableName = (table as Record<symbol, unknown>)[Symbol.for('drizzle:Name')] as string;
      const liveCols = liveColumns.get(tableName);

      if (!liveCols) {
        missingTables.push(tableName);
        continue;
      }

      const codeColumns = (table as Record<symbol, unknown>)[Symbol.for('drizzle:Columns')] as
        | Record<string, { name: string }>
        | undefined;
      if (!codeColumns) continue;

      for (const colDef of Object.values(codeColumns)) {
        if (!liveCols.has(colDef.name)) {
          missingColumns.push({ table: tableName, column: colDef.name });
        }
      }
    }

    if (missingTables.length === 0 && missingColumns.length === 0) {
      log.info('schema check ok — schema.ts matches live DB');
      return;
    }

    log.warn(
      {
        missingTables,
        missingColumns,
        howToResolve:
          'npx dotenv -e .env.local -- tsx scripts/apply-pending-migrations.ts <file>',
      },
      '⚠ schema drift detected (read-only check, no changes made)',
    );
  } catch (err) {
    log.warn({ err }, 'schema drift check skipped (non-fatal)');
  }
}
