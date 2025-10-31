import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/services/ai-service';
import { createBook, createMultipleChapters, ensureDemoUser } from '@/lib/db/operations';
import { BookOutline } from '@/lib/types/generation';
import { sanitizeChapter, countWords } from '@/lib/utils/text-sanitizer';
import { BookConfiguration } from '@/lib/types/studio';

export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, outline, config } = body as {
      userId: string;
      outline: BookOutline;
      config: BookConfiguration;
    };

    if (!userId || !outline || !config) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, outline, config' },
        { status: 400 }
      );
    }

    // Ensure demo user exists
    await ensureDemoUser(userId);

    console.log(`Starting book generation: ${outline.title} (${outline.chapters.length} chapters)`);

    // Generate all chapters
    const { chapters } = await aiService.generateFullBook(outline, (current, total) => {
      console.log(`Progress: Chapter ${current}/${total}`);
    });

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
    };

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

    console.log(`Book generated successfully: ${book.id}`);

    return NextResponse.json({
      success: true,
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
        chapters: sanitizedChapters.length,
        wordCount: totalWords,
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
        errorMessage = 'OpenAI API quota exceeded';
        errorDetails = 'Please check your OpenAI billing and usage limits.';
      } else if (error.message.includes('rate limit') || error.message.includes('429')) {
        errorMessage = 'Rate limit exceeded';
        errorDetails = 'Too many requests. Please wait a few minutes and try again.';
      } else if (error.message.includes('API key')) {
        errorMessage = 'API key error';
        errorDetails = 'Invalid or missing OpenAI API key.';
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
