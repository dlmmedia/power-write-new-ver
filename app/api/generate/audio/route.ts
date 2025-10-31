import { NextRequest, NextResponse } from 'next/server';
import { ttsService } from '@/lib/services/tts-service';
import { ensureDemoUser, getBookWithChapters, getChapterByBookAndNumber, updateChapterAudio } from '@/lib/db/operations';

export const maxDuration = 300; // 5 minutes for audio generation

export async function POST(request: NextRequest) {
  try {
    // Check environment variables first
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      return NextResponse.json(
        { 
          error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.',
          hint: 'For Vercel deployments, add OPENAI_API_KEY in Project Settings > Environment Variables'
        },
        { status: 500 }
      );
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn('⚠️ BLOB_READ_WRITE_TOKEN is not set. Audio uploads may fail.');
      // Don't fail immediately - @vercel/blob might auto-detect in Vercel deployments
    }

    const body = await request.json();
    const { userId, bookId, chapterNumbers, voice, speed, model } = body as {
      userId: string;
      bookId: string;
      chapterNumbers?: number[]; // If specified, generate only these chapters
      voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
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

    const ttsConfig = {
      voice: voice || 'alloy',
      speed: speed || 1.0,
      model: model || 'tts-1', // Cost-effective by default
    };

    console.log(`Generating audio for book: ${book.title}`);

    // If specific chapters requested
    if (chapterNumbers && chapterNumbers.length > 0) {
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

      const audioResults = await ttsService.generateMultipleChapters(
        chaptersToGenerate,
        book.title,
        ttsConfig
      );

      console.log(`Generated audio for ${audioResults.length} chapters`);

      // Save audio URLs to database
      for (const audioResult of audioResults) {
        const chapter = await getChapterByBookAndNumber(book.id, audioResult.chapterNumber);
        if (chapter) {
          await updateChapterAudio(
            chapter.id,
            audioResult.audioUrl,
            audioResult.duration,
            {
              voice: ttsConfig.voice,
              speed: ttsConfig.speed,
              model: ttsConfig.model,
              generatedAt: new Date().toISOString(),
            }
          );
          console.log(`Saved audio URL for chapter ${audioResult.chapterNumber}`);
        }
      }

      return NextResponse.json({
        success: true,
        type: 'chapters',
        chapters: audioResults,
      });
    }

    // Generate full audiobook
    const fullText = book.chapters
      .sort((a, b) => a.chapterNumber - b.chapterNumber)
      .map(ch => `Chapter ${ch.chapterNumber}: ${ch.title}\n\n${ch.content}`)
      .join('\n\n---\n\n');

    const audioResult = await ttsService.generateAudiobook(
      fullText,
      ttsConfig,
      book.title
    );

    console.log(`Full audiobook generated: ${audioResult.audioUrl}`);

    return NextResponse.json({
      success: true,
      type: 'full',
      audioUrl: audioResult.audioUrl,
      duration: audioResult.duration,
      size: audioResult.size,
    });
  } catch (error) {
    console.error('Error generating audio:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Provide helpful error messages for common issues
    let hint = '';
    if (errorMessage.includes('BLOB') || errorMessage.includes('blob')) {
      hint = 'Blob storage error. Check that BLOB_READ_WRITE_TOKEN is set in Vercel environment variables.';
    } else if (errorMessage.includes('OPENAI') || errorMessage.includes('API key')) {
      hint = 'OpenAI API error. Verify OPENAI_API_KEY is correctly set and has TTS access.';
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate audio', 
        details: errorMessage,
        hint: hint || undefined
      },
      { status: 500 }
    );
  }
}
