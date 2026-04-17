/**
 * Smoke test for the export-book queue processor.
 *
 * Runs three scenarios against the production worker:
 *   1. Enqueue a real EPUB export for an existing book and watch it
 *      complete (verifying Blob upload + DB row updates).
 *   2. Enqueue a PDF export of the same book.
 *   3. Try to export a non-existent book — should fail with a clear
 *      error message and the row should be marked 'failed'.
 *
 * Designed to be safe to re-run: each export is a new row + new Blob
 * key, never mutates existing book data. Uses the deployed worker
 * (does NOT spin up a local one).
 *
 * Usage:
 *   npx dotenv -e .env.local -- tsx scripts/verify-export-processor.ts <bookId>
 */
import { db } from '../lib/db';
import { generatedBooks } from '../lib/db/schema';
import { closeRedis, isQueueEnabled } from '../lib/queue/redis';
import { closeQueues, enqueue } from '../lib/queue/queues';
import { createExportRow, getExportRow } from '../lib/db/export-operations';
import { eq } from 'drizzle-orm';

async function findTestBook(): Promise<{ id: number; userId: string; title: string } | null> {
  const cliBookId = process.argv[2] ? Number.parseInt(process.argv[2], 10) : NaN;
  if (Number.isFinite(cliBookId) && cliBookId > 0) {
    const rows = await db
      .select({ id: generatedBooks.id, userId: generatedBooks.userId, title: generatedBooks.title })
      .from(generatedBooks)
      .where(eq(generatedBooks.id, cliBookId))
      .limit(1);
    return rows[0] ?? null;
  }
  // Fall back to "any completed book with at least 1 chapter".
  const rows = await db
    .select({ id: generatedBooks.id, userId: generatedBooks.userId, title: generatedBooks.title })
    .from(generatedBooks)
    .limit(10);
  return rows[0] ?? null;
}

async function pollUntilSettled(
  exportId: number,
  userId: string,
  timeoutMs = 180_000,
): Promise<{ status: string; fileUrl: string | null; fileSize: number | null; errorMessage: string | null }> {
  const start = Date.now();
  let lastStatus = '';
  while (Date.now() - start < timeoutMs) {
    const row = await getExportRow(exportId, userId);
    if (!row) throw new Error(`export row ${exportId} disappeared`);
    if (row.status !== lastStatus) {
      console.log(
        `  [${Math.round((Date.now() - start) / 1000)}s] status=${row.status}` +
          (row.fileSize ? ` size=${row.fileSize}B` : '') +
          (row.errorMessage ? ` err=${row.errorMessage.slice(0, 80)}` : ''),
      );
      lastStatus = row.status;
    }
    if (row.status === 'completed' || row.status === 'failed') {
      return {
        status: row.status,
        fileUrl: row.fileUrl,
        fileSize: row.fileSize,
        errorMessage: row.errorMessage,
      };
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`timed out waiting for export ${exportId}`);
}

async function runScenario(
  label: string,
  bookId: number,
  userId: string,
  format: 'pdf' | 'epub',
  expectFailure: boolean,
): Promise<void> {
  console.log(`\n=== ${label} ===`);
  console.log(`  bookId=${bookId} format=${format} expectFailure=${expectFailure}`);

  const row = await createExportRow({ bookId, userId, format });
  console.log(`  created tracking row id=${row.id}`);

  const jobId = await enqueue('export-book', {
    bookId,
    format,
    requestedByUserId: userId,
    exportRowId: row.id,
  });
  if (!jobId) throw new Error('enqueue returned null');
  console.log(`  enqueued jobId=${jobId}`);

  const result = await pollUntilSettled(row.id, userId);
  if (expectFailure) {
    if (result.status !== 'failed') {
      console.error(`  FAIL: expected failed, got ${result.status}`);
      process.exitCode = 1;
    } else {
      console.log(`  PASS: failed as expected`);
    }
  } else {
    if (result.status !== 'completed' || !result.fileUrl) {
      console.error(`  FAIL: expected completed with fileUrl, got status=${result.status}`);
      process.exitCode = 1;
    } else {
      console.log(`  PASS: ${result.fileUrl} (${result.fileSize}B)`);
    }
  }
}

async function main() {
  if (!isQueueEnabled()) {
    console.error('REDIS_URL not set; cannot run smoke test');
    process.exit(1);
  }

  const book = await findTestBook();
  if (!book) {
    console.error('No book found to test against');
    process.exit(1);
  }

  console.log(`Testing against book ${book.id} "${book.title}" owned by ${book.userId}`);

  await runScenario('EPUB export (happy path)', book.id, book.userId, 'epub', false);
  await runScenario('PDF export (happy path)', book.id, book.userId, 'pdf', false);
  await runScenario(
    'EPUB export of non-existent book (failure path)',
    999_999_999,
    book.userId,
    'epub',
    true,
  );

  console.log('\nclosing connections…');
  await closeQueues();
  await closeRedis();
  console.log('done.');
}

main().catch((err) => {
  console.error('smoke test crashed:', err);
  process.exitCode = 1;
});
