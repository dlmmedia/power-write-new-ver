import { NextRequest, NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';

export const maxDuration = 30; // 30 seconds for preview generation

// OpenAI TTS voices with their preview texts
const VOICE_PREVIEWS: Record<string, string> = {
  alloy: "Hello, I'm Morgan Blake. I bring clarity and precision to every word, making complex topics accessible and engaging for all listeners.",
  ash: "Greetings, I'm Alexander Grey. My voice carries the weight of experience, perfect for compelling narratives and thought-provoking content.",
  ballad: "Welcome, I'm Sophia Nightingale. Let me take you on a journey through stories that touch the heart and stir the imagination.",
  coral: "Hi there, I'm Camille Rose. My warmth and energy bring life to every story, from adventure tales to heartfelt memoirs.",
  echo: "Good day, I'm Sebastian Cross. I offer a contemplative presence, ideal for philosophical works and scholarly narratives.",
  fable: "Hello and welcome! I'm Aurora Winters, your guide to magical worlds and creative adventures. Let your imagination soar!",
  nova: "Hi, I'm Victoria Sterling. With polish and professionalism, I deliver business content, leadership insights, and compelling biographies.",
  onyx: "I'm Marcus Ashford. My commanding voice brings authority to investigative content, mysteries, and historical narratives.",
  sage: "Greetings, I'm Professor Elena Sage. I specialize in educational content, bringing knowledge to life with clarity and patience.",
  shimmer: "Hello, I'm Isabella Chen. Let me guide you through moments of calm and reflection with gentle, soothing narration.",
  verse: "Hi, I'm Julian Verse. Poetry, literature, and the arts are my domain. Let words flow like music through your ears.",
};

// Cache TTL in seconds (24 hours)
const CACHE_TTL = 86400;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const voice = searchParams.get('voice');

    if (!voice || !VOICE_PREVIEWS[voice]) {
      return NextResponse.json(
        { error: 'Invalid voice. Available voices: ' + Object.keys(VOICE_PREVIEWS).join(', ') },
        { status: 400 }
      );
    }

    // Check environment variables
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: 'Blob storage not configured' },
        { status: 500 }
      );
    }

    // Check if preview already exists in blob storage
    const previewPath = `voice-previews/${voice}-preview.mp3`;
    
    try {
      const { blobs } = await list({
        prefix: previewPath,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      if (blobs.length > 0) {
        // Check if cached preview is still valid (created within last 24 hours)
        const existingBlob = blobs[0];
        const uploadedAt = new Date(existingBlob.uploadedAt).getTime();
        const now = Date.now();
        
        if (now - uploadedAt < CACHE_TTL * 1000) {
          console.log(`[Voice Preview] Returning cached preview for ${voice}`);
          return NextResponse.json({
            success: true,
            voice,
            audioUrl: existingBlob.url,
            cached: true,
          });
        } else {
          // Delete expired preview
          await del(existingBlob.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
        }
      }
    } catch (listError) {
      console.log('[Voice Preview] No cached preview found, generating new one');
    }

    // Generate new preview
    console.log(`[Voice Preview] Generating preview for ${voice}...`);
    
    const previewText = VOICE_PREVIEWS[voice];
    
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice,
        input: previewText,
        speed: 1.0,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Voice Preview] OpenAI API error: ${response.status} ${errorText}`);
      return NextResponse.json(
        { error: `OpenAI TTS API error: ${response.status}` },
        { status: 500 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to blob storage
    const blob = await put(previewPath, buffer, {
      access: 'public',
      contentType: 'audio/mpeg',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log(`[Voice Preview] Generated and cached preview for ${voice}: ${blob.url}`);

    return NextResponse.json({
      success: true,
      voice,
      audioUrl: blob.url,
      cached: false,
    });
  } catch (error) {
    console.error('[Voice Preview] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate voice preview' },
      { status: 500 }
    );
  }
}

// Endpoint to regenerate all previews (for admin use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { regenerate, voice } = body;

    if (!process.env.OPENAI_API_KEY || !process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: 'API not configured' }, { status: 500 });
    }

    const voicesToGenerate = voice ? [voice] : Object.keys(VOICE_PREVIEWS);
    const results: Array<{ voice: string; audioUrl?: string; error?: string }> = [];

    for (const v of voicesToGenerate) {
      if (!VOICE_PREVIEWS[v]) {
        results.push({ voice: v, error: 'Invalid voice' });
        continue;
      }

      try {
        const previewText = VOICE_PREVIEWS[v];
        
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'tts-1',
            voice: v,
            input: previewText,
            speed: 1.0,
            response_format: 'mp3',
          }),
        });

        if (!response.ok) {
          results.push({ voice: v, error: `API error: ${response.status}` });
          continue;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const blob = await put(`voice-previews/${v}-preview.mp3`, buffer, {
          access: 'public',
          contentType: 'audio/mpeg',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        results.push({ voice: v, audioUrl: blob.url });

        // Small delay between API calls
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        results.push({ voice: v, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('[Voice Preview POST] Error:', error);
    return NextResponse.json({ error: 'Failed to regenerate previews' }, { status: 500 });
  }
}



