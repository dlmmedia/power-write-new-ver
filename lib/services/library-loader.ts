/**
 * Shared loader for the library view (`/library` page + `/api/books`).
 *
 * Combines the user lookup, tier resolution, books query, and chapter/audio
 * stats into the smallest possible number of DB round-trips:
 *
 *   1) resolveUserIdAndTier    — 1 round-trip (two parallel SELECTs on users)
 *   2) getUserBooksWithStats / — 2 sequential queries (books, then chapters
 *      getAllBooksWithStats      filtered by those book ids)
 *
 * Total: 3 round-trips, with the auth lookup parallelized internally.
 *
 * Previously /api/books did:
 *   getDbUserIdFromClerk (1-2 queries)
 *   → getUserTier (1-2 queries)
 *   → getUserBooks (1 query)
 *   → getBooksAudioStats (1 query)
 * = 4-6 sequential round-trips.
 *
 * On the new neon-serverless Pool driver each round-trip is ~50-100ms over
 * websockets, so this collapse alone shaves ~200-400ms off /library first paint.
 */

import {
  resolveUserIdAndTier,
  type UserTier,
} from '@/lib/services/user-service';
import {
  getUserBooksWithStats,
  getAllBooksWithStats,
} from '@/lib/db/operations';
import { isBlockedBookTitle } from '@/lib/utils/blocked-book-titles';
import type { GeneratedBook } from '@/lib/db/schema';

export interface LibraryBook {
  id: number;
  title: string;
  author: string;
  genre: string;
  subgenre: string;
  status: string;
  productionStatus: string;
  coverUrl?: string;
  createdAt: string;
  isOwner: boolean;
  isPublic: boolean;
  seriesId: number | null;
  seriesNumber: number | null;
  metadata: {
    wordCount: number;
    chapters: number;
    targetWordCount: number;
    description: string;
    modelUsed?: string;
  };
  audioStats: {
    chaptersWithAudio: number;
    totalChapters: number;
    totalDuration: number;
  } | null;
  // Only present for owner of a book that's currently generating, so the
  // resume button on the library card can drive /api/generate/book-incremental.
  outline?: unknown;
  config?: unknown;
}

export interface LibraryLoad {
  books: LibraryBook[];
  count: number;
  tier: UserTier;
  effectiveUserId: string;
  clerkUserId: string;
}

type BookWithStats = GeneratedBook & {
  _chapterCount: number;
  _wordCount: number;
  _audioStats: {
    chaptersWithAudio: number;
    totalChapters: number;
    totalDuration: number;
  } | null;
};

/**
 * Format a row from getUserBooksWithStats / getAllBooksWithStats into the shape
 * the library UI expects. Pure function — no IO.
 */
function formatBook(
  book: BookWithStats,
  clerkUserId: string,
  effectiveUserId: string,
): LibraryBook {
  const metadata = (book.metadata as Record<string, unknown> | null) || {};
  const isOwner =
    book.userId === clerkUserId || book.userId === effectiveUserId;

  // Prefer DB-aggregated counts (truth) over the snapshot in metadata. The
  // metadata snapshot is updated lazily and can be stale right after a
  // chapter is added.
  const chapterCount = book._chapterCount || (metadata.chapters as number) || 0;
  const wordCount = book._wordCount || (metadata.wordCount as number) || 0;

  const out: LibraryBook = {
    id: book.id,
    title: book.title || 'Untitled',
    author: book.author || 'Unknown',
    genre: book.genre || 'General Fiction',
    subgenre: '',
    status: book.status || 'in-progress',
    productionStatus: book.productionStatus || 'draft',
    coverUrl: book.coverUrl || undefined,
    createdAt: book.createdAt?.toISOString() || new Date().toISOString(),
    isOwner,
    isPublic: book.isPublic || false,
    seriesId: book.seriesId ?? null,
    seriesNumber: book.seriesNumber ?? null,
    metadata: {
      wordCount,
      chapters: chapterCount,
      targetWordCount: (metadata.targetWordCount as number) || 0,
      description: book.summary || '',
      modelUsed: (metadata.modelUsed as string) || undefined,
    },
    audioStats: book._audioStats,
  };

  // Only owners of in-flight books need the outline/config payloads (the
  // library "Continue generation" flow sends them back into the API). For
  // every other case omit them — they're large JSON blobs.
  if (book.status === 'generating' && isOwner) {
    out.outline = book.outline ?? null;
    out.config = book.config ?? null;
  }

  return out;
}

/**
 * Single entry-point for "give me everything needed to render the library
 * page for this Clerk user."
 *
 * Throws on hard failures (DB down, etc) — caller decides whether to swallow
 * or surface. Does NOT swallow into [].
 */
export async function loadLibrary(
  clerkUserId: string,
  email?: string,
): Promise<LibraryLoad> {
  const { effectiveUserId, tier } = await resolveUserIdAndTier(
    clerkUserId,
    email,
  );

  const rawBooks =
    tier === 'pro'
      ? await getAllBooksWithStats()
      : await getUserBooksWithStats(effectiveUserId);

  const visibleBooks = rawBooks.filter((b) => !isBlockedBookTitle(b.title));

  const books = visibleBooks.map((b) =>
    formatBook(b as BookWithStats, clerkUserId, effectiveUserId),
  );

  return {
    books,
    count: books.length,
    tier,
    effectiveUserId,
    clerkUserId,
  };
}
