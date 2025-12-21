import { inngest } from './client';
import { AIService, BibliographyGenerationConfig } from '@/lib/services/ai-service';
import { 
  createMultipleChapters, 
  getBook, 
  getBookChapters, 
  updateBook,
  upsertBibliographyConfig,
  createBibliographyReference
} from '@/lib/db/operations';
import { sanitizeChapter, countWords } from '@/lib/utils/text-sanitizer';

// Model mapping for speed presets
const SPEED_MODEL_MAP: Record<string, string> = {
  quality: 'anthropic/claude-sonnet-4',
  balanced: 'google/gemini-2.5-flash-preview',
  fast: 'anthropic/claude-3.5-haiku',
};

const CHAPTERS_PER_BATCH = 4;

/**
 * Main book generation orchestrator
 * Triggered when a new book generation is requested
 * Orchestrates the entire generation process using step functions
 */
export const generateBookBackground = inngest.createFunction(
  {
    id: 'generate-book-background',
    name: 'Generate Book (Background)',
    retries: 3,
    // Timeout for the entire function (30 minutes max)
    cancelOn: [
      { event: 'book/generation.cancelled', match: 'data.bookId' }
    ],
  },
  { event: 'book/generation.started' },
  async ({ event, step }) => {
    const { bookId, userId, totalChapters, outline, config } = event.data;
    
    // Determine the model to use - PRIORITY ORDER:
    // 1. User's selected chapterModel in config (from AI Models tab)
    // 2. Speed preset fallback (only if no model explicitly selected)
    // 3. Default fallback
    const userSelectedModel = config.chapterModel;
    const speedFallbackModel = config.generationSpeed && SPEED_MODEL_MAP[config.generationSpeed]
      ? SPEED_MODEL_MAP[config.generationSpeed]
      : 'anthropic/claude-sonnet-4';
    
    const chapterModel = userSelectedModel || speedFallbackModel;

    console.log(`[Inngest] Starting background generation for book ${bookId}: ${outline.title}`);
    console.log(`[Inngest] Model Selection Debug:`);
    console.log(`  - config.chapterModel: ${config.chapterModel || 'not set'}`);
    console.log(`  - config.generationSpeed: ${config.generationSpeed || 'not set'}`);
    console.log(`  - FINAL MODEL: ${chapterModel}`);
    console.log(`[Inngest] Parallel: ${config.useParallel}`);

    // Step 1: Generate chapters in batches
    let completedChapters = 0;
    const allChapters: Array<{ 
      chapterNumber: number; 
      title: string; 
      content: string; 
      wordCount: number 
    }> = [];

    // Process chapters in batches
    for (let batchStart = 0; batchStart < totalChapters; batchStart += CHAPTERS_PER_BATCH) {
      const batchEnd = Math.min(batchStart + CHAPTERS_PER_BATCH, totalChapters);
      const batchChapterNumbers: number[] = [];
      
      for (let i = batchStart; i < batchEnd; i++) {
        batchChapterNumbers.push(i + 1);
      }

      // Generate batch as a step (allows retries and progress tracking)
      const batchResult = await step.run(
        `generate-chapters-${batchStart + 1}-to-${batchEnd}`,
        async () => {
          const aiService = new AIService(undefined, chapterModel);
          
          // Build context from previously completed chapters
          const previousContext = aiService.buildChapterContext(allChapters);

          // Build bibliography config if enabled
          const bibliographyConfig: BibliographyGenerationConfig | undefined = 
            config.bibliographyEnabled
              ? {
                  enabled: true,
                  citationStyle: (config.citationStyle as any) || 'APA',
                  sourceVerification: 'moderate',
                }
              : undefined;

          if (config.useParallel) {
            // Parallel generation for speed
            const chapters = await aiService.generateChapterBatch(
              outline as any,
              batchChapterNumbers,
              previousContext,
              chapterModel,
              bibliographyConfig
            );

            return chapters.map(ch => ({
              chapterNumber: ch.chapterNumber,
              title: ch.title,
              content: sanitizeChapter(ch.content),
              wordCount: countWords(ch.content),
            }));
          } else {
            // Sequential generation for better coherence
            const chapters: Array<{
              chapterNumber: number;
              title: string;
              content: string;
              wordCount: number;
            }> = [];
            
            let context = previousContext;
            
            for (const chapterNum of batchChapterNumbers) {
              const chapter = await aiService.generateChapter(
                outline as any,
                chapterNum,
                context,
                chapterModel,
                bibliographyConfig
              );

              const sanitizedContent = sanitizeChapter(chapter.content);
              const wordCount = countWords(sanitizedContent);

              chapters.push({
                chapterNumber: chapterNum,
                title: chapter.title,
                content: sanitizedContent,
                wordCount,
              });

              // Update context for next chapter
              context = aiService.buildChapterContext([...allChapters, ...chapters]);
            }

            return chapters;
          }
        }
      );

      // Save chapters to database
      await step.run(`save-chapters-${batchStart + 1}-to-${batchEnd}`, async () => {
        const chapterData = batchResult.map(ch => ({
          bookId,
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          content: ch.content,
          wordCount: ch.wordCount,
          isEdited: false,
        }));

        await createMultipleChapters(chapterData);

        // Update book metadata
        const allDbChapters = await getBookChapters(bookId);
        const totalWords = allDbChapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);

        await updateBook(bookId, {
          metadata: {
            wordCount: totalWords,
            pageCount: Math.ceil(totalWords / 250),
            readingTime: Math.ceil(totalWords / 250),
            chapters: allDbChapters.length,
            lastModified: new Date(),
            modelUsed: chapterModel,
          } as any,
        });

        return { saved: chapterData.length, totalWords };
      });

      // Add to our tracking array
      allChapters.push(...batchResult);
      completedChapters = allChapters.length;

      console.log(`[Inngest] Batch complete: ${completedChapters}/${totalChapters} chapters`);
    }

    // Step 2: Generate covers
    const coverResult = await step.run('generate-covers', async () => {
      const aiService = new AIService();

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
      } catch (error) {
        console.error('[Inngest] Failed to generate front cover:', error);
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
      } catch (error) {
        console.error('[Inngest] Failed to generate back cover:', error);
      }

      // Update book with covers
      const allDbChapters = await getBookChapters(bookId);
      const totalWords = allDbChapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);

      await updateBook(bookId, {
        coverUrl,
        metadata: {
          wordCount: totalWords,
          pageCount: Math.ceil(totalWords / 250),
          readingTime: Math.ceil(totalWords / 250),
          chapters: allDbChapters.length,
          lastModified: new Date(),
          modelUsed: chapterModel,
          backCoverUrl,
        } as any,
      });

      return { coverUrl, backCoverUrl };
    });

    // Step 3: Generate bibliography if enabled
    if (config.bibliographyEnabled) {
      await step.run('generate-bibliography', async () => {
        const aiService = new AIService();

        // Create bibliography config
        await upsertBibliographyConfig({
          bookId,
          enabled: true,
          citationStyle: config.citationStyle || 'APA',
          location: ['bibliography'],
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

        // Generate references
        const chapterContents = allChapters.map(ch => ch.content);
        const bibliographyGenerationConfig: BibliographyGenerationConfig = {
          enabled: true,
          citationStyle: (config.citationStyle as any) || 'APA',
          sourceVerification: 'moderate',
        };

        const generatedRefs = await aiService.generateBibliographyReferences(
          outline as any,
          chapterContents,
          bibliographyGenerationConfig,
          chapterModel
        );

        // Save references
        for (const ref of generatedRefs) {
          try {
            await createBibliographyReference({
              id: ref.id,
              bookId,
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
          } catch (error) {
            console.error('[Inngest] Failed to save reference:', error);
          }
        }

        return { referencesGenerated: generatedRefs.length };
      });
    }

    // Step 4: Finalize book
    await step.run('finalize-book', async () => {
      await updateBook(bookId, {
        status: 'completed',
      });

      console.log(`[Inngest] Book ${bookId} generation complete!`);
    });

    // Calculate final stats
    const totalWords = allChapters.reduce((sum, ch) => sum + ch.wordCount, 0);

    return {
      success: true,
      bookId,
      chaptersGenerated: completedChapters,
      totalWords,
      hasCover: !!coverResult.coverUrl,
      hasBackCover: !!coverResult.backCoverUrl,
    };
  }
);

// Export all functions for the Inngest serve handler
export const functions = [generateBookBackground];










