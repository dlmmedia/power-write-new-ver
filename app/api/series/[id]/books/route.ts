import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getDbUserIdFromClerk } from '@/lib/services/user-service';
import {
  getSeriesById,
  getSeriesWithBooks,
  attachBookToSeries,
  getBook,
} from '@/lib/db/operations';

export const runtime = 'nodejs';

async function getEffectiveUserId(): Promise<string | null> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return null;
  let email: string | undefined;
  try {
    const user = await currentUser();
    email = user?.emailAddresses?.[0]?.emailAddress;
  } catch {
    /* ignore */
  }
  const dbUserId = await getDbUserIdFromClerk(clerkUserId, email);
  return dbUserId || clerkUserId;
}

function parseSeriesId(id: string): number | null {
  const n = parseInt(id, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** GET — list books in this series (ordered). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getEffectiveUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const seriesId = parseSeriesId(id);
    if (!seriesId) {
      return NextResponse.json({ error: 'Invalid series id' }, { status: 400 });
    }

    const result = await getSeriesWithBooks(seriesId);
    if (!result) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }
    if (result.series.userId !== userId && !result.series.isPublic) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      books: result.books.map((b) => ({
        id: b.id,
        title: b.title,
        seriesNumber: b.seriesNumber,
        summary: b.summary,
        coverUrl: b.coverUrl,
        status: b.status,
        productionStatus: b.productionStatus,
        createdAt: b.createdAt,
      })),
    });
  } catch (err) {
    console.error('Error listing series books:', err);
    return NextResponse.json(
      { error: 'Failed to list books', details: err instanceof Error ? err.message : 'Unknown' },
      { status: 500 },
    );
  }
}

/** POST { bookId, seriesNumber? } — attach an existing book to this series. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getEffectiveUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const seriesId = parseSeriesId(id);
    if (!seriesId) {
      return NextResponse.json({ error: 'Invalid series id' }, { status: 400 });
    }

    const series = await getSeriesById(seriesId);
    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }
    if (series.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const bookId = Number(body?.bookId);
    if (!Number.isFinite(bookId) || bookId <= 0) {
      return NextResponse.json({ error: 'bookId is required' }, { status: 400 });
    }

    const book = await getBook(bookId);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }
    if (book.userId !== userId) {
      return NextResponse.json(
        { error: 'You can only add your own books to a series' },
        { status: 403 },
      );
    }

    const seriesNumber =
      body?.seriesNumber !== undefined && Number.isFinite(Number(body.seriesNumber))
        ? Math.max(1, Number(body.seriesNumber))
        : undefined;

    const updated = await attachBookToSeries(bookId, seriesId, seriesNumber);
    return NextResponse.json({ success: true, book: updated });
  } catch (err) {
    console.error('Error attaching book to series:', err);
    return NextResponse.json(
      { error: 'Failed to attach book', details: err instanceof Error ? err.message : 'Unknown' },
      { status: 500 },
    );
  }
}
