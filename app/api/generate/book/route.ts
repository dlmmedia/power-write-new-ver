import { NextRequest, NextResponse } from 'next/server';
import { AIService, BibliographyGenerationConfig } from '@/lib/services/ai-service';
import { BookImageService } from '@/lib/services/book-image-service';
import { createBook, createMultipleChapters, ensureDemoUser, upsertBibliographyConfig, createBibliographyReference } from '@/lib/db/operations';
import { db } from '@/lib/db';
import { chapterImages, bookChapters } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { BookOutline } from '@/lib/types/generation';
import { sanitizeChapter, countWords } from '@/lib/utils/text-sanitizer';
import { BookConfiguration } from '@/lib/types/studio';
import { DEFAULT_IMAGE_CONFIG } from '@/lib/types/book-images';

export const maxDuration = 900; // 15 minutes - Railway supports up to 15 min HTTP timeout

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, outline, config, modelId } = body as {
      userId: string;
      outline: BookOutline;
      config: BookConfiguration;
      modelId?: string;
    };

    if (!userId || !outline || !config) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, outline, config' },
        { status: 400 }
      );
    }

    // Ensure demo user exists
    await ensureDemoUser(userId);

    // Determine the model to use for chapter generation - PRIORITY ORDER:
    // 1. Explicit modelId param (from API call)
    // 2. User's selected chapterModel in config (from AI Models tab)
    // 3. User's selected model in config
    // 4. Default fallback
    const chapterModel = modelId || (config.aiSettings as any)?.chapterModel || config.aiSettings?.model || 'anthropic/claude-sonnet-4';

    console.log(`[Book] Starting book generation: ${outline.title} (${outline.chapters.length} chapters)`);
    console.log(`[Book] Model Selection Debug:`);
    console.log(`  - modelId param: ${modelId || 'not provided'}`);
    console.log(`  - config.chapterModel: ${(config.aiSettings as any)?.chapterModel || 'not set'}`);
    console.log(`  - config.model: ${config.aiSettings?.model || 'not set'}`);
    console.log(`  - FINAL MODEL: ${chapterModel}`);

    // Create AI service with model selection
    const aiService = new AIService(
      config.aiSettings?.model, // outline model
      chapterModel // chapter model
    );

    // Build bibliography config if enabled
    const bibliographyConfig: BibliographyGenerationConfig | undefined = config.bibliography?.include
      ? {
          enabled: true,
          citationStyle: (config.bibliography.citationStyle as any) || 'APA',
          referenceFormat: config.bibliography.referenceFormat || 'bibliography',
          sourceVerification: config.bibliography.sourceVerification || 'moderate',
        }
      : undefined;

    // Generate all chapters (and bibliography references if enabled)
    const { chapters, references } = await aiService.generateFullBook(
      outline, 
      (current, total) => {
        console.log(`Progress: Chapter ${current}/${total}`);
      },
      chapterModel,
      bibliographyConfig
    );

    // Sanitize all chapters
    const sanitizedChapters = chapters.map((ch) => ({
      ...ch,
      content: sanitizeChapter(ch.content),
      wordCount: countWords(ch.content),
    }));

    // Calculate metadata
    const totalWords = sanitizedChapters.reduce((sum, ch) => sum + ch.wordCount, 0);
    const metadata = {
      wordCount: totalWords,
      pageCount: Math.ceil(totalWords / 250),
      readingTime: Math.ceil(totalWords / 250),
      chapters: sanitizedChapters.length,
      generatedAt: new Date(),
      lastModified: new Date(),
      modelUsed: chapterModel,
    };

    // Generate front cover image automatically (still uses OpenAI DALL-E)
    let coverUrl: string | undefined;
    try {
      console.log('Generating front cover image...');
      coverUrl = await aiService.generateCoverImage(
        outline.title,
        outline.author,
        outline.genre,
        outline.description,
        'vivid'
      );
      console.log('Front cover generated successfully');
    } catch (coverError) {
      console.error('Failed to generate front cover, continuing without:', coverError);
      // Continue without cover - not critical
    }

    // Generate back cover image automatically
    let backCoverUrl: string | undefined;
    try {
      console.log('Generating back cover image...');
      backCoverUrl = await aiService.generateBackCoverImage(
        outline.title,
        outline.author,
        outline.genre,
        outline.description,
        'photographic', // Default style for back cover
        undefined, // use default image model
        { showPowerWriteBranding: false, showTagline: false } // don't show author branding
      );
      console.log('Back cover generated successfully');
    } catch (backCoverError) {
      console.error('Failed to generate back cover, continuing without:', backCoverError);
      // Continue without back cover - not critical
    }

    // Save to database - include backCoverUrl in metadata
    const bookMetadata = {
      ...metadata,
      backCoverUrl: backCoverUrl, // Store back cover URL in metadata
    };

    const book = await createBook({
      userId,
      title: outline.title,
      author: outline.author,
      genre: outline.genre,
      summary: outline.description,
      outline: outline as any,
      config: config as any,
      metadata: bookMetadata as any,
      coverUrl: coverUrl,
      status: 'completed',
    });

    // Save chapters
    const chapterData = sanitizedChapters.map((ch, index) => ({
      bookId: book.id,
      chapterNumber: index + 1,
      title: ch.title,
      content: ch.content,
      wordCount: ch.wordCount,
      isEdited: false,
    }));

    const savedChapters = await createMultipleChapters(chapterData);

    // Generate book images if enabled
    const imageConfig = config.bookImages || DEFAULT_IMAGE_CONFIG;
    if (imageConfig.enabled && imageConfig.imagesPerChapter > 0) {
      console.log(`[Book Images] Generating images: ${imageConfig.imagesPerChapter} per chapter`);
      
      try {
        const bookImageService = new BookImageService();
        
        // Get saved chapter IDs
        const dbChapters = await db
          .select({ id: bookChapters.id, chapterNumber: bookChapters.chapterNumber, title: bookChapters.title, content: bookChapters.content })
          .from(bookChapters)
          .where(eq(bookChapters.bookId, book.id))
          .orderBy(bookChapters.chapterNumber);

        // Generate images for each chapter
        for (const chapter of dbChapters) {
          console.log(`[Book Images] Analyzing chapter ${chapter.chapterNumber}: ${chapter.title}`);
          
          // Analyze chapter for image opportunities
          const analysis = await bookImageService.analyzeChapterForImages(
            chapter.id,
            chapter.title,
            chapter.content || '',
            outline.genre,
            imageConfig
          );

          if (analysis.suggestions.length > 0) {
            console.log(`[Book Images] Found ${analysis.suggestions.length} image opportunities for chapter ${chapter.chapterNumber}`);
            
            // Generate images based on suggestions
            for (const suggestion of analysis.suggestions) {
              try {
                const result = await bookImageService.generateImage({
                  bookId: book.id,
                  chapterId: chapter.id,
                  bookTitle: outline.title,
                  bookGenre: outline.genre,
                  chapterTitle: chapter.title,
                  chapterContent: suggestion.description,
                  imageType: suggestion.imageType,
                  style: imageConfig.preferredStyle,
                  placement: imageConfig.placement,
                  aspectRatio: imageConfig.aspectRatio,
                });

                if (result.success && result.imageUrl) {
                  // Save image to database
                  await db.insert(chapterImages).values({
                    bookId: book.id,
                    chapterId: chapter.id,
                    imageUrl: result.imageUrl,
                    thumbnailUrl: result.thumbnailUrl,
                    imageType: suggestion.imageType,
                    position: suggestion.position,
                    placement: imageConfig.placement,
                    caption: result.caption,
                    altText: result.altText,
                    prompt: result.prompt,
                    metadata: result.metadata,
                    source: 'generated',
                  });
                  
                  console.log(`[Book Images] Generated image for chapter ${chapter.chapterNumber} at position ${suggestion.position}`);
                }
              } catch (imgError) {
                console.error(`[Book Images] Failed to generate image for chapter ${chapter.chapterNumber}:`, imgError);
                // Continue with next image
              }
              
              // Small delay between image generations
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        console.log(`[Book Images] Image generation complete for book ${book.id}`);
      } catch (imageError) {
        console.error('[Book Images] Error generating book images:', imageError);
        // Continue - book images are not critical
      }
    }

    // Create bibliography config and save references if enabled
    if (config.bibliography?.include) {
      console.log('Creating bibliography config for book:', book.id);
      try {
        await upsertBibliographyConfig({
          bookId: book.id,
          enabled: true,
          citationStyle: config.bibliography.citationStyle || 'APA',
          location: config.bibliography.referenceFormat 
            ? [config.bibliography.referenceFormat]
            : ['bibliography'],
          sortBy: 'author',
          sortDirection: 'asc',
          includeAnnotations: false,
          includeAbstracts: false,
          hangingIndent: true,
          lineSpacing: 'single',
          groupByType: false,
          numberingStyle: 'none',
          showDOI: true,
          showURL: true,
          showAccessDate: true,
        });
        console.log('Bibliography config created successfully');

        // Save generated references
        if (references && references.length > 0) {
          console.log(`Saving ${references.length} bibliography references...`);
          for (const ref of references) {
            try {
              await createBibliographyReference({
                id: ref.id,
                bookId: book.id,
                type: ref.type,
                title: ref.title,
                authors: ref.authors,
                year: ref.year,
                publisher: ref.publisher,
                url: ref.url,
                doi: ref.doi,
                typeSpecificData: {
                  journalTitle: ref.journalTitle,
                  volume: ref.volume,
                  issue: ref.issue,
                  pages: ref.pages,
                },
                accessDate: ref.accessDate,
              });
            } catch (refError) {
              console.error('Failed to save reference:', refError);
            }
          }
          console.log('Bibliography references saved successfully');
        }
      } catch (bibError) {
        console.error('Failed to create bibliography config:', bibError);
        // Continue - not critical
      }
    }

    console.log(`Book generated successfully: ${book.id}`);

    return NextResponse.json({
      success: true,
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
        chapters: sanitizedChapters.length,
        wordCount: totalWords,
        modelUsed: chapterModel,
        hasBibliography: !!config.bibliography?.include,
      },
    });
  } catch (error) {
    console.error('Error generating book:', error);
    
    // Extract meaningful error message
    let errorMessage = 'Failed to generate book';
    let errorDetails = 'Unknown error';
    
    if (error instanceof Error) {
      errorDetails = error.message;
      
      // Provide user-friendly messages for common errors
      if (error.message.includes('quota')) {
        errorMessage = 'API quota exceeded';
        errorDetails = 'Please check your API billing and usage limits.';
      } else if (error.message.includes('rate limit') || error.message.includes('429')) {
        errorMessage = 'Rate limit exceeded';
        errorDetails = 'Too many requests. Please wait a few minutes and try again.';
      } else if (error.message.includes('API key')) {
        errorMessage = 'API key error';
        errorDetails = 'Invalid or missing API key.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Generation timeout';
        errorDetails = 'Book generation took too long. Try generating fewer chapters.';
      }
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage, 
        details: errorDetails
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
