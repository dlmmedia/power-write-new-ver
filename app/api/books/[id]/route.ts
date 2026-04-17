import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getBook, updateBook, deleteBook } from '@/lib/db/operations';
import { getDbUserIdFromClerk } from '@/lib/services/user-service';
import { ApiErrors, apiError } from '@/lib/api/error';
import { loadBookDetail } from '@/lib/services/book-detail-loader';

export const runtime = 'nodejs';

function parseBookId(id: string): number {
  const n = parseInt(id, 10);
  if (!Number.isFinite(n) || n <= 0) {
    throw ApiErrors.badRequest('Invalid book id');
  }
  return n;
}

/**
 * Resolve auth context. Returns null when no user is logged in (allowed for
 * GET on public showcase scenarios). Throws on Clerk failures so they surface.
 */
async function tryGetUser() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return null;
    let email: string | undefined;
    try {
      const u = await currentUser();
      email = u?.emailAddresses?.[0]?.emailAddress;
    } catch {
      /* email is best-effort */
    }
    const dbUserId = await getDbUserIdFromClerk(clerkUserId, email);
    return { clerkUserId, email, effectiveUserId: dbUserId || clerkUserId };
  } catch (e) {
    console.warn('[api/books/[id]] auth resolution failed:', e);
    return null;
  }
}

/** Strict variant: throws unauthorized when no user. */
async function requireUser() {
  const ctx = await tryGetUser();
  if (!ctx) throw ApiErrors.unauthorized();
  return ctx;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseBookId(id);

    const ctx = await tryGetUser();
    const book = await loadBookDetail(bookId, {
      clerkUserId: ctx?.clerkUserId ?? null,
      effectiveUserId: ctx?.effectiveUserId ?? null,
    });
    if (!book) throw ApiErrors.notFound('Book not found');

    return NextResponse.json({ success: true, book });
  } catch (error) {
    return apiError(error);
  }
}

const UpdateBookSchema = z
  .object({
    title: z.string().min(1).max(500).optional(),
    author: z.string().min(1).max(200).optional(),
    genre: z.string().max(100).optional(),
    summary: z.string().max(20_000).optional(),
    status: z.string().max(50).optional(),
    productionStatus: z.string().max(50).optional(),
    coverUrl: z.string().url().nullable().optional(),
    isPublic: z.boolean().optional(),
    seriesId: z.number().int().positive().nullable().optional(),
    seriesNumber: z.number().int().positive().nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    config: z.record(z.string(), z.unknown()).optional(),
    outline: z.unknown().optional(),
  })
  .strict();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseBookId(id);
    const ctx = await requireUser();

    const existing = await getBook(bookId);
    if (!existing) throw ApiErrors.notFound('Book not found');

    // SECURITY TODO (deferred): add per-user ownership check once the legacy
    // demo-user-001 / multi-clerk-id situation is resolved. For now we only
    // require an authenticated session — the prior code required nothing.
    void ctx;

    const updates = UpdateBookSchema.parse(await request.json());

    const updatedBook = await updateBook(bookId, updates as Parameters<typeof updateBook>[1]);
    if (!updatedBook) throw ApiErrors.notFound('Book not found');

    return NextResponse.json({ success: true, book: updatedBook });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseBookId(id);
    const ctx = await requireUser();

    const existing = await getBook(bookId);
    if (!existing) throw ApiErrors.notFound('Book not found');

    // SECURITY TODO (deferred): add per-user ownership check once the legacy
    // demo-user-001 / multi-clerk-id situation is resolved. For now we only
    // require an authenticated session — the prior code required nothing.
    void ctx;

    await deleteBook(bookId);
    return NextResponse.json({ success: true, message: 'Book deleted successfully' });
  } catch (error) {
    return apiError(error);
  }
}
