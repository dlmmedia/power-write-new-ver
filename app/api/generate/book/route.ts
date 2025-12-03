import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/services/ai-service';
import { createBook, createMultipleChapters, ensureDemoUser, upsertBibliographyConfig } from '@/lib/db/operations';
import { BookOutline } from '@/lib/types/generation';
import { sanitizeChapter, countWords } from '@/lib/utils/text-sanitizer';
import { BookConfiguration } from '@/lib/types/studio';

export const maxDuration = 300; // 5 minutes

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

    // Determine the model to use for chapter generation
    const chapterModel = modelId || (config.aiSettings as any)?.chapterModel || config.aiSettings?.model || 'anthropic/claude-sonnet-4';

    console.log(`Starting book generation: ${outline.title} (${outline.chapters.length} chapters)`);
    console.log(`Using model for chapters: ${chapterModel}`);

    // Create AI service with model selection
    const aiService = new AIService(
      config.aiSettings?.model, // outline model
      chapterModel // chapter model
    );

    // Generate all chapters
    const { chapters } = await aiService.generateFullBook(
      outline, 
      (current, total) => {
        console.log(`Progress: Chapter ${current}/${total}`);
      },
      chapterModel
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

    // Generate cover image automatically (still uses OpenAI DALL-E)
    let coverUrl: string | undefined;
    try {
      console.log('Generating cover image...');
      coverUrl = await aiService.generateCoverImage(
        outline.title,
        outline.author,
        outline.genre,
        outline.description,
        'vivid'
      );
      console.log('Cover generated successfully');
    } catch (coverError) {
      console.error('Failed to generate cover, continuing without:', coverError);
      // Continue without cover - not critical
    }

    // Save to database
    const book = await createBook({
      userId,
      title: outline.title,
      author: outline.author,
      genre: outline.genre,
      summary: outline.description,
      outline: outline as any,
      config: config as any,
      metadata: metadata as any,
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

    await createMultipleChapters(chapterData);

    // Create bibliography config if enabled in studio settings
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
