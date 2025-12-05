import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/services/ai-service';
import { ensureDemoUser, updateBook } from '@/lib/db/operations';
import { put } from '@vercel/blob';
import { CoverService } from '@/lib/services/cover-service';
import { 
  CoverTextCustomization, 
  CoverTypographyOptions, 
  CoverLayoutOptions, 
  CoverVisualOptions 
} from '@/lib/types/cover';

export const maxDuration = 60; // 1 minute for image generation

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      bookId, 
      title, 
      author, 
      genre, 
      description, 
      style, 
      imageModel,
      // New customization options
      textCustomization,
      typographyOptions,
      layoutOptions,
      visualOptions,
      customPrompt,
      referenceStyle,
      themes,
      targetAudience,
    } = body as {
      userId: string;
      bookId?: number;
      title: string;
      author: string;
      genre: string;
      description: string;
      style?: string;
      imageModel?: string;
      // New customization types
      textCustomization?: CoverTextCustomization;
      typographyOptions?: CoverTypographyOptions;
      layoutOptions?: CoverLayoutOptions;
      visualOptions?: CoverVisualOptions;
      customPrompt?: string;
      referenceStyle?: string;
      themes?: string[];
      targetAudience?: string;
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

    console.log(`Generating cover for "${title}" by ${author}${bookId ? ` (bookId: ${bookId})` : ''}`);

    // Check if we have enhanced customization options
    const hasCustomization = textCustomization || typographyOptions || layoutOptions || visualOptions || customPrompt;
    
    let customEnhancedPrompt: string | undefined;
    
    if (hasCustomization) {
      // Generate enhanced prompt using the CoverService
      customEnhancedPrompt = CoverService.generateEnhancedAIPrompt({
        bookId,
        title,
        author,
        genre,
        description,
        targetAudience: targetAudience || '',
        themes,
        textCustomization,
        typographyOptions,
        layoutOptions,
        visualOptions,
        customPrompt,
        referenceStyle,
      });
      
      console.log('Using enhanced cover customization');
    }

    // Generate cover using selected image model (default: Nano Banana Pro)
    const tempUrl = await aiService.generateCoverImage(
      title,
      author,
      genre,
      description,
      style || 'photographic',
      imageModel,
      customEnhancedPrompt // Pass the enhanced prompt if available
    );

    // Download the image and upload to permanent storage (Vercel Blob)
    let permanentUrl = tempUrl;
    
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        console.log('Downloading generated image to upload to Blob storage...');
        const imageResponse = await fetch(tempUrl);
        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer();
          const buffer = Buffer.from(imageBuffer);
          
          // Generate filename
          const sanitizedTitle = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 100);
          
          const filename = `book-covers/${sanitizedTitle}-${bookId || Date.now()}.png`;
          
          console.log(`Uploading cover to Vercel Blob: ${filename}`);
          const blob = await put(filename, buffer, {
            access: 'public',
            contentType: 'image/png',
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });
          
          permanentUrl = blob.url;
          console.log('Cover uploaded to Blob storage:', permanentUrl);
        }
      } catch (uploadError) {
        console.error('Failed to upload to Blob storage, using temp URL:', uploadError);
        // Continue with temp URL if blob upload fails
      }
    }

    // If bookId provided, update the book in the database
    if (bookId) {
      try {
        await updateBook(bookId, { coverUrl: permanentUrl });
        console.log(`Updated book ${bookId} with cover URL`);
      } catch (updateError) {
        console.error('Failed to update book with cover URL:', updateError);
        // Don't fail the request, just log the error
      }
    }

    console.log('Cover generated successfully');

    return NextResponse.json({
      success: true,
      coverUrl: permanentUrl,
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
