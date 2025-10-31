import { NextRequest, NextResponse } from 'next/server';
import { googleBooksService } from '@/lib/services/google-books';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params;

    if (!bookId) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      );
    }

    console.log('[API] Fetching Google Books details for ID:', bookId);

    const book = await googleBooksService.getBookDetails(bookId);

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    console.log('[API] Book details fetched successfully:', book.title);

    return NextResponse.json({ book });
  } catch (error) {
    console.error('[API] ERROR in book details API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch book details' },
      { status: 500 }
    );
  }
}
