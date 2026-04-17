import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getDbUserIdFromClerk } from '@/lib/services/user-service';
import {
  getBook,
  getSeriesById,
  attachBookToSeries,
  detachBookFromSeries,
  createSeries,
} from '@/lib/db/operations';
import { buildSharedConfigFromBook } from '@/lib/utils/apply-series-defaults';
import type { BookConfiguration } from '@/lib/types/studio';
import {
  LOCKABLE_SERIES_FIELDS,
  type LockableSeriesField,
} from '@/lib/types/series';

export const runtime = 'nodejs';

const VALID_LOCK_FIELDS = new Set<string>(LOCKABLE_SERIES_FIELDS);

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

function parseId(id: string): number | null {
  const n = parseInt(id, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * PUT — attach (or detach) a book to/from an existing series.
 * Body: { seriesId: number | null, seriesNumber?: number }
 * Pass `seriesId: null` to detach.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getEffectiveUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const bookId = parseId(id);
    if (!bookId) {
      return NextResponse.json({ error: 'Invalid book id' }, { status: 400 });
    }

    const book = await getBook(bookId);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }
    if (book.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Detach
    if (body?.seriesId === null) {
      const updated = await detachBookFromSeries(bookId);
      return NextResponse.json({ success: true, book: updated });
    }

    const seriesId = Number(body?.seriesId);
    if (!Number.isFinite(seriesId) || seriesId <= 0) {
      return NextResponse.json({ error: 'seriesId is required' }, { status: 400 });
    }

    const series = await getSeriesById(seriesId);
    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }
    if (series.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const seriesNumber =
      body?.seriesNumber !== undefined && Number.isFinite(Number(body.seriesNumber))
        ? Math.max(1, Number(body.seriesNumber))
        : undefined;

    const updated = await attachBookToSeries(bookId, seriesId, seriesNumber);
    return NextResponse.json({ success: true, book: updated });
  } catch (err) {
    console.error('Error updating book series:', err);
    return NextResponse.json(
      { error: 'Failed to update series link', details: err instanceof Error ? err.message : 'Unknown' },
      { status: 500 },
    );
  }
}

/**
 * POST — promote this book to a new series.
 * Body: { name: string, description?, lockedFields?: LockableSeriesField[] }
 * Creates a new series seeded from this book's config and attaches the book as #1.
 */
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
    const bookId = parseId(id);
    if (!bookId) {
      return NextResponse.json({ error: 'Invalid book id' }, { status: 400 });
    }

    const book = await getBook(bookId);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }
    if (book.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'Series name is required' }, { status: 400 });
    }

    const lockedFields: LockableSeriesField[] = Array.isArray(body?.lockedFields)
      ? (body.lockedFields.filter(
          (f: unknown) => typeof f === 'string' && VALID_LOCK_FIELDS.has(f as string),
        ) as LockableSeriesField[])
      : [];

    const sharedConfig = book.config
      ? buildSharedConfigFromBook(book.config as BookConfiguration)
      : null;

    const series = await createSeries({
      userId,
      name,
      description: typeof body?.description === 'string' ? body.description : null,
      coverUrl: book.coverUrl ?? null,
      sharedConfig,
      lockedFields,
      status: 'ongoing',
      isPublic: false,
    });

    const updated = await attachBookToSeries(bookId, series.id, 1);

    return NextResponse.json({ success: true, series, book: updated }, { status: 201 });
  } catch (err) {
    console.error('Error promoting book to series:', err);
    return NextResponse.json(
      { error: 'Failed to promote book', details: err instanceof Error ? err.message : 'Unknown' },
      { status: 500 },
    );
  }
}
