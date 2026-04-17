/**
 * GET /api/books/exports?bookId=...
 *
 * Returns the most recent PDF/EPUB exports for a book belonging to the
 * caller. Used by the Downloads tray on /library/[id] to show pending,
 * active, completed, and failed exports with download links.
 *
 * Response:
 *   { ok: true, exports: Array<{
 *       id, bookId, format, status, jobId,
 *       fileUrl, fileSize, layoutType,
 *       errorMessage, createdAt, completedAt
 *     }> }
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { listExportsForBook } from '@/lib/db/export-operations';
import { getUserInfo } from '@/lib/services/user-service';
import { getBook } from '@/lib/db/operations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const bookIdParam = url.searchParams.get('bookId');
  const bookId = bookIdParam ? Number.parseInt(bookIdParam, 10) : NaN;
  if (!Number.isFinite(bookId) || bookId <= 0) {
    return NextResponse.json({ error: 'bookId is required' }, { status: 400 });
  }

  // Ownership check — Pro users can read exports for any book, but the
  // listing always filters by *their own* userId so they only see
  // exports they personally requested.
  const book = await getBook(bookId);
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

  const exports = await listExportsForBook(bookId, clerkUserId, 20);
  return NextResponse.json({ ok: true, exports });
}
