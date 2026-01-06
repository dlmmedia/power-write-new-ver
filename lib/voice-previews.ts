// Static voice preview URL mappings
// These files are pre-generated and stored in public/voice-previews/

import type { OpenAIVoiceId, GeminiVoiceId } from '@/lib/services/tts-service';

type VoiceId = OpenAIVoiceId | GeminiVoiceId;

// OpenAI voice previews (MP3 format) - 9 supported voices
export const OPENAI_PREVIEW_URLS: Record<OpenAIVoiceId, string> = {
  nova: '/voice-previews/openai-nova-preview.mp3',
  alloy: '/voice-previews/openai-alloy-preview.mp3',
  ash: '/voice-previews/openai-ash-preview.mp3',
  coral: '/voice-previews/openai-coral-preview.mp3',
  echo: '/voice-previews/openai-echo-preview.mp3',
  fable: '/voice-previews/openai-fable-preview.mp3',
  onyx: '/voice-previews/openai-onyx-preview.mp3',
  sage: '/voice-previews/openai-sage-preview.mp3',
  shimmer: '/voice-previews/openai-shimmer-preview.mp3',
};

// Gemini voice previews (WAV format)
export const GEMINI_PREVIEW_URLS: Record<GeminiVoiceId, string> = {
  Zephyr: '/voice-previews/gemini-Zephyr-preview.wav',
  Puck: '/voice-previews/gemini-Puck-preview.wav',
  Charon: '/voice-previews/gemini-Charon-preview.wav',
  Kore: '/voice-previews/gemini-Kore-preview.wav',
  Fenrir: '/voice-previews/gemini-Fenrir-preview.wav',
  Leda: '/voice-previews/gemini-Leda-preview.wav',
  Orus: '/voice-previews/gemini-Orus-preview.wav',
  Aoede: '/voice-previews/gemini-Aoede-preview.wav',
  Callirrhoe: '/voice-previews/gemini-Callirrhoe-preview.wav',
  Autonoe: '/voice-previews/gemini-Autonoe-preview.wav',
  Enceladus: '/voice-previews/gemini-Enceladus-preview.wav',
  Iapetus: '/voice-previews/gemini-Iapetus-preview.wav',
  Umbriel: '/voice-previews/gemini-Umbriel-preview.wav',
  Algieba: '/voice-previews/gemini-Algieba-preview.wav',
  Despina: '/voice-previews/gemini-Despina-preview.wav',
  Erinome: '/voice-previews/gemini-Erinome-preview.wav',
  Algenib: '/voice-previews/gemini-Algenib-preview.wav',
  Rasalgethi: '/voice-previews/gemini-Rasalgethi-preview.wav',
  Laomedeia: '/voice-previews/gemini-Laomedeia-preview.wav',
  Achernar: '/voice-previews/gemini-Achernar-preview.wav',
  Alnilam: '/voice-previews/gemini-Alnilam-preview.wav',
  Schedar: '/voice-previews/gemini-Schedar-preview.wav',
  Gacrux: '/voice-previews/gemini-Gacrux-preview.wav',
  Pulcherrima: '/voice-previews/gemini-Pulcherrima-preview.wav',
  Achird: '/voice-previews/gemini-Achird-preview.wav',
  Zubenelgenubi: '/voice-previews/gemini-Zubenelgenubi-preview.wav',
  Vindemiatrix: '/voice-previews/gemini-Vindemiatrix-preview.wav',
  Sadachbia: '/voice-previews/gemini-Sadachbia-preview.wav',
  Sadaltager: '/voice-previews/gemini-Sadaltager-preview.wav',
  Sulafat: '/voice-previews/gemini-Sulafat-preview.wav',
};

// Combined preview URLs for all voices
export const VOICE_PREVIEW_URLS: Record<string, string> = {
  ...OPENAI_PREVIEW_URLS,
  ...GEMINI_PREVIEW_URLS,
};

// Get preview URL for a voice, with fallback to API
export function getVoicePreviewUrl(voiceId: VoiceId, provider: 'openai' | 'gemini'): string {
  if (provider === 'openai') {
    return OPENAI_PREVIEW_URLS[voiceId as OpenAIVoiceId] || `/api/generate/voice-preview?voice=${voiceId}&provider=openai`;
  }
  return GEMINI_PREVIEW_URLS[voiceId as GeminiVoiceId] || `/api/generate/voice-preview?voice=${voiceId}&provider=gemini`;
}

// Check if a static preview exists for a voice
export function hasStaticPreview(voiceId: string): boolean {
  return voiceId in VOICE_PREVIEW_URLS;
}

// Preload audio cache for instant playback
const audioCache: Map<string, HTMLAudioElement> = new Map();

// Preload a single voice preview
export function preloadVoicePreview(voiceId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = VOICE_PREVIEW_URLS[voiceId];
    if (!url) {
      reject(new Error(`No preview URL for voice: ${voiceId}`));
      return;
    }

    if (audioCache.has(voiceId)) {
      resolve();
      return;
    }

    const audio = new Audio(url);
    audio.preload = 'auto';
    
    audio.addEventListener('canplaythrough', () => {
      audioCache.set(voiceId, audio);
      resolve();
    }, { once: true });

    audio.addEventListener('error', () => {
      // Don't reject - just resolve without caching
      // This allows fallback to API
      resolve();
    }, { once: true });

    // Start loading
    audio.load();
  });
}

// Preload multiple voice previews
export async function preloadVoicePreviews(voiceIds: string[]): Promise<void> {
  await Promise.all(voiceIds.map(id => preloadVoicePreview(id)));
}

// Get cached audio element for a voice
export function getCachedAudio(voiceId: string): HTMLAudioElement | null {
  return audioCache.get(voiceId) || null;
}

// Play a voice preview (from cache or create new)
export function playVoicePreview(voiceId: string): HTMLAudioElement | null {
  const url = VOICE_PREVIEW_URLS[voiceId];
  if (!url) return null;

  // Try to use cached audio
  const cached = audioCache.get(voiceId);
  if (cached) {
    cached.currentTime = 0;
    return cached;
  }

  // Create new audio element
  const audio = new Audio(url);
  audioCache.set(voiceId, audio);
  return audio;
}

// Clear the audio cache
export function clearAudioCache(): void {
  audioCache.forEach(audio => {
    audio.pause();
    audio.src = '';
  });
  audioCache.clear();
}
