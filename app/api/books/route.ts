import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserTier, getAllBooks } from '@/lib/services/user-service';
import { getBooksAudioStats } from '@/lib/db/operations';

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

    // Fetch tier and books in parallel for better performance
    let tier: 'free' | 'pro' = 'free';
    let userBooks: Awaited<ReturnType<typeof getAllBooks>> = [];
    
    try {
      // Parallelize tier and books fetch for better performance
      const [tierResult, booksResult] = await Promise.all([
        getUserTier(clerkUserId).catch((err) => {
          console.error('Error getting user tier:', err);
          return 'free' as const;
        }),
        getAllBooks().catch((err) => {
          console.error('Error fetching books from database:', err);
          return [] as Awaited<ReturnType<typeof getAllBooks>>;
        }),
      ]);
      
      tier = tierResult;
      userBooks = booksResult;
    } catch (err) {
      console.error('Error in parallel fetch:', err);
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
        const bookData: any = {
          id: book.id,
          title: book.title || 'Untitled',
          author: book.author || 'Unknown',
          genre: book.genre || 'General Fiction',
          subgenre: '',
          status: book.status || 'in-progress',
          coverUrl: book.coverUrl || undefined,
          createdAt: book.createdAt?.toISOString() || new Date().toISOString(),
          isOwner: book.userId === clerkUserId,
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
        if (book.status === 'generating' && book.userId === clerkUserId) {
          bookData.outline = book.outline || null;
          bookData.config = book.config || null;
        }
        
        return bookData;
      } catch (bookError) {
        // Log individual book errors but continue processing other books
        console.error(`Error formatting book ${book.id}:`, bookError);
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
          isOwner: book.userId === clerkUserId,
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
