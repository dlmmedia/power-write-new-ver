import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getBook, toggleBookPublic } from '@/lib/db/operations';

export const runtime = 'nodejs';

// POST /api/books/[id]/showcase - Add book to showcase
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const bookId = parseInt(id, 10);

    if (isNaN(bookId)) {
      return NextResponse.json(
        { error: 'Invalid book ID' },
        { status: 400 }
      );
    }

    // Get the book
    const book = await getBook(bookId);

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Only allow completed books to be showcased
    if (book.status !== 'completed') {
      return NextResponse.json(
        { error: 'Only completed books can be added to the showcase' },
        { status: 400 }
      );
    }

    // Toggle to public
    const updatedBook = await toggleBookPublic(bookId, true);

    return NextResponse.json({
      success: true,
      message: 'Book added to showcase',
      book: {
        id: updatedBook?.id,
        isPublic: updatedBook?.isPublic,
      },
    });
  } catch (error) {
    console.error('Error adding book to showcase:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to add book to showcase', details: message },
      { status: 500 }
    );
  }
}

// DELETE /api/books/[id]/showcase - Remove book from showcase
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const bookId = parseInt(id, 10);

    if (isNaN(bookId)) {
      return NextResponse.json(
        { error: 'Invalid book ID' },
        { status: 400 }
      );
    }

    // Get the book
    const book = await getBook(bookId);

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Toggle to private
    const updatedBook = await toggleBookPublic(bookId, false);

    return NextResponse.json({
      success: true,
      message: 'Book removed from showcase',
      book: {
        id: updatedBook?.id,
        isPublic: updatedBook?.isPublic,
      },
    });
  } catch (error) {
    console.error('Error removing book from showcase:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to remove book from showcase', details: message },
      { status: 500 }
    );
  }
}
