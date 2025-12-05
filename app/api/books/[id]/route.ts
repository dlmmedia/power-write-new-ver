import { NextRequest, NextResponse } from 'next/server';
import { getBookWithChapters } from '@/lib/db/operations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params;

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
      subgenre: '',
      status: bookWithChapters.status,
      coverUrl: bookWithChapters.coverUrl || undefined, // Include cover URL
      backCoverUrl: metadata.backCoverUrl || undefined, // Include back cover URL from metadata
      createdAt: bookWithChapters.createdAt?.toISOString() || new Date().toISOString(),
      metadata: {
        wordCount: metadata.wordCount || 0,
        chapters: bookWithChapters.chapters.length,
        targetWordCount: metadata.targetWordCount || 0,
        description: bookWithChapters.summary || '',
        backCoverUrl: metadata.backCoverUrl || undefined, // Also include in metadata for reference
      },
      chapters: bookWithChapters.chapters.map(ch => ({
        id: ch.id,
        number: ch.chapterNumber,
        title: ch.title,
        content: ch.content,
        wordCount: ch.wordCount || 0,
        status: ch.isEdited ? 'edited' : 'draft',
        audioUrl: ch.audioUrl || null,
        audioDuration: ch.audioDuration || null,
        audioMetadata: ch.audioMetadata || null,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id, 10);
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id, 10);

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
