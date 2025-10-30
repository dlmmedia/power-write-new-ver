import { NextRequest, NextResponse } from 'next/server';
import { getBookWithChapters } from '@/lib/db/operations';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookId = params.id;

    // Get book with all chapters from database
    const bookWithChapters = await getBookWithChapters(bookId);

    if (!bookWithChapters) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Format the response
    const metadata = bookWithChapters.metadata as any || {};
    const book = {
      id: bookWithChapters.id,
      title: bookWithChapters.title,
      author: bookWithChapters.author,
      genre: bookWithChapters.genre,
      subgenre: bookWithChapters.subgenre || '',
      status: bookWithChapters.status,
      createdAt: bookWithChapters.createdAt.toISOString(),
      metadata: {
        wordCount: metadata.wordCount || 0,
        chapters: bookWithChapters.chapters.length,
        targetWordCount: metadata.targetWordCount || 0,
        description: bookWithChapters.description || '',
      },
      chapters: bookWithChapters.chapters.map(ch => ({
        id: ch.id,
        number: ch.chapterNumber,
        title: ch.title,
        content: ch.content,
        wordCount: ch.wordCount || 0,
        status: ch.status,
      })),
    };

    return NextResponse.json({
      success: true,
      book
    });
  } catch (error) {
    console.error('Error fetching book detail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch book details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookId = parseInt(params.id, 10);
    const updates = await request.json();

    const { updateBook } = await import('@/lib/db/operations');
    const updatedBook = await updateBook(bookId, updates);

    if (!updatedBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      book: updatedBook
    });
  } catch (error) {
    console.error('Error updating book:', error);
    return NextResponse.json(
      { error: 'Failed to update book' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookId = parseInt(params.id, 10);

    const { deleteBook, getBook } = await import('@/lib/db/operations');
    const book = await getBook(bookId);

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    await deleteBook(bookId);

    return NextResponse.json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json(
      { error: 'Failed to delete book' },
      { status: 500 }
    );
  }
}
