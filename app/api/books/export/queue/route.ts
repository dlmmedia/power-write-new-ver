/**
 * POST /api/books/export/queue
 *
 * Asynchronously generate a PDF or EPUB export. Creates a tracking row in
 * `book_exports`, enqueues an `export-book` job, and returns the row id +
 * BullMQ job id immediately. The Downloads tray on /library/[id] then polls
 * /api/books/exports?bookId=... until status === 'completed' (file_url ready).
 *
 * Request:
 *   { bookId: number|string,
 *     format: 'pdf' | 'epub',
 *     layoutType?: BookLayoutType }   // PDF only; ignored for EPUB
 *
 * Response (202):
 *   { ok: true, exportId: number, jobId: string,
 *     pollUrl: '/api/books/exports?bookId=...' }
 *
 * If REDIS_URL is not configured, returns 503 with a hint to use the legacy
 * synchronous /api/books/export endpoint.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getBook } from '@/lib/db/operations';
import { enqueue } from '@/lib/queue/queues';
import { isQueueEnabled } from '@/lib/queue/redis';
import { getUserInfo } from '@/lib/services/user-service';
import { createExportRow, markExportFailed } from '@/lib/db/export-operations';
import { BOOK_LAYOUTS, type BookLayoutType } from '@/lib/types/book-layouts';
import { createLogger } from '@/lib/log';

const log = createLogger('api/books/export/queue');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!isQueueEnabled()) {
    return NextResponse.json(
      {
        error: 'Queue subsystem is disabled (REDIS_URL not set).',
        hint: 'Use POST /api/books/export for the synchronous path.',
      },
      { status: 503 },
    );
  }

  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { bookId, format, layoutType } = (body ?? {}) as {
    bookId?: number | string;
    format?: string;
    layoutType?: BookLayoutType;
  };

  if (!bookId || (format !== 'pdf' && format !== 'epub')) {
    return NextResponse.json(
      { error: "bookId and format ('pdf' | 'epub') are required" },
      { status: 400 },
    );
  }

  const numericBookId =
    typeof bookId === 'string' ? Number.parseInt(bookId, 10) : bookId;
  if (!Number.isFinite(numericBookId) || numericBookId <= 0) {
    return NextResponse.json({ error: 'Invalid bookId' }, { status: 400 });
  }

  if (layoutType && !BOOK_LAYOUTS[layoutType]) {
    return NextResponse.json(
      { error: `Unknown layoutType: ${layoutType}` },
      { status: 400 },
    );
  }

  const book = await getBook(numericBookId);
  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  const userInfo = await getUserInfo(clerkUserId);
  const isProUser = userInfo?.tier === 'pro';
  if (book.userId !== clerkUserId && !isProUser) {
    return NextResponse.json(
      { error: 'You do not own this book' },
      { status: 403 },
    );
  }

  // Use the same effective user id the row is owned by — we want users to
  // see *their* requested exports even when an admin/Pro user re-exports a
  // book they don't own.
  const ownerForRow = clerkUserId;

  // Create the tracking row first, then pass its id in the job payload.
  // The processor uses exportRowId (not job.id) so the worker can never
  // race ahead of the route — by the time the job is enqueued, the row
  // is already committed and discoverable by primary key.
  const row = await createExportRow({
    bookId: numericBookId,
    userId: ownerForRow,
    format,
    layoutType: format === 'pdf' ? layoutType : undefined,
  });

  const jobId = await enqueue('export-book', {
    bookId: numericBookId,
    format,
    requestedByUserId: ownerForRow,
    exportRowId: row.id,
  });

  if (!jobId) {
    await markExportFailed(row.id, 'enqueue returned null (queue disabled)');
    return NextResponse.json(
      { error: 'Failed to enqueue export job' },
      { status: 500 },
    );
  }

  log.info(
    { exportId: row.id, jobId, bookId: numericBookId, format, userId: clerkUserId },
    'export job enqueued',
  );

  return NextResponse.json(
    {
      ok: true,
      exportId: row.id,
      jobId,
      pollUrl: `/api/books/exports?bookId=${numericBookId}`,
    },
    { status: 202 },
  );
}
