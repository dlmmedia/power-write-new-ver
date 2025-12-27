import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generatedBooks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { put } from '@vercel/blob';

export const maxDuration = 30;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id);

    if (isNaN(bookId)) {
      return NextResponse.json(
        { error: 'Invalid book ID' },
        { status: 400 }
      );
    }

    // Get the form data with the uploaded file
    const formData = await request.formData();
    const file = formData.get('cover') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Get book from database to verify it exists
    const [book] = await db
      .select()
      .from(generatedBooks)
      .where(eq(generatedBooks.id, bookId))
      .limit(1);

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine file extension
    const ext = file.type.split('/')[1] || 'png';

    // Generate filename
    const sanitizedTitle = book.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);

    const filename = `book-covers/${sanitizedTitle}-${bookId}-custom.${ext}`;

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: 'Server not configured for file uploads. Missing BLOB_READ_WRITE_TOKEN.' },
        { status: 500 }
      );
    }

    console.log(`Uploading custom cover for book ${bookId}: ${filename}`);
    
    // Upload to Vercel Blob Storage
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Update book with the new cover URL
    await db
      .update(generatedBooks)
      .set({
        coverUrl: blob.url,
        updatedAt: new Date()
      })
      .where(eq(generatedBooks.id, bookId));

    console.log(`Custom cover uploaded successfully for book ${bookId}: ${blob.url}`);

    return NextResponse.json({
      success: true,
      coverUrl: blob.url
    });

  } catch (error) {
    console.error('Error uploading cover:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload cover',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


















