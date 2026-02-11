import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { AIService, BibliographyGenerationConfig } from '@/lib/services/ai-service';
import { 
  createBook, 
  createMultipleChapters, 
  getBook,
  getBookChapters,
  updateBook
} from '@/lib/db/operations';
import { BookOutline } from '@/lib/types/generation';
import { sanitizeChapter, countWords } from '@/lib/utils/text-sanitizer';
import { BookConfiguration } from '@/lib/types/studio';
import { canGenerateBook } from '@/lib/services/user-service';

export const maxDuration = 900; // 15 minutes
export const dynamic = 'force-dynamic';

// Speed model mapping - only used as fallback when no model explicitly selected
const SPEED_MODEL_MAP = {
  quality: 'anthropic/claude-sonnet-4',
  balanced: 'google/gemini-2.5-flash-preview',
  fast: 'anthropic/claude-3.5-haiku',
} as const;

type GenerationSpeed = keyof typeof SPEED_MODEL_MAP;

// Helper to get the speed-based fallback model
function getSpeedFallbackModel(speed?: GenerationSpeed): string {
  if (speed && SPEED_MODEL_MAP[speed]) {
    return SPEED_MODEL_MAP[speed];
  }
  return 'anthropic/claude-sonnet-4'; // Default fallback
}

const CHAPTERS_PER_BATCH = 4;

interface StreamGenerationRequest {
  outline: BookOutline;
  config: BookConfiguration;
  modelId?: string;
  generationSpeed?: GenerationSpeed;
  useParallel?: boolean;
  bookId?: number;
}

