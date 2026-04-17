import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { canGenerateBook } from '@/lib/services/user-service';
import { createBook } from '@/lib/db/operations';
import { loadLibrary } from '@/lib/services/library-loader';
import { ApiError, ApiErrors, apiError } from '@/lib/api/error';

export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw ApiErrors.unauthorized();

    let userEmail: string | undefined;
    try {
      const clerkUser = await currentUser();
      userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;
    } catch (e) {
      // best-effort — falls back to clerk-id-only lookup
      console.warn('[api/books] Could not resolve email from Clerk:', e);
    }

    const { books, count, tier } = await loadLibrary(clerkUserId, userEmail);

    return NextResponse.json({ success: true, books, count, tier });
  } catch (error) {
    return apiError(error);
  }
}

const CreateBookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  author: z.string().min(1, 'Author is required').max(200),
  genre: z.string().max(100).optional(),
  description: z.string().max(10_000).optional(),
  targetWordCount: z.number().int().positive().max(2_000_000).optional(),
  chapters: z.number().int().nonnegative().max(1_000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw ApiErrors.unauthorized();

    const body = CreateBookSchema.parse(await request.json());

    const generationCheck = await canGenerateBook(clerkUserId);
    if (!generationCheck.allowed) {
      throw new ApiError(403, 'Book limit reached', 'book_limit_reached', {
        reason: generationCheck.reason,
        tier: generationCheck.tier,
        booksGenerated: generationCheck.booksGenerated,
        maxBooks: generationCheck.maxBooks,
      });
    }

    const newBook = await createBook({
      userId: clerkUserId,
      title: body.title,
      author: body.author,
      genre: body.genre || 'General Fiction',
      summary: body.description || '',
      status: 'in-progress',
      metadata: {
        wordCount: 0,
        chapters: body.chapters || 0,
        targetWordCount: body.targetWordCount || 80000,
      },
    });

    return NextResponse.json({ success: true, book: newBook });
  } catch (error) {
    return apiError(error);
  }
}
