import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/services/ai-service';
import { ensureDemoUser, updateBook, getBook } from '@/lib/db/operations';

export const maxDuration = 60; // 1 minute for image generation

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, bookId, title, author, genre, description, style, imageModel } = body as {
      userId: string;
      bookId?: number;
      title: string;
      author: string;
      genre: string;
      description: string;
      style?: string;
      imageModel?: string;
    };

    // Validate required fields
    if (!userId || !title || !genre || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, genre, description' },
        { status: 400 }
      );
    }

    // Ensure demo user exists
    await ensureDemoUser(userId);

    console.log(`Generating BACK cover for "${title}"${bookId ? ` (bookId: ${bookId})` : ''}`);

    // Generate back cover using selected image model (default: Nano Banana Pro)
    const coverUrl = await aiService.generateBackCoverImage(
      title,
      author || 'PowerWrite',
      genre,
      description,
      style || 'photographic',
      imageModel
    );

    console.log('Back cover generated successfully');

    // If bookId is provided, save the back cover URL in the metadata field (JSON)
    // Note: backCoverUrl column not yet in database, storing in metadata for now
    if (bookId) {
      const book = await getBook(bookId);
      if (book) {
        const currentMetadata = (book.metadata as any) || {};
        await updateBook(bookId, { 
          metadata: { 
            ...currentMetadata, 
            backCoverUrl: coverUrl 
          } 
        });
        console.log(`Back cover URL saved to book ${bookId} metadata`);
      }
    }

    return NextResponse.json({
      success: true,
      coverUrl,
      metadata: {
        type: 'back-cover',
        title,
        genre,
        generatedAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error generating back cover:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate back cover', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

