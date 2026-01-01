import { NextRequest, NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';
import type { GeminiVoiceId } from '@/lib/services/tts-service';

export const maxDuration = 60; // 60 seconds for preview generation (Gemini may take longer)

// OpenAI TTS voices with their preview texts (all 11 voices)
const OPENAI_VOICE_PREVIEWS: Record<string, string> = {
  alloy: "Hello, I'm Morgan Blake. I bring clarity and precision to every word, making complex topics accessible and engaging for all listeners.",
  ash: "Greetings, I'm Alexander Grey. My voice carries the weight of experience, perfect for compelling narratives and thought-provoking content.",
  ballad: "Hello, I'm Sophia Nightingale. My melodic voice weaves through stories with emotion and grace, perfect for romance and literary fiction.",
  coral: "Hi there, I'm Camille Rose. My warmth and energy bring life to every story, from adventure tales to heartfelt memoirs.",
  echo: "Good day, I'm Sebastian Cross. I offer a contemplative presence, ideal for philosophical works and scholarly narratives.",
  fable: "Hello and welcome! I'm Aurora Winters, your guide to magical worlds and creative adventures. Let your imagination soar!",
  nova: "Hi, I'm Victoria Sterling. With polish and professionalism, I deliver business content, leadership insights, and compelling biographies.",
  onyx: "I'm Marcus Ashford. My commanding voice brings authority to investigative content, mysteries, and historical narratives.",
  sage: "Greetings, I'm Professor Elena Sage. I specialize in educational content, bringing knowledge to life with clarity and patience.",
  shimmer: "Hello, I'm Isabella Chen. Let me guide you through moments of calm and reflection with gentle, soothing narration.",
  verse: "Greetings, I'm Julian Verse. My poetic voice brings artistry and lyrical beauty to literature, poetry, and artistic works.",
};

// Gemini TTS voices with their preview texts (30 voices)
const GEMINI_VOICE_PREVIEWS: Record<string, string> = {
  // Primary voices with distinct personalities
  Zephyr: "Hello, I'm Zephyr. My voice carries the gentle breeze of conversation, perfect for friendly and approachable content.",
  Puck: "Hi there! I'm Puck, bringing energy and enthusiasm to every story. My upbeat tone makes learning fun and engaging!",
  Charon: "Greetings. I'm Charon, offering a deep and authoritative presence for serious narratives and documentary content.",
  Kore: "Hello, I'm Kore. I deliver balanced, professional narration with clarity and precision for any content type.",
  Fenrir: "Welcome. I'm Fenrir, bringing warmth and approachability to your audiobooks and educational materials.",
  Leda: "Hi, I'm Leda. My voice brings elegance and sophistication to literary works and refined storytelling.",
  Orus: "Greetings, I'm Orus. I specialize in clear, articulate narration perfect for technical and educational content.",
  Aoede: "Hello! I'm Aoede, your guide for creative and artistic content with expressive, dynamic delivery.",
  
  // Extended voice collection
  Callirrhoe: "Hello, I'm Callirrhoe. My flowing voice brings grace and beauty to poetry and lyrical narratives.",
  Autonoe: "Hi there, I'm Autonoe. I offer a natural, conversational tone perfect for interviews and discussions.",
  Enceladus: "Greetings. I'm Enceladus, bringing a breathy, gentle quality ideal for intimate storytelling and meditation.",
  Iapetus: "Welcome, I'm Iapetus. My voice carries wisdom and depth for philosophical and contemplative works.",
  Umbriel: "Hello, I'm Umbriel. I deliver mysterious and atmospheric narration for fantasy and thriller content.",
  Algieba: "Hi, I'm Algieba. My bright, clear voice is perfect for children's content and educational materials.",
  Despina: "Hello! I'm Despina, bringing cheerful energy to lifestyle content and uplifting narratives.",
  Erinome: "Greetings, I'm Erinome. I specialize in dramatic readings with emotional depth and range.",
  
  // Stellar-named voices
  Algenib: "Hello, I'm Algenib. My voice shines with clarity for scientific and informational content.",
  Rasalgethi: "Welcome. I'm Rasalgethi, offering a commanding presence for historical and epic narratives.",
  Laomedeia: "Hi there, I'm Laomedeia. My soothing voice is ideal for wellness and self-help content.",
  Achernar: "Hello, I'm Achernar. I bring a crisp, professional tone to business and corporate content.",
  Alnilam: "Greetings, I'm Alnilam. My voice carries strength and conviction for motivational content.",
  Schedar: "Hi, I'm Schedar. I deliver warm, nurturing narration perfect for family-friendly content.",
  Gacrux: "Hello! I'm Gacrux, bringing clarity and precision to technical documentation and tutorials.",
  Pulcherrima: "Welcome, I'm Pulcherrima. My elegant voice enhances romantic and literary fiction.",
  Achird: "Hello, I'm Achird. I offer a friendly, relatable tone for memoir and personal stories.",
  Zubenelgenubi: "Greetings, I'm Zubenelgenubi. My distinctive voice adds character to unique creative projects.",
  Vindemiatrix: "Hi there, I'm Vindemiatrix. I bring sophistication to cultural and artistic content.",
  Sadachbia: "Hello, I'm Sadachbia. My voice conveys hope and optimism for inspirational narratives.",
  Sadaltager: "Welcome. I'm Sadaltager, offering a thoughtful presence for reflective and mindful content.",
  Sulafat: "Hi, I'm Sulafat. I deliver versatile narration that adapts to any genre or style.",
};

// Combined previews for backwards compatibility
const VOICE_PREVIEWS: Record<string, string> = {
  ...OPENAI_VOICE_PREVIEWS,
  ...GEMINI_VOICE_PREVIEWS,
};

// Cache TTL in seconds (24 hours)
const CACHE_TTL = 86400;

// Gemini API URL
const GEMINI_TTS_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Helper to determine if a voice is a Gemini voice
function isGeminiVoice(voice: string): boolean {
  return voice in GEMINI_VOICE_PREVIEWS;
}

// Helper to convert PCM to WAV
function pcmToWav(pcmBuffer: Buffer, sampleRate: number, channels: number, bitsPerSample: number): Buffer {
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const headerSize = 44;
  const fileSize = headerSize + dataSize - 8;

  const wavBuffer = Buffer.alloc(headerSize + dataSize);
  
  // RIFF header
  wavBuffer.write('RIFF', 0);
  wavBuffer.writeUInt32LE(fileSize, 4);
  wavBuffer.write('WAVE', 8);
  
  // fmt chunk
  wavBuffer.write('fmt ', 12);
  wavBuffer.writeUInt32LE(16, 16);
  wavBuffer.writeUInt16LE(1, 20);
  wavBuffer.writeUInt16LE(channels, 22);
  wavBuffer.writeUInt32LE(sampleRate, 24);
  wavBuffer.writeUInt32LE(byteRate, 28);
  wavBuffer.writeUInt16LE(blockAlign, 32);
  wavBuffer.writeUInt16LE(bitsPerSample, 34);
  
  // data chunk
  wavBuffer.write('data', 36);
  wavBuffer.writeUInt32LE(dataSize, 40);
  pcmBuffer.copy(wavBuffer, 44);
  
  return wavBuffer;
}

export async function GET(request: NextRequest) {
  let voice: string | null = null;
  let isGemini = false;
  
  try {
    const searchParams = request.nextUrl.searchParams;
    voice = searchParams.get('voice');

    if (!voice || !VOICE_PREVIEWS[voice]) {
      return NextResponse.json(
        { error: 'Invalid voice. Available voices: ' + Object.keys(VOICE_PREVIEWS).join(', ') },
        { status: 400 }
      );
    }

    isGemini = isGeminiVoice(voice);
    const fileExtension = isGemini ? 'wav' : 'mp3';
    const contentType = isGemini ? 'audio/wav' : 'audio/mpeg';

    // Check environment variables based on provider
    // Support both GEMINI_API_KEY and GOOGLE_AI_API_KEY for backwards compatibility
    if (isGemini) {
      if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_AI_API_KEY) {
        return NextResponse.json(
          { error: 'Gemini API key not configured. Set GEMINI_API_KEY or GOOGLE_AI_API_KEY.' },
          { status: 500 }
        );
      }
    } else {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured' },
          { status: 500 }
        );
      }
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: 'Blob storage not configured' },
        { status: 500 }
      );
    }

    // Check if preview already exists in blob storage
    const previewPath = `voice-previews/${voice}-preview.${fileExtension}`;
    
    try {
      const { blobs } = await list({
        prefix: previewPath,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      if (blobs.length > 0) {
        const existingBlob = blobs[0];
        const uploadedAt = new Date(existingBlob.uploadedAt).getTime();
        const now = Date.now();
        
        if (now - uploadedAt < CACHE_TTL * 1000) {
          console.log(`[Voice Preview] Returning cached preview for ${voice} (${isGemini ? 'Gemini' : 'OpenAI'})`);
          return NextResponse.json({
            success: true,
            voice,
            provider: isGemini ? 'gemini' : 'openai',
            audioUrl: existingBlob.url,
            cached: true,
          });
        } else {
          await del(existingBlob.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
        }
      }
    } catch (listError) {
      console.log('[Voice Preview] No cached preview found, generating new one');
    }

    // Generate new preview
    console.log(`[Voice Preview] Generating preview for ${voice} using ${isGemini ? 'Gemini' : 'OpenAI'}...`);
    
    const previewText = VOICE_PREVIEWS[voice];
    let buffer: Buffer;

    if (isGemini) {
      // Generate using Gemini TTS (Flash model for faster response)
      const geminiModel = 'gemini-2.5-flash-preview-tts';
      const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
      const url = `${GEMINI_TTS_API_URL}/${geminiModel}:generateContent?key=${geminiApiKey}`;
      
      const requestBody = {
        contents: [{
          parts: [{ text: previewText }]
        }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice
              }
            }
          }
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Voice Preview] Gemini API error: ${response.status} ${errorText}`);
        
        // Parse the error for more specific messaging
        let errorMessage = `Gemini TTS API error: ${response.status}`;
        let errorDetails = '';
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.message) {
            errorDetails = errorJson.error.message;
            // Handle specific error cases
            if (errorDetails.includes('leaked') || errorDetails.includes('API key was reported')) {
              errorMessage = 'Gemini API key has been disabled';
              errorDetails = 'Your API key was flagged as leaked by Google. Please generate a new key at https://aistudio.google.com/app/apikey and update GEMINI_API_KEY or GOOGLE_AI_API_KEY in your .env.local file.';
            } else if (response.status === 403) {
              errorMessage = 'Gemini API access denied';
              errorDetails = 'Check that your API key is valid and has access to the Gemini TTS API.';
            } else if (response.status === 429) {
              errorMessage = 'Gemini API rate limit exceeded';
              errorDetails = 'Please wait a moment and try again.';
            }
          }
        } catch {
          // Use default error message
        }
        
        return NextResponse.json(
          { error: errorMessage, details: errorDetails },
          { status: 500 }
        );
      }

      const data = await response.json();
      const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (!audioData) {
        console.error('[Voice Preview] No audio data in Gemini response');
        return NextResponse.json(
          { error: 'No audio data in Gemini response' },
          { status: 500 }
        );
      }

      // Decode base64 and convert PCM to WAV
      const pcmBuffer = Buffer.from(audioData, 'base64');
      buffer = pcmToWav(pcmBuffer, 24000, 1, 16);
    } else {
      // Generate using OpenAI TTS
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
      buffer = Buffer.from(arrayBuffer);
    }

    // Upload to blob storage
    const blob = await put(previewPath, buffer, {
      access: 'public',
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log(`[Voice Preview] Generated and cached preview for ${voice}: ${blob.url}`);

    return NextResponse.json({
      success: true,
      voice,
      provider: isGemini ? 'gemini' : 'openai',
      audioUrl: blob.url,
      cached: false,
    });
  } catch (error) {
    console.error('[Voice Preview] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    console.error('[Voice Preview] Error details:', errorDetails);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate voice preview',
        details: errorMessage,
        voice: voice || 'unknown',
        provider: voice ? (isGeminiVoice(voice) ? 'gemini' : 'openai') : 'unknown'
      },
      { status: 500 }
    );
  }
}

// Endpoint to regenerate all previews (for admin use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { regenerate, voice, provider } = body;

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: 'Blob storage not configured' }, { status: 500 });
    }

    // Determine which voices to generate based on provider filter
    let voicesToGenerate: string[];
    if (voice) {
      voicesToGenerate = [voice];
    } else if (provider === 'gemini') {
      voicesToGenerate = Object.keys(GEMINI_VOICE_PREVIEWS);
    } else if (provider === 'openai') {
      voicesToGenerate = Object.keys(OPENAI_VOICE_PREVIEWS);
    } else {
      voicesToGenerate = Object.keys(VOICE_PREVIEWS);
    }

    const results: Array<{ voice: string; provider: string; audioUrl?: string; error?: string }> = [];

    for (const v of voicesToGenerate) {
      if (!VOICE_PREVIEWS[v]) {
        results.push({ voice: v, provider: 'unknown', error: 'Invalid voice' });
        continue;
      }

      const isGemini = isGeminiVoice(v);
      
      // Check API key availability
      if (isGemini && !process.env.GEMINI_API_KEY && !process.env.GOOGLE_AI_API_KEY) {
        results.push({ voice: v, provider: 'gemini', error: 'Gemini API key not configured' });
        continue;
      }
      if (!isGemini && !process.env.OPENAI_API_KEY) {
        results.push({ voice: v, provider: 'openai', error: 'OpenAI API key not configured' });
        continue;
      }

      try {
        const previewText = VOICE_PREVIEWS[v];
        let buffer: Buffer;
        const fileExtension = isGemini ? 'wav' : 'mp3';
        const contentType = isGemini ? 'audio/wav' : 'audio/mpeg';

        if (isGemini) {
          // Generate using Gemini TTS (Flash model for faster response)
          const geminiModel = 'gemini-2.5-flash-preview-tts';
          const geminiApiKeyPost = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
          const url = `${GEMINI_TTS_API_URL}/${geminiModel}:generateContent?key=${geminiApiKeyPost}`;
          
          const requestBody = {
            contents: [{
              parts: [{ text: previewText }]
            }],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: v
                  }
                }
              }
            }
          };

          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            let errorMsg = `Gemini API error: ${response.status}`;
            try {
              const errorText = await response.text();
              const errorJson = JSON.parse(errorText);
              if (errorJson.error?.message?.includes('leaked')) {
                errorMsg = 'API key disabled - flagged as leaked. Generate a new key at https://aistudio.google.com/app/apikey';
              }
            } catch {}
            results.push({ voice: v, provider: 'gemini', error: errorMsg });
            continue;
          }

          const data = await response.json();
          const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          
          if (!audioData) {
            results.push({ voice: v, provider: 'gemini', error: 'No audio data in response' });
            continue;
          }

          const pcmBuffer = Buffer.from(audioData, 'base64');
          buffer = pcmToWav(pcmBuffer, 24000, 1, 16);
        } else {
          // Generate using OpenAI TTS
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
            results.push({ voice: v, provider: 'openai', error: `OpenAI API error: ${response.status}` });
            continue;
          }

          const arrayBuffer = await response.arrayBuffer();
          buffer = Buffer.from(arrayBuffer);
        }

        const blob = await put(`voice-previews/${v}-preview.${fileExtension}`, buffer, {
          access: 'public',
          contentType,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        results.push({ voice: v, provider: isGemini ? 'gemini' : 'openai', audioUrl: blob.url });

        // Delay between API calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, isGemini ? 1000 : 500));
      } catch (err) {
        results.push({ voice: v, provider: isGemini ? 'gemini' : 'openai', error: err instanceof Error ? err.message : 'Unknown error' });
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

