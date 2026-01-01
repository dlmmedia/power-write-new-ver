import { NextRequest, NextResponse } from 'next/server';
import { BookImageService } from '@/lib/services/book-image-service';
import { ensureDemoUser } from '@/lib/db/operations';
import { GenerateBookImageRequest } from '@/lib/types/book-images';
import { DEFAULT_IMAGE_MODEL } from '@/lib/types/models';

export const maxDuration = 60; // 1 minute for image generation

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      bookId,
      chapterId,
      bookTitle,
      bookGenre,
      chapterTitle,
      chapterContent,
      imageType,
      style,
      customPrompt,
      contextBefore,
      contextAfter,
      placement,
      aspectRatio,
      imageModel,
    } = body as GenerateBookImageRequest & {
      userId: string;
      imageModel?: string;
    };

    // Validate required fields
    if (!userId || !bookId || !bookTitle || !bookGenre || !imageType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, bookId, bookTitle, bookGenre, imageType' },
        { status: 400 }
      );
    }

    // Ensure demo user exists
    await ensureDemoUser(userId);

    console.log(`[API] Generating book image for: ${bookTitle} (${imageType})`);

    // Create image service with specified model
    const imageService = new BookImageService(imageModel || DEFAULT_IMAGE_MODEL);

    // Generate the image
    const result = await imageService.generateImage({
      bookId,
      chapterId,
      bookTitle,
      bookGenre,
      chapterTitle,
      chapterContent,
      imageType,
      style,
      customPrompt,
      contextBefore,
      contextAfter,
      placement,
      aspectRatio,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate image' },
        { status: 500 }
      );
    }

    console.log('[API] Book image generated successfully');

    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      thumbnailUrl: result.thumbnailUrl,
      prompt: result.prompt,
      caption: result.caption,
      altText: result.altText,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error('[API] Error generating book image:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate book image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
