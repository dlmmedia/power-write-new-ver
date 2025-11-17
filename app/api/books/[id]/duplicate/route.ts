import { NextRequest, NextResponse } from 'next/server';
import { duplicateBook } from '@/lib/db/operations';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id, 10);
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const newBook = await duplicateBook(bookId, userId);

    if (!newBook) {
      return NextResponse.json(
        { error: 'Book not found or could not be duplicated' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      book: newBook,
      message: 'Book duplicated successfully'
    });
  } catch (error) {
    console.error('Error duplicating book:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate book' },
      { status: 500 }
    );
  }
}