// Helper to create SSE message
function createSSEMessage(event: string, data: Record<string, unknown>): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  // Authenticate user
  const { userId: clerkUserId } = await auth();
  
  if (!clerkUserId) {
    return new Response(
      encoder.encode(createSSEMessage('error', { error: 'Unauthorized' })),
      {
        status: 401,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  }
  
  // Parse request body
  let body: StreamGenerationRequest;
  try {
    body = await request.json();
  } catch (error) {
    return new Response(
      encoder.encode(createSSEMessage('error', { error: 'Invalid request body' })),
      {
        status: 400,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  }

  const { outline, config, modelId, generationSpeed, useParallel = true, bookId } = body;
  const userId = clerkUserId;

  if (!outline || !config) {
    return new Response(
      encoder.encode(createSSEMessage('error', { error: 'Missing required fields' })),
      {
        status: 400,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  }

  // Check generation limits for new books
  if (!bookId) {
    const generationCheck = await canGenerateBook(userId);
    if (!generationCheck.allowed) {
      return new Response(
        encoder.encode(createSSEMessage('error', { error: generationCheck.reason || 'Book limit reached' })),
        {
          status: 403,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      );
    }
  }

  // Create readable stream for SSE
  let cancelled = false;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      // Safe enqueue helper - prevents "Controller is already closed" errors
      // when Railway's proxy or Node.js kills the SSE connection mid-generation
      const safeEnqueue = (data: Uint8Array): boolean => {
        if (cancelled) return false;
        try {
          controller.enqueue(data);
          return true;
        } catch (err) {
          console.warn('[Stream] Controller closed, cannot enqueue:', err instanceof Error ? err.message : err);
          cancelled = true;
          return false;
        }
      };

      // Start heartbeat to prevent Railway proxy idle timeout (sends SSE comment every 25s)
      heartbeatInterval = setInterval(() => {
        if (cancelled) {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          return;
        }
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          cancelled = true;
          if (heartbeatInterval) clearInterval(heartbeatInterval);
        }
      }, 25000);

      try {

        // Determine model - prioritize user selection over speed-based defaults
        // Priority: 1) explicit modelId param, 2) config.chapterModel, 3) config.model, 4) speed fallback
        const userSelectedModel = modelId || (config.aiSettings as any)?.chapterModel || config.aiSettings?.model;
        const chapterModel: string = userSelectedModel || getSpeedFallbackModel(generationSpeed);
        
        console.log(`[Stream] Model Selection Debug:`);
        console.log(`  - modelId param: ${modelId || 'not provided'}`);
        console.log(`  - config.chapterModel: ${(config.aiSettings as any)?.chapterModel || 'not set'}`);
        console.log(`  - config.model: ${config.aiSettings?.model || 'not set'}`);
        console.log(`  - generationSpeed: ${generationSpeed || 'not set'}`);
        console.log(`  - FINAL MODEL: ${chapterModel}`);

        const totalChapters = outline.chapters.length;
        const aiService = new AIService(config.aiSettings?.model, chapterModel);

        // Send initial event
        safeEnqueue(encoder.encode(createSSEMessage('start', {
          phase: 'starting',
          totalChapters,
          model: chapterModel,
          parallel: useParallel,
          message: 'Starting book generation...',
        })));

        // Create or get book
        let currentBookId = bookId;
        if (!currentBookId) {
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

          safeEnqueue(encoder.encode(createSSEMessage('book_created', {
            bookId: currentBookId,
            title: outline.title,
            message: 'Book record created',
          })));
        }

        // Get existing chapters
        const existingChapters = await getBookChapters(currentBookId);
        const completedChapterNumbers = new Set(existingChapters.map(ch => ch.chapterNumber));

        // Find chapters to generate
        const chaptersToGenerate: number[] = [];
        for (let i = 1; i <= totalChapters; i++) {
          if (!completedChapterNumbers.has(i)) {
            chaptersToGenerate.push(i);
          }
        }

        if (chaptersToGenerate.length === 0) {
          safeEnqueue(encoder.encode(createSSEMessage('complete', {
            bookId: currentBookId,
            chaptersCompleted: totalChapters,
            message: 'All chapters already generated',
          })));
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          if (!cancelled) controller.close();
          return;
        }

        // Build bibliography config
        const bibliographyConfig: BibliographyGenerationConfig | undefined = config.bibliography?.include
          ? {
              enabled: true,
              citationStyle: (config.bibliography.citationStyle as any) || 'APA',
              referenceFormat: config.bibliography.referenceFormat || 'bibliography',
              sourceVerification: config.bibliography.sourceVerification || 'moderate',
            }
          : undefined;

        // Process chapters in batches
        let completedCount = existingChapters.length;
        const sortedExisting = existingChapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
        
        for (let batchStart = 0; batchStart < chaptersToGenerate.length; batchStart += CHAPTERS_PER_BATCH) {
          const batchChapterNumbers = chaptersToGenerate.slice(batchStart, batchStart + CHAPTERS_PER_BATCH);

          safeEnqueue(encoder.encode(createSSEMessage('batch_start', {
            batch: Math.floor(batchStart / CHAPTERS_PER_BATCH) + 1,
            chapters: batchChapterNumbers,
            message: `Starting batch: chapters ${batchChapterNumbers.join(', ')}`,
          })));

          // Build context from existing chapters
          const allPreviousChapters = [
            ...sortedExisting.map(ch => ({
              title: ch.title,
              content: ch.content || '',
              chapterNumber: ch.chapterNumber
            }))
          ];
          const previousContext = aiService.buildChapterContext(allPreviousChapters);

          let generatedChapters: Array<{
            title: string;
            content: string;
            wordCount: number;
            chapterNumber: number;
          }> = [];

          const batchStartTime = Date.now();

          if (useParallel) {
            // Parallel generation
            try {
              const batchResults = await aiService.generateChapterBatch(
                outline,
                batchChapterNumbers,
                previousContext,
                chapterModel,
                bibliographyConfig,
                // Progress callback for each chapter completion
                // Uses safeEnqueue to prevent "Controller is already closed" crashes
                // that would kill the entire Promise.all and lose generated chapters
                (chapterNum, chapter) => {
                  safeEnqueue(encoder.encode(createSSEMessage('chapter_progress', {
                    chapterNumber: chapterNum,
                    title: chapter.title,
                    wordCount: chapter.wordCount,
                    message: `Chapter ${chapterNum} generated`,
                  })));
                }
              );

              generatedChapters = batchResults.map(ch => ({
                title: ch.title,
                content: sanitizeChapter(ch.content),
                wordCount: countWords(ch.content),
                chapterNumber: ch.chapterNumber,
              }));
            } catch (error) {
              console.error('Parallel batch failed:', error);
              safeEnqueue(encoder.encode(createSSEMessage('batch_error', {
                batch: Math.floor(batchStart / CHAPTERS_PER_BATCH) + 1,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Batch failed, attempting sequential fallback...',
              })));
              
              // Fall back to sequential
              generatedChapters = await generateSequentialBatch(
                aiService, outline, batchChapterNumbers, previousContext,
                chapterModel, bibliographyConfig, safeEnqueue, encoder
              );
            }
          } else {
            // Sequential generation
            generatedChapters = await generateSequentialBatch(
              aiService, outline, batchChapterNumbers, previousContext,
              chapterModel, bibliographyConfig, safeEnqueue, encoder
            );
          }

          const batchDuration = ((Date.now() - batchStartTime) / 1000).toFixed(1);

          // Save chapters to database
          if (generatedChapters.length > 0) {
            const chapterData = generatedChapters.map(ch => ({
              bookId: currentBookId,
              chapterNumber: ch.chapterNumber,
              title: ch.title,
              content: ch.content,
              wordCount: ch.wordCount,
              isEdited: false,
            }));

            await createMultipleChapters(chapterData);
            
            // Add to existing for next batch context
            sortedExisting.push(...generatedChapters.map(ch => ({
              chapterNumber: ch.chapterNumber,
              title: ch.title,
              content: ch.content,
              wordCount: ch.wordCount,
            })) as any);

            completedCount += generatedChapters.length;

            // Update book metadata
            const totalWords = sortedExisting.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
            await updateBook(currentBookId, {
              metadata: {
                wordCount: totalWords,
                pageCount: Math.ceil(totalWords / 250),
                readingTime: Math.ceil(totalWords / 250),
                chapters: sortedExisting.length,
                lastModified: new Date(),
                modelUsed: chapterModel,
              } as any,
            });

            safeEnqueue(encoder.encode(createSSEMessage('batch_complete', {
              batch: Math.floor(batchStart / CHAPTERS_PER_BATCH) + 1,
              chaptersCompleted: completedCount,
              totalChapters,
              batchDuration,
              totalWords,
              progress: Math.round((completedCount / totalChapters) * 100),
              message: `Batch complete in ${batchDuration}s`,
            })));
          }
        }

        // All chapters generated - generate covers
        safeEnqueue(encoder.encode(createSSEMessage('covers_start', {
          message: 'Generating book covers...',
        })));

        let coverUrl: string | undefined;
        let backCoverUrl: string | undefined;

        try {
          coverUrl = await aiService.generateCoverImage(
            outline.title,
            outline.author,
            outline.genre,
            outline.description,
            'vivid'
          );
          safeEnqueue(encoder.encode(createSSEMessage('cover_complete', {
            type: 'front',
            url: coverUrl,
            message: 'Front cover generated',
          })));
        } catch (error) {
          console.error('Failed to generate front cover:', error);
          safeEnqueue(encoder.encode(createSSEMessage('cover_error', {
            type: 'front',
            error: error instanceof Error ? error.message : 'Unknown error',
          })));
        }

        try {
          backCoverUrl = await aiService.generateBackCoverImage(
            outline.title,
            outline.author,
            outline.genre,
            outline.description,
            'photographic',
            undefined, // use default image model
            { showPowerWriteBranding: false, showTagline: false } // don't show author branding
          );
          safeEnqueue(encoder.encode(createSSEMessage('cover_complete', {
            type: 'back',
            url: backCoverUrl,
            message: 'Back cover generated',
          })));
        } catch (error) {
          console.error('Failed to generate back cover:', error);
          safeEnqueue(encoder.encode(createSSEMessage('cover_error', {
            type: 'back',
            error: error instanceof Error ? error.message : 'Unknown error',
          })));
        }

        // Finalize book
        const allChapters = await getBookChapters(currentBookId);
        const totalWords = allChapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);

        await updateBook(currentBookId, {
          status: 'completed',
          coverUrl,
          metadata: {
            wordCount: totalWords,
            pageCount: Math.ceil(totalWords / 250),
            readingTime: Math.ceil(totalWords / 250),
            chapters: allChapters.length,
            generatedAt: new Date(),
            lastModified: new Date(),
            modelUsed: chapterModel,
            backCoverUrl,
          } as any,
        });

        // Send completion event
        safeEnqueue(encoder.encode(createSSEMessage('complete', {
          bookId: currentBookId,
          title: outline.title,
          author: outline.author,
          chaptersCompleted: allChapters.length,
          totalWords,
          hasCover: !!coverUrl,
          hasBackCover: !!backCoverUrl,
          message: 'Book generation complete!',
        })));

        if (heartbeatInterval) clearInterval(heartbeatInterval);
        if (!cancelled) controller.close();
      } catch (error) {
        console.error('Stream generation error:', error);
        safeEnqueue(encoder.encode(createSSEMessage('error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Generation failed',
        })));
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        if (!cancelled) controller.close();
      }
    },
    cancel() {
      // Called when the client disconnects or Railway kills the connection
      console.log('[Stream] Client disconnected or connection killed');
      cancelled = true;
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

// Helper for sequential batch generation
async function generateSequentialBatch(
  aiService: AIService,
  outline: BookOutline,
  chapterNumbers: number[],
  previousContext: string,
  chapterModel: string,
  bibliographyConfig: BibliographyGenerationConfig | undefined,
  safeEnqueue: (data: Uint8Array) => boolean,
  encoder: TextEncoder
): Promise<Array<{ title: string; content: string; wordCount: number; chapterNumber: number }>> {
  const generatedChapters: Array<{
    title: string;
    content: string;
    wordCount: number;
    chapterNumber: number;
  }> = [];

  let context = previousContext;

  for (const chapterNum of chapterNumbers) {
    try {
      const chapter = await aiService.generateChapter(
        outline,
        chapterNum,
        context,
        chapterModel,
        bibliographyConfig
      );

      const sanitizedContent = sanitizeChapter(chapter.content);
      const wordCount = countWords(sanitizedContent);

      generatedChapters.push({
        title: chapter.title,
        content: sanitizedContent,
        wordCount,
        chapterNumber: chapterNum,
      });

      // Update context for next chapter
      context = aiService.buildChapterContext([
        ...generatedChapters.map(ch => ({
          title: ch.title,
          content: ch.content,
          chapterNumber: ch.chapterNumber,
        }))
      ]);

      safeEnqueue(encoder.encode(createSSEMessage('chapter_progress', {
        chapterNumber: chapterNum,
        title: chapter.title,
        wordCount,
        message: `Chapter ${chapterNum} generated (${wordCount} words)`,
      })));
    } catch (error) {
      console.error(`Failed to generate chapter ${chapterNum}:`, error);
      safeEnqueue(encoder.encode(createSSEMessage('chapter_error', {
        chapterNumber: chapterNum,
        error: error instanceof Error ? error.message : 'Unknown error',
      })));
    }
  }

  return generatedChapters;
}













