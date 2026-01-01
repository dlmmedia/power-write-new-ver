import { NextRequest, NextResponse } from 'next/server';
import { ttsService, TTSProvider, VoiceId } from '@/lib/services/tts-service';
import { ensureDemoUser, getBookWithChapters, getChapterByBookAndNumber, updateChapterAudio } from '@/lib/db/operations';

export const maxDuration = 600; // 10 minutes for audio generation - Railway supports up to 15 min

export async function POST(request: NextRequest) {
  console.log('[Audio API] Request received');
  try {
    const body = await request.json();
    const provider = (body.provider as TTSProvider) || 'openai';
    
    console.log('[Audio API] Request body:', { 
      userId: body.userId, 
      bookId: body.bookId, 
      provider,
      chapterNumbers: body.chapterNumbers, 
      voice: body.voice 
    });

    // Check environment variables based on provider
    // Support both GEMINI_API_KEY and GOOGLE_AI_API_KEY for backwards compatibility
    if (provider === 'gemini') {
      if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_AI_API_KEY) {
        console.error('[Audio API] GEMINI_API_KEY or GOOGLE_AI_API_KEY is not configured');
        return NextResponse.json(
          { 
            error: 'Gemini API key is not configured. Please set GEMINI_API_KEY or GOOGLE_AI_API_KEY in your environment variables.',
            hint: 'Add GEMINI_API_KEY or GOOGLE_AI_API_KEY in your .env.local file or deployment environment variables.'
          },
          { status: 500 }
        );
      }
    } else {
      if (!process.env.OPENAI_API_KEY) {
        console.error('[Audio API] OPENAI_API_KEY is not configured');
        return NextResponse.json(
          { 
            error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.',
            hint: 'For Vercel deployments, add OPENAI_API_KEY in Project Settings > Environment Variables'
          },
          { status: 500 }
        );
      }
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('[Audio API] BLOB_READ_WRITE_TOKEN is not configured');
      return NextResponse.json(
        { 
          error: 'Audio storage is not configured',
          details: 'BLOB_READ_WRITE_TOKEN environment variable is required for audio generation.',
          hint: 'Add BLOB_READ_WRITE_TOKEN in your .env.local file or Vercel Project Settings > Environment Variables.'
        },
        { status: 503 }
      );
    }
    
    const { userId, bookId, chapterNumbers, voice, speed, model } = body as {
      userId: string;
      bookId: string;
      provider?: TTSProvider;
      chapterNumbers?: number[];
      voice?: VoiceId;
      speed?: number;
      model?: 'tts-1' | 'tts-1-hd';
    };

    // Validate required fields
    if (!userId || !bookId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, bookId' },
        { status: 400 }
      );
    }

    // Ensure demo user exists
    await ensureDemoUser(userId);

    // Get book with chapters
    const book = await getBookWithChapters(bookId);
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Set default voice based on provider
    const defaultVoice = provider === 'gemini' ? 'Kore' : 'alloy';
    
    const ttsConfig = {
      provider,
      voice: voice || defaultVoice,
      speed: speed || 1.0,
      model: model || 'tts-1', // OpenAI model (cost-effective by default)
      geminiModel: 'gemini-2.5-flash-preview-tts' as const, // Gemini Flash model (faster)
    };

    console.log(`[Audio API] Generating audio for book: ${book.title} (${book.chapters.length} chapters)`);

    // If specific chapters requested
    if (chapterNumbers && chapterNumbers.length > 0) {
      console.log(`[Audio API] Generating ${chapterNumbers.length} specific chapters:`, chapterNumbers);
      const chaptersToGenerate = book.chapters
        .filter(ch => chapterNumbers.includes(ch.chapterNumber))
        .map(ch => ({
          number: ch.chapterNumber,
          text: ch.content,
          title: ch.title,
        }));

      if (chaptersToGenerate.length === 0) {
        return NextResponse.json(
          { error: 'No valid chapters found' },
          { status: 400 }
        );
      }

      // Check if any chapters already have audio (for regeneration)
      const chaptersWithExistingAudio = book.chapters
        .filter(ch => chapterNumbers.includes(ch.chapterNumber) && ch.audioUrl)
        .map(ch => ch.chapterNumber);
      
      if (chaptersWithExistingAudio.length > 0) {
        console.log(`[Audio API] Regenerating ${chaptersWithExistingAudio.length} chapters with existing audio:`, chaptersWithExistingAudio);
      }

      const audioResults = await ttsService.generateMultipleChapters(
        chaptersToGenerate,
        book.title,
        ttsConfig
      );

      console.log(`[Audio API] Generated audio for ${audioResults.length} chapters`);

      // Save audio URLs to database (this will overwrite existing audio URLs for regeneration)
      for (const audioResult of audioResults) {
        const chapter = await getChapterByBookAndNumber(book.id, audioResult.chapterNumber);
        if (chapter) {
          await updateChapterAudio(
            chapter.id,
            audioResult.audioUrl,
            audioResult.duration,
            {
              provider: ttsConfig.provider,
              voice: ttsConfig.voice,
              speed: ttsConfig.speed,
              model: ttsConfig.provider === 'gemini' ? ttsConfig.geminiModel : ttsConfig.model,
              generatedAt: new Date().toISOString(),
            }
          );
          const wasRegenerated = chaptersWithExistingAudio.includes(audioResult.chapterNumber);
          console.log(`[Audio API] ${wasRegenerated ? 'Regenerated' : 'Saved'} audio URL for chapter ${audioResult.chapterNumber}`);
        }
      }

      console.log(`[Audio API] Successfully completed chapter audio generation`);
      return NextResponse.json({
        success: true,
        type: 'chapters',
        chapters: audioResults,
      });
    }

    // Generate full audiobook
    // Note: This will overwrite any existing full audiobook file with the same filename
    const fullText = book.chapters
      .sort((a, b) => a.chapterNumber - b.chapterNumber)
      .map(ch => `Chapter ${ch.chapterNumber}: ${ch.title}\n\n${ch.content}`)
      .join('\n\n---\n\n');

    const audioResult = await ttsService.generateAudiobook(
      fullText,
      ttsConfig,
      book.title
    );

    console.log(`[Audio API] Full audiobook generated: ${audioResult.audioUrl}`);

    return NextResponse.json({
      success: true,
      type: 'full',
      audioUrl: audioResult.audioUrl,
      duration: audioResult.duration,
      size: audioResult.size,
    });
  } catch (error) {
    console.error('[Audio API] Error generating audio:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[Audio API] Error details:', {
      message: errorMessage,
      stack: errorStack,
      type: error instanceof Error ? error.constructor.name : typeof error
    });
    
    // Provide helpful error messages for common issues
    let hint = '';
    if (errorMessage.includes('BLOB') || errorMessage.includes('blob')) {
      hint = 'Blob storage error. Check that BLOB_READ_WRITE_TOKEN is set in your environment variables.';
    } else if (errorMessage.includes('OPENAI') || errorMessage.includes('OpenAI')) {
      hint = 'OpenAI API error. Verify OPENAI_API_KEY is correctly set and has TTS access.';
    } else if (errorMessage.includes('GEMINI') || errorMessage.includes('Gemini')) {
      hint = 'Gemini API error. Verify GEMINI_API_KEY or GOOGLE_AI_API_KEY is correctly set.';
    } else if (errorMessage.includes('fetch')) {
      hint = 'Network error. Check your internet connection and API endpoints.';
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate audio', 
        details: errorMessage,
        hint: hint || undefined
      },
      { status: 500 }
    );
  }
}
