
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookChapters } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const maxDuration = 300; // 5 minutes max for alignment

export async function POST(request: NextRequest) {
  try {
    const { chapterId } = await request.json();

    if (!chapterId) {
      return NextResponse.json(
        { error: 'Chapter ID is required' },
        { status: 400 }
      );
    }

    // 1. Fetch chapter data
    const chapter = await db.query.bookChapters.findFirst({
      where: eq(bookChapters.id, chapterId),
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    if (!chapter.audioUrl) {
      return NextResponse.json(
        { error: 'Chapter has no audio URL' },
        { status: 400 }
      );
    }

    // 2. Fetch the audio file
    console.log(`[Alignment] Fetching audio for chapter ${chapterId} from ${chapter.audioUrl}`);
    const audioResponse = await fetch(chapter.audioUrl);
    
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio file: ${audioResponse.statusText}`);
    }

    const audioBlob = await audioResponse.blob();
    const file = new File([audioBlob], 'audio.mp3', { type: 'audio/mpeg' });

    // 3. Call OpenAI Whisper API for timestamped transcription
    console.log('[Alignment] Calling Whisper API...');
    
    // We need to use the native OpenAI SDK or fetch directly because ai-sdk doesn't support audio/transcriptions yet
    // Or we can use a direct fetch to OpenAI API
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'word');

    const openAiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!openAiResponse.ok) {
      const error = await openAiResponse.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await openAiResponse.json();
    
    if (!data.words) {
      throw new Error('No word timestamps received from Whisper API');
    }

    // 4. Save alignment data
    const audioTimestamps = data.words.map((w: any) => ({
      word: w.word,
      start: w.start,
      end: w.end,
    }));

    await db
      .update(bookChapters)
      .set({ 
        audioTimestamps: audioTimestamps,
        updatedAt: new Date(),
      })
      .where(eq(bookChapters.id, chapterId));

    console.log(`[Alignment] Saved ${audioTimestamps.length} word timestamps for chapter ${chapterId}`);

    return NextResponse.json({
      success: true,
      count: audioTimestamps.length,
      audioTimestamps: audioTimestamps, // Return timestamps directly for immediate use
    });

  } catch (error) {
    console.error('[Alignment] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate alignment' },
      { status: 500 }
    );
  }
}
