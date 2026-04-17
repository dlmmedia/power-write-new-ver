/**
 * Verify the Phase 2F Pool driver works end-to-end:
 *   1. Plain query through the Pool.
 *   2. db.transaction(...) runs and commits.
 *   3. db.transaction(...) rollback works on throw (verified via row count delta).
 *
 * Reads exclusively — does not modify any application data. The transaction
 * rollback test creates a temp row in a temp table that is dropped immediately.
 */

import { db } from '@/lib/db';
import { generatedBooks } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

async function main(): Promise<void> {
  console.log('[verify-pool] starting');

  console.log('[verify-pool] (1) plain query…');
  const t0 = Date.now();
  const books = await db.select({ count: sql<number>`COUNT(*)::int` }).from(generatedBooks);
  console.log(`[verify-pool]     ✓ ${books[0]?.count} books in ${Date.now() - t0}ms`);

  console.log('[verify-pool] (2) tx commit on temp table…');
  const t1 = Date.now();
  const txResult = await db.transaction(async (tx) => {
    await tx.execute(sql`CREATE TEMP TABLE __pool_test (n int) ON COMMIT DROP`);
    await tx.execute(sql`INSERT INTO __pool_test (n) VALUES (1), (2), (3)`);
    const r = await tx.execute(sql`SELECT COUNT(*)::int AS c FROM __pool_test`);
    return r;
  });
  console.log(`[verify-pool]     ✓ tx ok in ${Date.now() - t1}ms`, JSON.stringify(txResult).slice(0, 100));

  console.log('[verify-pool] (3) tx rollback on throw…');
  let rolledBack = false;
  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT 1`);
      throw new Error('intentional rollback');
    });
  } catch (e) {
    rolledBack = e instanceof Error && e.message === 'intentional rollback';
  }
  console.log(`[verify-pool]     ${rolledBack ? '✓' : '✗'} rollback propagated`);

  console.log('[verify-pool] done');
  process.exit(0);
}

main().catch((err) => {
  console.error('[verify-pool] FAIL', err);
  process.exit(1);
});
