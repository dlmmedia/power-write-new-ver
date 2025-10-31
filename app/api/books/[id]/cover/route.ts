import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/services/ai-service';
import { db } from '@/lib/db';
import { generatedBooks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { put } from '@vercel/blob';

export const maxDuration = 60;

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

    // Get book from database
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

    console.log(`Generating cover for book ${bookId}: ${book.title}`);

    // Generate cover
    const tempUrl = await aiService.generateCoverImage(
      book.title,
      book.author || 'Unknown Author',
      book.genre || 'Fiction',
      book.summary || book.title,
      'vivid'
    );

    // Download the image from OpenAI's temporary URL
    const imageResponse = await fetch(tempUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download generated image');
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);
    
    // Upload to Vercel Blob Storage
    const sanitizedTitle = book.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
    
    const filename = `book-covers/${sanitizedTitle}-${bookId}.png`;
    
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN is not configured. Cannot upload cover image.');
    }
    
    console.log(`Uploading cover to Vercel Blob: ${filename}`);
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: 'image/png',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Update book with permanent blob URL
    await db
      .update(generatedBooks)
      .set({ 
        coverUrl: blob.url,
        updatedAt: new Date()
      })
      .where(eq(generatedBooks.id, bookId));

    console.log(`Cover generated successfully for book ${bookId}`);

    return NextResponse.json({
      success: true,
      coverUrl: blob.url
    });

  } catch (error) {
    console.error('Error generating cover:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate cover',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
