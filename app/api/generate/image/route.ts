import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/services/ai-service';
import { ensureDemoUser, updateBook } from '@/lib/db/operations';

export const maxDuration = 60; // 1 minute for image generation

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, bookId, title, author, genre, description, style } = body as {
      userId: string;
      bookId?: number;
      title: string;
      author: string;
      genre: string;
      description: string;
      style?: string;
    };

    // Validate required fields
    if (!userId || !title || !author || !genre || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, author, genre, description' },
        { status: 400 }
      );
    }

    // Ensure demo user exists
    await ensureDemoUser(userId);

    console.log(`Generating cover image for: ${title}`);

    // Generate cover image
    const coverImageUrl = await aiService.generateCoverImage(
      title,
      author,
      genre,
      description,
      style || 'photographic'
    );

    // If bookId provided, update the book with the cover URL
    if (bookId) {
      await updateBook(bookId, {
        coverUrl: coverImageUrl,
      });
      console.log(`Updated book ${bookId} with cover image`);
    }

    console.log('Cover image generated successfully');

    return NextResponse.json({
      success: true,
      coverUrl: coverImageUrl,
    });
  } catch (error) {
    console.error('Error generating cover image:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate cover image', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
