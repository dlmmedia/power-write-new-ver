import { NextRequest, NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';
import type { GeminiVoiceId } from '@/lib/services/tts-service';

export const maxDuration = 60; // 60 seconds for preview generation (Gemini may take longer)

// OpenAI TTS voices with their preview texts (9 supported voices)
const OPENAI_VOICE_PREVIEWS: Record<string, string> = {
  alloy: "Hello, I'm Morgan Blake. I bring clarity and precision to every word, making complex topics accessible and engaging for all listeners.",
  ash: "Greetings, I'm Alexander Grey. My voice carries the weight of experience, perfect for compelling narratives and thought-provoking content.",
  coral: "Hi there, I'm Camille Rose. My warmth and energy bring life to every story, from adventure tales to heartfelt memoirs.",
  echo: "Good day, I'm Sebastian Cross. I offer a contemplative presence, ideal for philosophical works and scholarly narratives.",
  fable: "Hello and welcome! I'm Aurora Winters, your guide to magical worlds and creative adventures. Let your imagination soar!",
  nova: "Hi, I'm Victoria Sterling. With polish and professionalism, I deliver business content, leadership insights, and compelling biographies.",
  onyx: "I'm Marcus Ashford. My commanding voice brings authority to investigative content, mysteries, and historical narratives.",
  sage: "Greetings, I'm Professor Elena Sage. I specialize in educational content, bringing knowledge to life with clarity and patience.",
  shimmer: "Hello, I'm Isabella Chen. Let me guide you through moments of calm and reflection with gentle, soothing narration.",
};

// Gemini TTS voices with their preview texts (30 voices)
const GEMINI_VOICE_PREVIEWS: Record<string, string> = {
  // Primary voices with distinct personalities - written as audiobook excerpts
  Zephyr: "The morning sun cast long shadows across the meadow as Sarah began her journey. With each step, the path revealed new wonders. The birds sang their welcome, and the breeze carried the scent of wildflowers.",
  Puck: "And so, the brave little fox set off on his greatest adventure yet! Through forests dark and mountains tall, nothing could stop him now. The whole world was waiting to be explored!",
  Charon: "In the year eighteen fifteen, the Congress of Vienna reshaped the map of Europe. The delegates gathered in the grand hall, their decisions destined to echo through history for generations to come.",
  Kore: "This comprehensive guide will walk you through each step of the process. First, we'll examine the fundamental principles. Then, we'll explore practical applications and real-world examples.",
  Fenrir: "Welcome to today's lesson on creative writing. We'll discover how to craft compelling characters that readers will remember long after they've finished your story.",
  Leda: "She stood at the window, watching the rain trace patterns on the glass. The old mansion held secrets within its walls, secrets that whispered through the corridors at midnight.",
  Orus: "Chapter three covers the essential techniques for data analysis. We will review statistical methods, visualization tools, and interpretation strategies used by professionals.",
  Aoede: "The canvas awaited her brush. Colors swirled in her mind like a symphony of light. Today, she would paint not what she saw, but what her heart felt.",
  
  // Extended voice collection
  Callirrhoe: "The river flows ever onward, carrying dreams to the distant sea. In its gentle current, we find the rhythm of life itself, eternal and ever-changing.",
  Autonoe: "That's a fascinating question. Let me share some insights from my research. The data suggests patterns that many people find surprising at first glance.",
  Enceladus: "Close your eyes and breathe deeply. Feel the tension leave your shoulders. With each breath, you become more relaxed, more at peace with yourself and the world around you.",
  Iapetus: "What does it mean to live a good life? This question has occupied the minds of philosophers for millennia. Perhaps the answer lies not in a destination, but in the journey itself.",
  Umbriel: "The door creaked open, revealing only darkness beyond. Something moved in the shadows. She reached for the flashlight, her heart pounding in the silence.",
  Algieba: "Once upon a time, in a land of talking animals and magical trees, there lived a curious young rabbit named Clover. Clover loved to ask questions about everything!",
  Despina: "Here are five simple ways to brighten your morning routine! Start with gratitude, move your body, and connect with someone you love. Small changes lead to big transformations.",
  Erinome: "To be, or not to be, that is the question. Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles.",
  
  // Stellar-named voices
  Algenib: "The human brain contains approximately eighty-six billion neurons. Each neuron can form thousands of connections, creating a network of staggering complexity and capability.",
  Rasalgethi: "The empire rose from humble beginnings. Through conquest and diplomacy, it expanded across three continents. This is the story of its triumph and ultimate fall.",
  Laomedeia: "Remember that self-care is not selfish. Taking time to nurture your mind and body allows you to show up fully for the people and causes you care about most.",
  Achernar: "Our quarterly report shows significant growth across all key metrics. Revenue increased by twelve percent, while customer satisfaction scores reached an all-time high.",
  Alnilam: "You have the power to change your life. Every great achievement begins with a single step. Today is the day to take that step. Your future self will thank you.",
  Schedar: "Gather round, children, and I'll tell you the tale of the moonbeam princess. She lived in a castle made of clouds and dreamed of visiting the world below.",
  Gacrux: "Step one: initialize the development environment. Step two: configure the build settings. Step three: run the test suite to verify all components are functioning correctly.",
  Pulcherrima: "Their eyes met across the crowded ballroom. In that moment, nothing else existed. The music faded, the dancers blurred, and only they remained, suspended in time.",
  Achird: "I remember the summer of nineteen eighty-seven like it was yesterday. The smell of my grandmother's kitchen, the sound of laughter in the backyard, the feeling of endless possibility.",
  Zubenelgenubi: "The artifact glowed with an otherworldly light. Dr. Chen examined the inscriptions, realizing with growing excitement that this discovery would rewrite everything we thought we knew.",
  Vindemiatrix: "The symphony began with a single violin, its melody rising like morning mist. Soon, the full orchestra joined, creating a tapestry of sound that moved the audience to tears.",
  Sadachbia: "Tomorrow holds infinite possibilities. Every sunrise brings a chance to begin again, to create, to love, to grow. Hope is not just a feeling—it's a choice we make every day.",
  Sadaltager: "Take a moment to simply be present. Notice the rhythm of your breath, the sensations in your body. In this stillness, wisdom emerges naturally, like light through clouds.",
  Sulafat: "The market opened strong, with tech stocks leading the rally. Analysts pointed to improved earnings forecasts and renewed consumer confidence as key drivers of the upward trend.",
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
          // Validate that the blob URL actually exists before returning it
          // Add cache-busting query to avoid CDN caching issues
          const validateUrl = `${existingBlob.url}?_t=${Date.now()}`;
          
          let isValid = false;
          let lastError: unknown = null;
          
          // Retry validation up to 2 times with a short delay
          for (let attempt = 0; attempt < 2 && !isValid; attempt++) {
            try {
              const headResponse = await fetch(validateUrl, { 
                method: 'HEAD',
                cache: 'no-store',
              });
              if (headResponse.ok) {
                isValid = true;
              } else if (headResponse.status === 404 && attempt === 0) {
                // Wait a bit before retrying - might be CDN propagation delay
                await new Promise(resolve => setTimeout(resolve, 500));
              } else {
                lastError = new Error(`HTTP ${headResponse.status}`);
              }
            } catch (err) {
              lastError = err;
              if (attempt === 0) {
                // Wait before retry on network error
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
          }
          
          if (isValid) {
            console.log(`[Voice Preview] Returning cached preview for ${voice} (${isGemini ? 'Gemini' : 'OpenAI'})`);
            return NextResponse.json({
              success: true,
              voice,
              provider: isGemini ? 'gemini' : 'openai',
              audioUrl: existingBlob.url,
              cached: true,
            });
          } else {
            // Blob URL is invalid after retries, delete it and regenerate
            console.warn(`[Voice Preview] Cached blob URL invalid after validation, deleting and regenerating...`);
            try {
              await del(existingBlob.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
            } catch (delError) {
              console.warn('[Voice Preview] Failed to delete invalid blob:', delError);
            }
            // Continue to generate new preview below
          }
        } else {
          // Blob is expired, delete it
          try {
            await del(existingBlob.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
          } catch (delError) {
            console.warn('[Voice Preview] Failed to delete expired blob:', delError);
          }
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

    // Upload to blob storage with consistent URL (no random suffix)
    const blob = await put(previewPath, buffer, {
      access: 'public',
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
    });

    console.log(`[Voice Preview] Generated and cached preview for ${voice}: ${blob.url}`);

    // Wait a brief moment for blob to propagate through CDN
    // This helps ensure the URL is accessible when the client tries to play it
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify the blob is accessible before returning
    let retries = 3;
    let blobReady = false;
    while (retries > 0 && !blobReady) {
      try {
        const checkResponse = await fetch(blob.url, { method: 'HEAD', cache: 'no-store' });
        if (checkResponse.ok) {
          blobReady = true;
        } else {
          console.log(`[Voice Preview] Blob not ready yet (${checkResponse.status}), retrying...`);
          await new Promise(resolve => setTimeout(resolve, 500));
          retries--;
        }
      } catch (err) {
        console.log(`[Voice Preview] Error checking blob availability, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        retries--;
      }
    }

    if (!blobReady) {
      console.warn(`[Voice Preview] Blob may not be immediately available, returning URL anyway: ${blob.url}`);
    }

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
          addRandomSuffix: false,
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

