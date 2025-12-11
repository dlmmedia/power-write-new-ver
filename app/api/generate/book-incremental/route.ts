import { NextRequest, NextResponse } from 'next/server';
import { AIService, BibliographyGenerationConfig } from '@/lib/services/ai-service';
import { 
  createBook, 
  createMultipleChapters, 
  ensureDemoUser, 
  upsertBibliographyConfig,
  createBibliographyReference,
  getBook,
  getBookChapters,
  updateBook
} from '@/lib/db/operations';
import { BookOutline } from '@/lib/types/generation';
import { sanitizeChapter, countWords } from '@/lib/utils/text-sanitizer';
import { BookConfiguration } from '@/lib/types/studio';

export const maxDuration = 900; // 15 minutes - Railway supports up to 15 min timeout

// Number of chapters to generate per request
// Railway has 15-minute timeout, so we can process multiple chapters at once
// This improves speed AND quality (better context between chapters)
const CHAPTERS_PER_BATCH = 4;

// Generation speed presets with model mappings
const SPEED_MODEL_MAP = {
  quality: 'anthropic/claude-sonnet-4',      // Best coherence and writing quality
  balanced: 'google/gemini-2.5-flash-preview', // Fast with 1M context window
  fast: 'anthropic/claude-3.5-haiku',         // Fastest for quick drafts
} as const;

type GenerationSpeed = keyof typeof SPEED_MODEL_MAP;

interface GenerationRequest {
  userId: string;
  outline: BookOutline;
  config: BookConfiguration;
  modelId?: string;
  generationSpeed?: GenerationSpeed; // New: speed preset option
  useParallel?: boolean; // New: enable parallel generation (default true)
  // For continuation
  bookId?: number;
  startChapter?: number;
}

interface GenerationResponse {
  success: boolean;
  phase: 'creating' | 'generating' | 'cover' | 'completed';
  bookId: number;
  chaptersCompleted: number;
  totalChapters: number;
  progress: number; // 0-100
  message: string;
  // Only on completion
  book?: {
    id: number;
    title: string;
    author: string;
    chapters: number;
    wordCount: number;
    modelUsed: string;
    hasBibliography: boolean;
  };
  // For error cases
  error?: string;
  details?: string;
}

// Helper function for sequential chapter generation (fallback or when coherence is critical)
async function generateSequentially(
  aiService: AIService,
  outline: BookOutline,
  chapterNumbers: number[],
  initialContext: string,
  chapterModel: string,
  bibliographyConfig: BibliographyGenerationConfig | undefined,
  totalChapters: number,
  existingChapters: Array<{ chapterNumber: number; title: string; content: string | null }>
): Promise<Array<{ title: string; content: string; wordCount: number; chapterNumber: number }>> {
  const generatedChapters: Array<{ title: string; content: string; wordCount: number; chapterNumber: number }> = [];
  let previousChapters = initialContext;

  for (const chapterNum of chapterNumbers) {
    console.log(`[Sequential] Generating chapter ${chapterNum}/${totalChapters}${bibliographyConfig ? ' (with citations)' : ''}`);
    
    try {
      const chapter = await aiService.generateChapter(outline, chapterNum, previousChapters, chapterModel, bibliographyConfig);
      
      const sanitizedContent = sanitizeChapter(chapter.content);
      const wordCount = countWords(sanitizedContent);
      
      generatedChapters.push({
        title: chapter.title,
        content: sanitizedContent,
        wordCount,
        chapterNumber: chapterNum,
      });

      // Update context for next chapter - build from all chapters so far
      const allChaptersSoFar = [
        ...existingChapters.map(ch => ({ 
          chapterNumber: ch.chapterNumber, 
          title: ch.title, 
          content: ch.content || '' 
        })),
        ...generatedChapters
      ];
      previousChapters = aiService.buildChapterContext(allChaptersSoFar);
      
      console.log(`[Sequential] Chapter ${chapterNum} generated: ${wordCount} words`);
    } catch (chapterError) {
      console.error(`[Sequential] Failed to generate chapter ${chapterNum}:`, chapterError);
      // Continue with other chapters instead of failing completely
    }
  }

  return generatedChapters;
}

