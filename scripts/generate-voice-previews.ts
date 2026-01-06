#!/usr/bin/env npx ts-node
/**
 * Script to generate and save voice preview audio files to public/voice-previews/
 * 
 * Usage:
 *   npx ts-node scripts/generate-voice-previews.ts
 *   npx ts-node scripts/generate-voice-previews.ts --provider openai
 *   npx ts-node scripts/generate-voice-previews.ts --provider gemini
 *   npx ts-node scripts/generate-voice-previews.ts --voice nova
 * 
 * Environment variables required:
 *   OPENAI_API_KEY - For OpenAI TTS
 *   GEMINI_API_KEY or GOOGLE_AI_API_KEY - For Gemini TTS
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

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

// Gemini TTS voices with their preview texts
const GEMINI_VOICE_PREVIEWS: Record<string, string> = {
  Zephyr: "The morning sun cast long shadows across the meadow as Sarah began her journey. With each step, the path revealed new wonders. The birds sang their welcome, and the breeze carried the scent of wildflowers.",
  Puck: "And so, the brave little fox set off on his greatest adventure yet! Through forests dark and mountains tall, nothing could stop him now. The whole world was waiting to be explored!",
  Charon: "In the year eighteen fifteen, the Congress of Vienna reshaped the map of Europe. The delegates gathered in the grand hall, their decisions destined to echo through history for generations to come.",
  Kore: "This comprehensive guide will walk you through each step of the process. First, we'll examine the fundamental principles. Then, we'll explore practical applications and real-world examples.",
  Fenrir: "Welcome to today's lesson on creative writing. We'll discover how to craft compelling characters that readers will remember long after they've finished your story.",
  Leda: "She stood at the window, watching the rain trace patterns on the glass. The old mansion held secrets within its walls, secrets that whispered through the corridors at midnight.",
  Orus: "Chapter three covers the essential techniques for data analysis. We will review statistical methods, visualization tools, and interpretation strategies used by professionals.",
  Aoede: "The canvas awaited her brush. Colors swirled in her mind like a symphony of light. Today, she would paint not what she saw, but what her heart felt.",
  Callirrhoe: "The river flows ever onward, carrying dreams to the distant sea. In its gentle current, we find the rhythm of life itself, eternal and ever-changing.",
  Autonoe: "That's a fascinating question. Let me share some insights from my research. The data suggests patterns that many people find surprising at first glance.",
  Enceladus: "Close your eyes and breathe deeply. Feel the tension leave your shoulders. With each breath, you become more relaxed, more at peace with yourself and the world around you.",
  Iapetus: "What does it mean to live a good life? This question has occupied the minds of philosophers for millennia. Perhaps the answer lies not in a destination, but in the journey itself.",
  Umbriel: "The door creaked open, revealing only darkness beyond. Something moved in the shadows. She reached for the flashlight, her heart pounding in the silence.",
  Algieba: "Once upon a time, in a land of talking animals and magical trees, there lived a curious young rabbit named Clover. Clover loved to ask questions about everything!",
  Despina: "Here are five simple ways to brighten your morning routine! Start with gratitude, move your body, and connect with someone you love. Small changes lead to big transformations.",
  Erinome: "To be, or not to be, that is the question. Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles.",
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

async function generateOpenAIPreview(voice: string, text: string, outputPath: string): Promise<boolean> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY not set');
    return false;
  }

  try {
    console.log(`  Generating OpenAI preview for ${voice}...`);
    
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice,
        input: text,
        speed: 1.0,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  ❌ OpenAI API error for ${voice}: ${response.status} ${errorText}`);
      return false;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    fs.writeFileSync(outputPath, buffer);
    console.log(`  ✅ Saved: ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error generating ${voice}:`, error);
    return false;
  }
}

async function generateGeminiPreview(voice: string, text: string, outputPath: string): Promise<boolean> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY or GOOGLE_AI_API_KEY not set');
    return false;
  }

  try {
    console.log(`  Generating Gemini preview for ${voice}...`);
    
    const geminiModel = 'gemini-2.5-flash-preview-tts';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [{
        parts: [{ text }]
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  ❌ Gemini API error for ${voice}: ${response.status} ${errorText}`);
      return false;
    }

    const data = await response.json();
    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!audioData) {
      console.error(`  ❌ No audio data in Gemini response for ${voice}`);
      return false;
    }

    // Decode base64 and convert PCM to WAV
    const pcmBuffer = Buffer.from(audioData, 'base64');
    const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
    
    fs.writeFileSync(outputPath, wavBuffer);
    console.log(`  ✅ Saved: ${outputPath} (${(wavBuffer.length / 1024).toFixed(1)} KB)`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error generating ${voice}:`, error);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  let providerFilter: 'openai' | 'gemini' | null = null;
  let voiceFilter: string | null = null;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--provider' && args[i + 1]) {
      providerFilter = args[i + 1] as 'openai' | 'gemini';
      i++;
    } else if (args[i] === '--voice' && args[i + 1]) {
      voiceFilter = args[i + 1];
      i++;
    }
  }

  // Create output directory
  const outputDir = path.join(process.cwd(), 'public', 'voice-previews');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created directory: ${outputDir}`);
  }

  let successCount = 0;
  let failCount = 0;

  // Generate OpenAI previews
  if (!providerFilter || providerFilter === 'openai') {
    console.log('\n🎙️ Generating OpenAI voice previews...');
    const openaiVoices = voiceFilter 
      ? Object.entries(OPENAI_VOICE_PREVIEWS).filter(([v]) => v === voiceFilter)
      : Object.entries(OPENAI_VOICE_PREVIEWS);

    for (const [voice, text] of openaiVoices) {
      const outputPath = path.join(outputDir, `openai-${voice}-preview.mp3`);
      const success = await generateOpenAIPreview(voice, text, outputPath);
      if (success) successCount++;
      else failCount++;
      
      // Rate limit: wait 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Generate Gemini previews
  if (!providerFilter || providerFilter === 'gemini') {
    console.log('\n🎙️ Generating Gemini voice previews...');
    const geminiVoices = voiceFilter
      ? Object.entries(GEMINI_VOICE_PREVIEWS).filter(([v]) => v === voiceFilter)
      : Object.entries(GEMINI_VOICE_PREVIEWS);

    for (const [voice, text] of geminiVoices) {
      const outputPath = path.join(outputDir, `gemini-${voice}-preview.wav`);
      const success = await generateGeminiPreview(voice, text, outputPath);
      if (success) successCount++;
      else failCount++;
      
      // Rate limit: wait 1s between Gemini requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successfully generated: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📁 Output directory: ${outputDir}`);
}

main().catch(console.error);
