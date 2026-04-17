import { createOpenAI } from '@ai-sdk/openai';
import { getModelById, type AIModel } from '@/lib/types/models';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

/**
 * Single OpenRouter client used for ALL LLM calls.
 *
 * We deliberately do NOT instantiate a direct OpenAI client for chat completion
 * anywhere in the app: OpenRouter exposes OpenAI's models under the `openai/*`
 * namespace, which gives us unified billing and observability.
 *
 * `OPENAI_API_KEY` is still required by other services (TTS, Whisper transcription,
 * DALL-E image fallback) and must not be removed.
 */
export const openrouter = OPENROUTER_API_KEY
  ? createOpenAI({
      apiKey: OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'PowerWrite Book Studio',
      },
    })
  : null;

export function isOpenRouterAvailable(): boolean {
  return openrouter !== null;
}

/**
 * Resolve a user-selected model ID to an OpenRouter model identifier.
 *
 * Historical model entries declared `provider: 'openai'` for `gpt-4o` and
 * `gpt-4o-mini` so we could call OpenAI directly. Now that everything goes
 * through OpenRouter, those IDs get an `openai/` prefix automatically.
 */
export function resolveOpenRouterModelId(modelId: string): string {
  const info: AIModel | undefined = getModelById(modelId);
  if (info?.provider === 'openai' && !modelId.startsWith('openai/')) {
    return `openai/${modelId}`;
  }
  return modelId;
}

export function getLanguageModel(modelId: string) {
  if (!openrouter) {
    throw new Error('OPENROUTER_API_KEY is not configured.');
  }
  return openrouter(resolveOpenRouterModelId(modelId));
}
