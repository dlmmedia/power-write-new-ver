import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/services/ai-service';
import { ensureDemoUser } from '@/lib/db/operations';

export const maxDuration = 60; // 1 minute for image generation

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, author, genre, description, style } = body as {
      userId: string;
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

    console.log(`Generating cover for "${title}" by ${author}`);

    // Generate cover using Google Imagen
    const coverImageUrl = await aiService.generateCoverImage(
      title,
      author,
      genre,
      description,
      style || 'photographic'
    );

    console.log('Cover generated successfully');

    return NextResponse.json({
      success: true,
      coverUrl: coverImageUrl,
    });
  } catch (error) {
    console.error('Error generating cover:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate cover', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
