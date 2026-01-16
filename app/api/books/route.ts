import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getUserTier, getAllBooks, getDbUserIdFromClerk } from '@/lib/services/user-service';
import { getBooksAudioStats, getUserBooks } from '@/lib/db/operations';
import { isBlockedBookTitle } from '@/lib/utils/blocked-book-titles';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user's email from Clerk for fallback lookup
    let userEmail: string | undefined;
    try {
      const clerkUser = await currentUser();
      userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;
    } catch (e) {
      console.warn('Could not get user email from Clerk:', e);
    }

    // Fetch tier first, then fetch appropriate books.
    // IMPORTANT: Non-Pro users should only see their own books.
    let tier: 'free' | 'pro' = 'free';
    let userBooks: Awaited<ReturnType<typeof getAllBooks>> = [];
    
    try {
      // Get tier using both Clerk ID and email for fallback
      tier = await getUserTier(clerkUserId, userEmail).catch((err) => {
        console.error('Error getting user tier:', err);
        return 'free' as const;
      });

      // Get the actual database user ID (may differ from Clerk ID if using email fallback)
      const dbUserId = await getDbUserIdFromClerk(clerkUserId, userEmail);
      const effectiveUserId = dbUserId || clerkUserId;

      userBooks =
        tier === 'pro'
          ? await getAllBooks().catch((err) => {
              console.error('Error fetching all books from database:', err);
              return [] as Awaited<ReturnType<typeof getAllBooks>>;
            })
          : await getUserBooks(effectiveUserId).catch((err) => {
              console.error('Error fetching user books from database:', err);
              return [] as Awaited<ReturnType<typeof getAllBooks>>;
            });
    } catch (err) {
      console.error('Error fetching tier/books:', err);
    }

    // Hide unwanted/foreign books from the UI (server-side filter)
    userBooks = userBooks.filter((b) => !isBlockedBookTitle(b.title));

    // Get the effective user ID for ownership checks
    let effectiveUserId = clerkUserId;
    try {
      const dbUserId = await getDbUserIdFromClerk(clerkUserId, userEmail);
      if (dbUserId) {
        effectiveUserId = dbUserId;
      }
    } catch (e) {
      // Use clerkUserId as fallback
    }

    // Get audio stats for all books
    let audioStatsMap = new Map<number, { chaptersWithAudio: number; totalChapters: number; totalDuration: number }>();
    if (userBooks.length > 0) {
      try {
        const bookIds = userBooks.map(book => book.id);
        audioStatsMap = await getBooksAudioStats(bookIds);
      } catch (audioError) {
        console.error('Error fetching audio stats:', audioError);
        // Continue without audio stats
      }
    }

    // Format books for response
    const books = userBooks.map(book => {
      try {
        const metadata = (book.metadata as any) || {};
        const audioStats = audioStatsMap.get(book.id);
        // Check ownership against both Clerk ID and effective DB user ID
        const isOwner = book.userId === clerkUserId || book.userId === effectiveUserId;
        const bookData: any = {
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
          metadata: {
            wordCount: metadata.wordCount || 0,
            chapters: metadata.chapters || 0,
            targetWordCount: metadata.targetWordCount || 0,
            description: book.summary || '',
            modelUsed: metadata.modelUsed || undefined,
          },
          audioStats: audioStats ? {
            chaptersWithAudio: audioStats.chaptersWithAudio,
            totalChapters: audioStats.totalChapters,
            totalDuration: audioStats.totalDuration,
          } : null,
        };
        
        // Include outline and config for books still being generated (needed for resume)
        // Only for books the user owns
        if (book.status === 'generating' && isOwner) {
          bookData.outline = book.outline || null;
          bookData.config = book.config || null;
        }
        
        return bookData;
      } catch (bookError) {
        // Log individual book errors but continue processing other books
        console.error(`Error formatting book ${book.id}:`, bookError);
        // Check ownership against both Clerk ID and effective DB user ID
        const isOwner = book.userId === clerkUserId || book.userId === effectiveUserId;
        // Return a minimal valid book object
        return {
          id: book.id,
          title: book.title || 'Untitled',
          author: book.author || 'Unknown',
          genre: book.genre || 'General Fiction',
          subgenre: '',
          status: book.status || 'in-progress',
          coverUrl: undefined,
          createdAt: book.createdAt?.toISOString() || new Date().toISOString(),
          isOwner,
          isPublic: book.isPublic || false,
          metadata: {
            wordCount: 0,
            chapters: 0,
            targetWordCount: 0,
            description: '',
            modelUsed: undefined,
          },
          audioStats: null,
        };
      }
    });

    return NextResponse.json({
      success: true,
      books,
      count: books.length,
      tier,
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      { error: 'Failed to fetch books', details: message, stack },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, author, genre, description, targetWordCount, chapters } = body;

    if (!title || !author) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { createBook } = await import('@/lib/db/operations');
    const { canGenerateBook } = await import('@/lib/services/user-service');
    
    // Check if user can generate a book
    const generationCheck = await canGenerateBook(clerkUserId);
    
    if (!generationCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Book limit reached',
          details: generationCheck.reason,
          tier: generationCheck.tier,
          booksGenerated: generationCheck.booksGenerated,
          maxBooks: generationCheck.maxBooks,
        },
        { status: 403 }
      );
    }

    // Create book in database
    const newBook = await createBook({
      userId: clerkUserId,
      title,
      author,
      genre: genre || 'General Fiction',
      summary: description || '',
      status: 'in-progress',
      metadata: {
        wordCount: 0,
        chapters: chapters || 0,
        targetWordCount: targetWordCount || 80000,
      },
    });

    return NextResponse.json({
      success: true,
      book: newBook
    });
  } catch (error) {
    console.error('Error creating book:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      { error: 'Failed to create book', details: message, stack },
      { status: 500 }
    );
  }
}
