import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/services/ai-service';
import { ensureDemoUser, updateBook } from '@/lib/db/operations';
import { put } from '@vercel/blob';
import { CoverService } from '@/lib/services/cover-service';
import { 
  CoverDesignOptions,
  CoverTextCustomization, 
  CoverTypographyOptions, 
  CoverLayoutOptions, 
  CoverVisualOptions 
} from '@/lib/types/cover';

export const maxDuration = 60; // 1 minute for image generation

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    const safeJsonParse = <T,>(value: FormDataEntryValue | null): T | undefined => {
      if (!value) return undefined;
      if (typeof value !== 'string') return undefined;
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      try {
        return JSON.parse(trimmed) as T;
      } catch {
        return undefined;
      }
    };

    let body: any = {};
    let referenceImageFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      referenceImageFile = (form.get('referenceImage') as File | null) || null;

      body = {
        userId: (form.get('userId') as string) || '',
        bookId: form.get('bookId') ? Number(form.get('bookId')) : undefined,
        title: (form.get('title') as string) || '',
        author: (form.get('author') as string) || '',
        genre: (form.get('genre') as string) || '',
        description: (form.get('description') as string) || '',
        imageModel: (form.get('imageModel') as string) || undefined,
        showPowerWriteBranding: form.get('showPowerWriteBranding')
          ? (form.get('showPowerWriteBranding') as string) === 'true'
          : undefined,
        hideAuthorName: form.get('hideAuthorName')
          ? (form.get('hideAuthorName') as string) === 'true'
          : undefined,
        targetAudience: (form.get('targetAudience') as string) || undefined,
        customPrompt: (form.get('customPrompt') as string) || undefined,
        referenceStyle: (form.get('referenceStyle') as string) || undefined,
        themes: safeJsonParse<string[]>(form.get('themes')),
        designOptions: safeJsonParse<Partial<CoverDesignOptions>>(form.get('designOptions')),
        textCustomization: safeJsonParse<CoverTextCustomization>(form.get('textCustomization')),
        typographyOptions: safeJsonParse<CoverTypographyOptions>(form.get('typographyOptions')),
        layoutOptions: safeJsonParse<CoverLayoutOptions>(form.get('layoutOptions')),
        visualOptions: safeJsonParse<CoverVisualOptions>(form.get('visualOptions')),
      };
    } else {
      body = await request.json();
    }

    const { 
      userId, 
      bookId, 
      title, 
      author, 
      genre, 
      description,
      imageModel,
      showPowerWriteBranding = false, // OFF by default in the UI
      hideAuthorName = false, // Option to hide author name entirely
      // New customization options
      designOptions,
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
      imageModel?: string;
      showPowerWriteBranding?: boolean;
      hideAuthorName?: boolean;
      designOptions?: Partial<CoverDesignOptions>;
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
    const hasCustomization = textCustomization || typographyOptions || layoutOptions || visualOptions || customPrompt || !showPowerWriteBranding || hideAuthorName;
    
    let customEnhancedPrompt: string | undefined;
    
    // Determine the display author based on branding preference and hide option
    const displayAuthor = hideAuthorName 
      ? '' 
      : (showPowerWriteBranding ? 'PowerWrite' : (textCustomization?.customAuthor || author));
    
    if (hasCustomization) {
      // Generate enhanced prompt using the CoverService
      customEnhancedPrompt = CoverService.generateEnhancedAIPrompt({
        bookId,
        title,
        author: displayAuthor,
        genre,
        description,
        targetAudience: targetAudience || '',
        themes,
        textCustomization: {
          ...textCustomization,
          // Override customAuthor based on hideAuthorName and branding settings
          customAuthor: hideAuthorName 
            ? '' 
            : (showPowerWriteBranding ? textCustomization?.customAuthor : (textCustomization?.customAuthor || author)),
        },
        typographyOptions,
        layoutOptions,
        visualOptions,
        customPrompt,
        referenceStyle,
        showPowerWriteBranding,
        hideAuthorName,
      });
      
      console.log('Using enhanced cover customization, PowerWrite branding:', showPowerWriteBranding, 'Hide author:', hideAuthorName);
    }

    // Determine style from either legacy field or designOptions
    const style = designOptions?.style || 'photographic';

    // If provided, upload reference image for vision-capable models
    let referenceImageUrl: string | undefined;
    if (referenceImageFile && referenceImageFile.size > 0) {
      try {
        const fileBuffer = Buffer.from(await referenceImageFile.arrayBuffer());

        if (process.env.BLOB_READ_WRITE_TOKEN) {
          const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 60);
          const refFilename = `cover-references/${safeTitle}-${bookId || Date.now()}-${referenceImageFile.name.replace(/[^a-z0-9.\-_]/gi, '_')}`;

          const blob = await put(refFilename, fileBuffer, {
            access: 'public',
            contentType: referenceImageFile.type || 'image/png',
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });
          referenceImageUrl = blob.url;
          console.log('Reference image uploaded:', referenceImageUrl);
        } else {
          // Fallback to data URL if blob token not available
          const base64 = fileBuffer.toString('base64');
          referenceImageUrl = `data:${referenceImageFile.type || 'image/png'};base64,${base64}`;
          console.log('Using reference image as data URL (no blob token).');
        }
      } catch (refErr) {
        console.error('Failed to process reference image, continuing without it:', refErr);
      }
    }

    // Generate cover using selected image model (default: Nano Banana Pro)
    const generatedCoverUrl = await aiService.generateCoverImage(
      title,
      author,
      genre,
      description,
      style,
      imageModel,
      customEnhancedPrompt, // Pass the enhanced prompt if available
      referenceImageUrl
    );

    // If bookId provided, update the book in the database
    if (bookId) {
      try {
        await updateBook(bookId, { coverUrl: generatedCoverUrl });
        console.log(`Updated book ${bookId} with cover URL`);
      } catch (updateError) {
        console.error('Failed to update book with cover URL:', updateError);
        // Don't fail the request, just log the error
      }
    }

    console.log('Cover generated successfully');

    return NextResponse.json({
      success: true,
      coverUrl: generatedCoverUrl,
      metadata: {
        designVersion: 'cover-studio-v2',
        generatedAt: new Date().toISOString(),
        options: {
          ...(designOptions || {}),
          textCustomization,
          typographyOptions,
          layoutOptions,
          visualOptions,
          customPrompt,
          referenceStyle,
          showPowerWriteBranding,
          hideAuthorName,
        },
        aiPrompt: customEnhancedPrompt,
        imageUrl: generatedCoverUrl,
        dimensions: { width: 1024, height: 1792 },
        format: 'png',
        referenceImageUrl,
        imageModel,
      },
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
