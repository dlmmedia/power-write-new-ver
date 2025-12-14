import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserTier, getAllBooks } from '@/lib/services/user-service';

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

    // Get user tier
    const tier = await getUserTier(clerkUserId);

    // Both tiers can view all books (shared library)
    // Free tier is limited to generating only 1 book, but can view all
    const userBooks = await getAllBooks();

    // Format books for response
    const books = userBooks.map(book => {
      const metadata = book.metadata as any || {};
      const bookData: any = {
        id: book.id,
        title: book.title,
        author: book.author,
        genre: book.genre,
        subgenre: '',
        status: book.status,
        coverUrl: book.coverUrl || undefined,
        createdAt: book.createdAt?.toISOString() || new Date().toISOString(),
        isOwner: book.userId === clerkUserId,
        metadata: {
          wordCount: metadata.wordCount || 0,
          chapters: metadata.chapters || 0,
          targetWordCount: metadata.targetWordCount || 0,
          description: book.summary || '',
          modelUsed: metadata.modelUsed || undefined,
        },
      };
      
      // Include outline and config for books still being generated (needed for resume)
      // Only for books the user owns
      if (book.status === 'generating' && book.userId === clerkUserId) {
        bookData.outline = book.outline;
        bookData.config = book.config;
      }
      
      return bookData;
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
