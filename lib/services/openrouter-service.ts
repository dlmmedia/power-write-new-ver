import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import { AIModel, getModelById, OPENROUTER_MODELS, DEFAULT_CHAPTER_MODEL, DEFAULT_OUTLINE_MODEL } from '@/lib/types/models';

// OpenRouter API Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Initialize OpenRouter provider (using OpenAI-compatible API)
let openrouterProvider: ReturnType<typeof createOpenAI> | null = null;

function getOpenRouterProvider() {
  if (!OPENROUTER_API_KEY) {
    console.warn('⚠️ OPENROUTER_API_KEY not set - OpenRouter models will not be available');
    return null;
  }
  
  if (!openrouterProvider) {
    openrouterProvider = createOpenAI({
      apiKey: OPENROUTER_API_KEY,
      baseURL: OPENROUTER_BASE_URL,
      headers: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'PowerWrite Book Studio',
      },
    });
    console.log('✓ OpenRouter provider initialized');
  }
  
  return openrouterProvider;
}

// Get the language model for a given model ID
export function getOpenRouterModel(modelId: string) {
  const provider = getOpenRouterProvider();
  if (!provider) {
    throw new Error('OpenRouter is not configured. Please set OPENROUTER_API_KEY.');
  }
  
  const modelInfo = getModelById(modelId);
  if (!modelInfo || modelInfo.provider !== 'openrouter') {
    throw new Error(`Model ${modelId} is not a valid OpenRouter model`);
  }
  
  return provider(modelId);
}

// Check if OpenRouter is available
export function isOpenRouterAvailable(): boolean {
  return !!OPENROUTER_API_KEY;
}

// Get available OpenRouter models
export function getAvailableOpenRouterModels(): AIModel[] {
  if (!isOpenRouterAvailable()) {
    return [];
  }
  return OPENROUTER_MODELS;
}

// Generate text using OpenRouter
export async function generateWithOpenRouter(
  modelId: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: {
    temperature?: number;
  } = {}
): Promise<string> {
  const model = getOpenRouterModel(modelId);
  
  const result = await generateText({
    model,
    messages,
    temperature: options.temperature ?? 0.85,
  });
  
  return result.text;
}

// Stream text using OpenRouter
export async function* streamWithOpenRouter(
  modelId: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: {
    temperature?: number;
  } = {}
) {
  const model = getOpenRouterModel(modelId);
  
  const result = streamText({
    model,
    messages,
    temperature: options.temperature ?? 0.85,
  });
  
  for await (const chunk of result.textStream) {
    yield chunk;
  }
}

// OpenRouter service class for more complex operations
export class OpenRouterService {
  private defaultOutlineModel: string;
  private defaultChapterModel: string;
  
  constructor(
    outlineModel: string = DEFAULT_OUTLINE_MODEL,
    chapterModel: string = DEFAULT_CHAPTER_MODEL
  ) {
    this.defaultOutlineModel = outlineModel;
    this.defaultChapterModel = chapterModel;
  }
  
  setModels(outlineModel?: string, chapterModel?: string) {
    if (outlineModel) this.defaultOutlineModel = outlineModel;
    if (chapterModel) this.defaultChapterModel = chapterModel;
  }
  
  async generateOutline(
    systemPrompt: string,
    userPrompt: string,
    modelId?: string
  ): Promise<string> {
    return generateWithOpenRouter(
      modelId || this.defaultOutlineModel,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.8 }
    );
  }
  
  async generateChapter(
    systemPrompt: string,
    userPrompt: string,
    modelId?: string
  ): Promise<string> {
    return generateWithOpenRouter(
      modelId || this.defaultChapterModel,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.85 }
    );
  }
  
  async *streamChapter(
    systemPrompt: string,
    userPrompt: string,
    modelId?: string
  ) {
    yield* streamWithOpenRouter(
      modelId || this.defaultChapterModel,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.85 }
    );
  }
}

// Singleton instance
export const openRouterService = new OpenRouterService();

