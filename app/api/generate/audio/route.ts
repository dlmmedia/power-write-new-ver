import { NextRequest, NextResponse } from 'next/server';
import { ttsService } from '@/lib/services/tts-service';
import { ensureDemoUser, getBookWithChapters, getChapterByBookAndNumber, updateChapterAudio } from '@/lib/db/operations';

export const maxDuration = 300; // 5 minutes for audio generation

export async function POST(request: NextRequest) {
  try {
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
    return NextResponse.json(
      { 
        error: 'Failed to generate audio', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