export async function POST(request: NextRequest): Promise<NextResponse<GenerationResponse>> {
  try {
    const body = await request.json();
    const { userId, outline, config, modelId, bookId, startChapter, generationSpeed, useParallel = true } = body as GenerationRequest;

    if (!userId || !outline || !config) {
      return NextResponse.json(
        { 
          success: false, 
          phase: 'creating',
          bookId: 0,
          chaptersCompleted: 0,
          totalChapters: 0,
          progress: 0,
          message: 'Missing required fields',
          error: 'Missing required fields: userId, outline, config' 
        },
        { status: 400 }
      );
    }

    await ensureDemoUser(userId);

    // Determine the model to use based on speed preset or explicit modelId
    let chapterModel: string;
    if (generationSpeed && SPEED_MODEL_MAP[generationSpeed]) {
      chapterModel = SPEED_MODEL_MAP[generationSpeed];
      console.log(`[Incremental] Using speed preset '${generationSpeed}': ${chapterModel}`);
    } else {
      chapterModel = modelId || (config.aiSettings as any)?.chapterModel || config.aiSettings?.model || 'anthropic/claude-sonnet-4';
    }
    const totalChapters = outline.chapters.length;

    // Phase 1: Create book record if this is the first call
    let currentBookId = bookId;
    let currentStartChapter = startChapter || 1;

    if (!currentBookId) {
      console.log(`[Incremental] Creating new book: ${outline.title} (${totalChapters} chapters)`);
      
      // Create book with "generating" status
      const book = await createBook({
        userId,
        title: outline.title,
        author: outline.author,
        genre: outline.genre,
        summary: outline.description,
        outline: outline as any,
        config: config as any,
        metadata: {
          wordCount: 0,
          pageCount: 0,
          readingTime: 0,
          chapters: totalChapters,
          generatedAt: new Date(),
          lastModified: new Date(),
          modelUsed: chapterModel,
        } as any,
        status: 'generating',
      });

      currentBookId = book.id;
      currentStartChapter = 1;

      console.log(`[Incremental] Book created with ID: ${currentBookId}`);
      
      return NextResponse.json({
        success: true,
        phase: 'creating',
        bookId: currentBookId,
        chaptersCompleted: 0,
        totalChapters,
        progress: 5, // 5% for creating the book
        message: `Book created. Starting chapter generation...`,
      });
    }

    // Phase 2: Generate chapters in batches
    const existingChapters = await getBookChapters(currentBookId);
    const completedChapterNumbers = new Set(existingChapters.map(ch => ch.chapterNumber));
    
    // Find chapters that still need to be generated
    const chaptersToGenerate: number[] = [];
    for (let i = 1; i <= totalChapters; i++) {
      if (!completedChapterNumbers.has(i)) {
        chaptersToGenerate.push(i);
      }
    }

    if (chaptersToGenerate.length === 0) {
      // All chapters are done - check if we need to generate covers or finalize
      const currentBook = await getBook(currentBookId);
      const allChapters = await getBookChapters(currentBookId);
      const totalWords = allChapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
      
      // Check if covers already exist (from previous cover phase)
      const coversExist = !!currentBook?.coverUrl;
      
      if (!coversExist) {
        // Phase: Generate covers only (separate from chapters to prevent timeout)
        console.log(`[Incremental] All chapters complete, generating covers...`);
        
        const aiService = new AIService(config.aiSettings?.model, chapterModel);
        
        // Generate front cover
        let coverUrl: string | undefined;
        try {
          console.log('[Incremental] Generating front cover...');
          coverUrl = await aiService.generateCoverImage(
            outline.title,
            outline.author,
            outline.genre,
            outline.description,
            'vivid'
          );
          console.log('[Incremental] Front cover generated successfully');
        } catch (coverError) {
          console.error('[Incremental] Failed to generate front cover:', coverError);
        }

        // Generate back cover
        let backCoverUrl: string | undefined;
        try {
          console.log('[Incremental] Generating back cover...');
          backCoverUrl = await aiService.generateBackCoverImage(
            outline.title,
            outline.author,
            outline.genre,
            outline.description,
            'photographic'
          );
          console.log('[Incremental] Back cover generated successfully');
        } catch (backCoverError) {
          console.error('[Incremental] Failed to generate back cover:', backCoverError);
        }

        // Update book with covers but keep status as 'generating' for finalization
        await updateBook(currentBookId, {
          coverUrl,
          metadata: {
            wordCount: totalWords,
            pageCount: Math.ceil(totalWords / 250),
            readingTime: Math.ceil(totalWords / 250),
            chapters: allChapters.length,
            generatedAt: new Date(),
            lastModified: new Date(),
            modelUsed: chapterModel,
            backCoverUrl: backCoverUrl,
          } as any,
        });

        // Return cover phase - client will call again to finalize
        return NextResponse.json({
          success: true,
          phase: 'cover',
          bookId: currentBookId,
          chaptersCompleted: totalChapters,
          totalChapters,
          progress: 95, // 95% after covers
          message: 'Covers generated. Finalizing book...',
        });
      }

      // Phase: Finalize book (covers already exist)
      console.log(`[Incremental] Finalizing book...`);
      
      const aiService = new AIService(config.aiSettings?.model, chapterModel);

      // Create bibliography config and generate references if enabled
      if (config.bibliography?.include) {
        try {
          console.log('[Incremental] Creating bibliography config...');
          await upsertBibliographyConfig({
            bookId: currentBookId,
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

          // Generate bibliography references for non-fiction books
          console.log('[Incremental] Generating bibliography references...');
          const chapterContents = allChapters.map(ch => ch.content || '');
          const bibliographyGenerationConfig: BibliographyGenerationConfig = {
            enabled: true,
            citationStyle: (config.bibliography.citationStyle as any) || 'APA',
            sourceVerification: config.bibliography.sourceVerification || 'moderate',
          };

          const generatedRefs = await aiService.generateBibliographyReferences(
            outline,
            chapterContents,
            bibliographyGenerationConfig,
            chapterModel
          );

          // Save generated references to database
          if (generatedRefs.length > 0) {
            console.log(`[Incremental] Saving ${generatedRefs.length} bibliography references...`);
            for (const ref of generatedRefs) {
              try {
                await createBibliographyReference({
                  id: ref.id,
                  bookId: currentBookId,
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
                console.error('[Incremental] Failed to save reference:', refError);
              }
            }
            console.log('[Incremental] Bibliography references saved successfully');
          }
        } catch (bibError) {
          console.error('[Incremental] Failed to create bibliography:', bibError);
        }
      }

      // Update book to completed
      await updateBook(currentBookId, {
        status: 'completed',
        metadata: {
          wordCount: totalWords,
          pageCount: Math.ceil(totalWords / 250),
          readingTime: Math.ceil(totalWords / 250),
          chapters: allChapters.length,
          generatedAt: new Date(),
          lastModified: new Date(),
          modelUsed: chapterModel,
          backCoverUrl: (currentBook?.metadata as any)?.backCoverUrl,
        } as any,
      });

      return NextResponse.json({
        success: true,
        phase: 'completed',
        bookId: currentBookId,
        chaptersCompleted: totalChapters,
        totalChapters,
        progress: 100,
        message: 'Book generation complete!',
        book: {
          id: currentBookId,
          title: currentBook?.title || outline.title,
          author: currentBook?.author || outline.author,
          chapters: allChapters.length,
          wordCount: totalWords,
          modelUsed: chapterModel,
          hasBibliography: !!config.bibliography?.include,
        },
      });
    }

    // Generate the next batch of chapters
    const batchChapterNumbers = chaptersToGenerate.slice(0, CHAPTERS_PER_BATCH);
    console.log(`[Incremental] Generating chapters: ${batchChapterNumbers.join(', ')} (parallel: ${useParallel})`);

    const aiService = new AIService(config.aiSettings?.model, chapterModel);
    
    // Build previous chapters context from existing chapters
    const sortedExisting = existingChapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
    
    // Use the AIService's context builder for consistency
    const previousChaptersContext = aiService.buildChapterContext(
      sortedExisting.map(ch => ({
        title: ch.title,
        content: ch.content || '',
        chapterNumber: ch.chapterNumber
      }))
    );

    let generatedChapters: Array<{
      title: string;
      content: string;
      wordCount: number;
      chapterNumber: number;
    }> = [];

    // Build bibliography config if enabled
    const bibliographyConfig: BibliographyGenerationConfig | undefined = config.bibliography?.include
      ? {
          enabled: true,
          citationStyle: (config.bibliography.citationStyle as any) || 'APA',
          sourceVerification: config.bibliography.sourceVerification || 'moderate',
        }
      : undefined;

    if (useParallel) {
      // PARALLEL GENERATION - ~4x faster
      // All chapters in the batch share the same context (from previously completed chapters)
      // This trades some inter-chapter coherence for significant speed improvement
      console.log(`[Incremental] Using PARALLEL generation for ${batchChapterNumbers.length} chapters`);
      const startTime = Date.now();

      try {
        const batchResults = await aiService.generateChapterBatch(
          outline,
          batchChapterNumbers,
          previousChaptersContext,
          chapterModel,
          bibliographyConfig
        );

        // Sanitize and process results
        generatedChapters = batchResults.map(chapter => ({
          title: chapter.title,
          content: sanitizeChapter(chapter.content),
          wordCount: countWords(chapter.content),
          chapterNumber: chapter.chapterNumber,
        }));

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[Incremental] Parallel batch completed in ${elapsed}s - ${generatedChapters.length} chapters`);
      } catch (batchError) {
        console.error(`[Incremental] Parallel batch failed, falling back to sequential:`, batchError);
        // Fall back to sequential generation if parallel fails
        generatedChapters = await generateSequentially(
          aiService, outline, batchChapterNumbers, previousChaptersContext, 
          chapterModel, bibliographyConfig, totalChapters, sortedExisting
        );
      }
    } else {
      // SEQUENTIAL GENERATION - better coherence, slower
      console.log(`[Incremental] Using SEQUENTIAL generation for ${batchChapterNumbers.length} chapters`);
      generatedChapters = await generateSequentially(
        aiService, outline, batchChapterNumbers, previousChaptersContext,
        chapterModel, bibliographyConfig, totalChapters, sortedExisting
      );
    }

    // Save generated chapters to database
    if (generatedChapters.length > 0) {
      const chapterData = generatedChapters.map((ch) => ({
        bookId: currentBookId,
        chapterNumber: ch.chapterNumber,
        title: ch.title,
        content: ch.content,
        wordCount: ch.wordCount,
        isEdited: false,
      }));

      await createMultipleChapters(chapterData);
      console.log(`[Incremental] Saved ${generatedChapters.length} chapters to database`);

      // Update book metadata with current progress
      const allChapters = await getBookChapters(currentBookId);
      const totalWords = allChapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
      
      await updateBook(currentBookId, {
        metadata: {
          wordCount: totalWords,
          pageCount: Math.ceil(totalWords / 250),
          readingTime: Math.ceil(totalWords / 250),
          chapters: allChapters.length,
          generatedAt: new Date(),
          lastModified: new Date(),
          modelUsed: chapterModel,
        } as any,
      });
    }

    const chaptersCompleted = existingChapters.length + generatedChapters.length;
    const remaining = totalChapters - chaptersCompleted;
    
    // Calculate progress: 5% for creation, 90% for chapters, 5% for cover
    const chapterProgress = (chaptersCompleted / totalChapters) * 90;
    const progress = Math.round(5 + chapterProgress);

    return NextResponse.json({
      success: true,
      phase: 'generating',
      bookId: currentBookId,
      chaptersCompleted,
      totalChapters,
      progress,
      message: remaining > 0 
        ? `Generated ${generatedChapters.length} chapters. ${remaining} remaining...`
        : `All chapters generated. Finalizing book...`,
    });

  } catch (error) {
    console.error('[Incremental] Error:', error);
    
    let errorMessage = 'Failed to generate book';
    let errorDetails = 'Unknown error';
    
    if (error instanceof Error) {
      errorDetails = error.message;
      
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
        errorDetails = 'The request took too long. Progress has been saved - click Generate again to continue.';
      }
    }
    
    return NextResponse.json(
      { 
        success: false,
        phase: 'generating',
        bookId: 0,
        chaptersCompleted: 0,
        totalChapters: 0,
        progress: 0,
        message: errorMessage,
        error: errorMessage, 
        details: errorDetails
      },
      { status: 500 }
    );
  }
}




