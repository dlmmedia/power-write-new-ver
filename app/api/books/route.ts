import { NextRequest, NextResponse } from 'next/server';
import { getUserBooks, ensureDemoUser } from '@/lib/db/operations';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Ensure user exists
    await ensureDemoUser(userId);

    // Get user's books from database
    const userBooks = await getUserBooks(userId);

    // Format books for response
    const books = userBooks.map(book => {
      const metadata = book.metadata as any || {};
      return {
        id: book.id,
        title: book.title,
        author: book.author,
        genre: book.genre,
        subgenre: '',
        status: book.status,
        coverUrl: book.coverUrl || undefined,
        createdAt: book.createdAt?.toISOString() || new Date().toISOString(),
        metadata: {
          wordCount: metadata.wordCount || 0,
          chapters: metadata.chapters || 0,
          targetWordCount: metadata.targetWordCount || 0,
          description: book.summary || '',
        },
      };
    });

    return NextResponse.json({
      success: true,
      books,
      count: books.length
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
    const body = await request.json();
    const { userId, title, author, genre, subgenre, description, targetWordCount, chapters } = body;

    if (!userId || !title || !author) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { createBook, ensureDemoUser } = await import('@/lib/db/operations');
    
    // Ensure user exists
    await ensureDemoUser(userId);

    // Create book in database
    const newBook = await createBook({
      userId,
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
