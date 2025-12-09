import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/services/ai-service';
import { ensureDemoUser, updateBook, getBook } from '@/lib/db/operations';

export const maxDuration = 60; // 1 minute for image generation

// Back cover options interface
interface BackCoverOptions {
  showBarcode?: boolean;
  barcodeType?: 'isbn' | 'qr' | 'none';
  layout?: 'classic' | 'modern' | 'minimal' | 'editorial';
  showWebsite?: boolean;
  showTagline?: boolean;
  matchFrontCover?: boolean;
}

interface FrontCoverStyle {
  colorScheme?: string;
  style?: string;
  visualOptions?: {
    colorScheme?: string;
    customColors?: {
      primary: string;
      secondary: string;
      accent: string;
      text: string;
      background?: string;
    };
  };
}

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
      showPowerWriteBranding = true,
      hideAuthorName = false,
      backCoverOptions,
      frontCoverStyle
    } = body as {
      userId: string;
      bookId?: number;
      title: string;
      author: string;
      genre: string;
      description: string;
      style?: string;
      imageModel?: string;
      showPowerWriteBranding?: boolean;
      hideAuthorName?: boolean;
      backCoverOptions?: BackCoverOptions;
      frontCoverStyle?: FrontCoverStyle;
    };

    // Validate required fields
    if (!userId || !title || !genre || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, genre, description' },
        { status: 400 }
      );
    }

    console.log(`Generating BACK cover for "${title}"${bookId ? ` (bookId: ${bookId})` : ''}`);
    console.log('Back cover options:', backCoverOptions);
    console.log('Show PowerWrite branding:', showPowerWriteBranding, 'Hide author:', hideAuthorName);

    // Try to ensure demo user exists, but don't fail if database is unavailable
    try {
      await ensureDemoUser(userId);
    } catch (dbError) {
      console.warn('Could not ensure demo user (database may be unavailable):', dbError instanceof Error ? dbError.message : 'Unknown error');
      // Continue with cover generation - it doesn't strictly require user validation
    }

    // Determine the author name to display
    const displayAuthor = hideAuthorName 
      ? '' 
      : (showPowerWriteBranding ? 'PowerWrite' : (author || ''));

    // Generate back cover using selected image model (default: Nano Banana Pro)
    const coverUrl = await aiService.generateBackCoverImage(
      title,
      displayAuthor,
      genre,
      description,
      style || frontCoverStyle?.style || 'photographic',
      imageModel,
      {
        ...backCoverOptions,
        showPowerWriteBranding,
        frontCoverStyle: backCoverOptions?.matchFrontCover !== false ? frontCoverStyle : undefined
      }
    );

    console.log('Back cover generated successfully');

    // If bookId is provided, save the back cover URL in the metadata field (JSON)
    // Note: backCoverUrl column not yet in database, storing in metadata for now
    if (bookId) {
      try {
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
      } catch (dbError) {
        console.warn('Could not save back cover URL to database:', dbError instanceof Error ? dbError.message : 'Unknown error');
        // Continue - the cover was still generated successfully
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

