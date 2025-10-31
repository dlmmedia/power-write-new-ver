import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/services/ai-service';
import { db } from '@/lib/db';
import { generatedBooks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
    const coverUrl = await aiService.generateCoverImage(
      book.title,
      book.author || 'Unknown Author',
      book.genre || 'Fiction',
      book.summary || book.title,
      'vivid'
    );

    // Update book with cover URL
    await db
      .update(generatedBooks)
      .set({ 
        coverUrl: coverUrl,
        updatedAt: new Date()
      })
      .where(eq(generatedBooks.id, bookId));

    console.log(`Cover generated successfully for book ${bookId}`);

    return NextResponse.json({
      success: true,
      coverUrl: coverUrl
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
