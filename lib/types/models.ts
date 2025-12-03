// AI Model Configuration Types

export type AIProvider = 'openai' | 'openrouter';
export type ImageProvider = 'dalle' | 'nanobanana' | 'nanobanana-pro';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  description: string;
  contextLength: number;
  pricing: {
    input: number;  // per 1M tokens
    output: number; // per 1M tokens
  };
  capabilities: {
    chat: boolean;
    streaming: boolean;
    functionCalling: boolean;
    vision?: boolean;
  };
  tier: 'premium' | 'standard' | 'budget';
  recommended?: boolean;
  category: 'flagship' | 'fast' | 'creative' | 'reasoning' | 'specialized';
}

// OpenAI Models (via direct API)
export const OPENAI_MODELS: AIModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'Most capable OpenAI model for complex creative writing',
    contextLength: 128000,
    pricing: { input: 2.5, output: 10 },
    capabilities: { chat: true, streaming: true, functionCalling: true, vision: true },
    tier: 'premium',
    recommended: true,
    category: 'flagship',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'Fast and efficient for outlines and quick tasks',
    contextLength: 128000,
    pricing: { input: 0.15, output: 0.6 },
    capabilities: { chat: true, streaming: true, functionCalling: true, vision: true },
    tier: 'budget',
    category: 'fast',
  },
];

// OpenRouter Models - Extensive list
export const OPENROUTER_MODELS: AIModel[] = [
  // === FLAGSHIP MODELS ===
  {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'openrouter',
    description: 'Latest Claude model - exceptional creative writing and reasoning',
    contextLength: 200000,
    pricing: { input: 3, output: 15 },
    capabilities: { chat: true, streaming: true, functionCalling: true, vision: true },
    tier: 'premium',
    recommended: true,
    category: 'flagship',
  },
  {
    id: 'anthropic/claude-opus-4',
    name: 'Claude Opus 4',
    provider: 'openrouter',
    description: 'Most powerful Claude - best for complex, nuanced storytelling',
    contextLength: 200000,
    pricing: { input: 15, output: 75 },
    capabilities: { chat: true, streaming: true, functionCalling: true, vision: true },
    tier: 'premium',
    recommended: true,
    category: 'flagship',
  },
  {
    id: 'openai/gpt-4.1',
    name: 'GPT-4.1',
    provider: 'openrouter',
    description: 'Latest GPT model with enhanced capabilities',
    contextLength: 1047576,
    pricing: { input: 2, output: 8 },
    capabilities: { chat: true, streaming: true, functionCalling: true, vision: true },
    tier: 'premium',
    recommended: true,
    category: 'flagship',
  },
  {
    id: 'openai/o3',
    name: 'OpenAI o3',
    provider: 'openrouter',
    description: 'Advanced reasoning model for complex plot development',
    contextLength: 200000,
    pricing: { input: 10, output: 40 },
    capabilities: { chat: true, streaming: true, functionCalling: true },
    tier: 'premium',
    category: 'reasoning',
  },
  {
    id: 'google/gemini-2.5-pro-preview',
    name: 'Gemini 2.5 Pro',
    provider: 'openrouter',
    description: 'Google\'s most advanced model - excellent for long-form content',
    contextLength: 1000000,
    pricing: { input: 1.25, output: 10 },
    capabilities: { chat: true, streaming: true, functionCalling: true, vision: true },
    tier: 'premium',
    recommended: true,
    category: 'flagship',
  },
  {
    id: 'google/gemini-2.5-flash-preview',
    name: 'Gemini 2.5 Flash',
    provider: 'openrouter',
    description: 'Fast Gemini model - great for quick iterations',
    contextLength: 1000000,
    pricing: { input: 0.15, output: 0.6 },
    capabilities: { chat: true, streaming: true, functionCalling: true, vision: true },
    tier: 'standard',
    category: 'fast',
  },
  
  // === CREATIVE WRITING SPECIALISTS ===
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'openrouter',
    description: 'Excellent balance of quality and speed for creative writing',
    contextLength: 200000,
    pricing: { input: 3, output: 15 },
    capabilities: { chat: true, streaming: true, functionCalling: true, vision: true },
    tier: 'premium',
    category: 'creative',
  },
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'openrouter',
    description: 'Powerful Claude for nuanced, literary writing',
    contextLength: 200000,
    pricing: { input: 15, output: 75 },
    capabilities: { chat: true, streaming: true, functionCalling: true, vision: true },
    tier: 'premium',
    category: 'creative',
  },
  {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openrouter',
    description: 'Proven model for high-quality creative content',
    contextLength: 128000,
    pricing: { input: 10, output: 30 },
    capabilities: { chat: true, streaming: true, functionCalling: true, vision: true },
    tier: 'premium',
    category: 'creative',
  },
  
  // === FAST MODELS ===
  {
    id: 'anthropic/claude-3.5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'openrouter',
    description: 'Fast and affordable for quick drafts and outlines',
    contextLength: 200000,
    pricing: { input: 0.8, output: 4 },
    capabilities: { chat: true, streaming: true, functionCalling: true, vision: true },
    tier: 'standard',
    category: 'fast',
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini (OpenRouter)',
    provider: 'openrouter',
    description: 'Fast and efficient via OpenRouter',
    contextLength: 128000,
    pricing: { input: 0.15, output: 0.6 },
    capabilities: { chat: true, streaming: true, functionCalling: true, vision: true },
    tier: 'budget',
    category: 'fast',
  },
  {
    id: 'google/gemini-flash-1.5',
    name: 'Gemini Flash 1.5',
    provider: 'openrouter',
    description: 'Ultra-fast for rapid prototyping',
    contextLength: 1000000,
    pricing: { input: 0.075, output: 0.3 },
    capabilities: { chat: true, streaming: true, functionCalling: true, vision: true },
    tier: 'budget',
    category: 'fast',
  },
  
  // === REASONING MODELS ===
  {
    id: 'openai/o1',
    name: 'OpenAI o1',
    provider: 'openrouter',
    description: 'Advanced reasoning for complex plot structures',
    contextLength: 200000,
    pricing: { input: 15, output: 60 },
    capabilities: { chat: true, streaming: true, functionCalling: true },
    tier: 'premium',
    category: 'reasoning',
  },
  {
    id: 'openai/o1-mini',
    name: 'OpenAI o1 Mini',
    provider: 'openrouter',
    description: 'Fast reasoning model for logical consistency',
    contextLength: 128000,
    pricing: { input: 1.1, output: 4.4 },
    capabilities: { chat: true, streaming: true, functionCalling: true },
    tier: 'standard',
    category: 'reasoning',
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'openrouter',
    description: 'Powerful reasoning model at great value',
    contextLength: 64000,
    pricing: { input: 0.55, output: 2.19 },
    capabilities: { chat: true, streaming: true, functionCalling: true },
    tier: 'budget',
    category: 'reasoning',
  },
  
  // === OPEN SOURCE / BUDGET MODELS ===
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    provider: 'openrouter',
    description: 'Powerful open model for creative writing',
    contextLength: 128000,
    pricing: { input: 0.3, output: 0.4 },
    capabilities: { chat: true, streaming: true, functionCalling: true },
    tier: 'budget',
    category: 'creative',
  },
  {
    id: 'meta-llama/llama-4-maverick',
    name: 'Llama 4 Maverick',
    provider: 'openrouter',
    description: 'Latest Llama model with experimental features',
    contextLength: 128000,
    pricing: { input: 0.2, output: 0.6 },
    capabilities: { chat: true, streaming: true, functionCalling: true, vision: true },
    tier: 'standard',
    category: 'creative',
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct',
    name: 'Qwen 2.5 72B',
    provider: 'openrouter',
    description: 'Excellent multilingual model for diverse writing styles',
    contextLength: 32768,
    pricing: { input: 0.35, output: 0.4 },
    capabilities: { chat: true, streaming: true, functionCalling: true },
    tier: 'budget',
    category: 'creative',
  },
  {
    id: 'mistralai/mistral-large-2411',
    name: 'Mistral Large',
    provider: 'openrouter',
    description: 'Strong European AI for multilingual content',
    contextLength: 128000,
    pricing: { input: 2, output: 6 },
    capabilities: { chat: true, streaming: true, functionCalling: true },
    tier: 'standard',
    category: 'creative',
  },
  {
    id: 'mistralai/mistral-small-3.1-24b-instruct',
    name: 'Mistral Small 3.1',
    provider: 'openrouter',
    description: 'Efficient model for quick tasks',
    contextLength: 128000,
    pricing: { input: 0.1, output: 0.3 },
    capabilities: { chat: true, streaming: true, functionCalling: true },
    tier: 'budget',
    category: 'fast',
  },
  {
    id: 'cohere/command-r-plus',
    name: 'Command R+',
    provider: 'openrouter',
    description: 'Excellent for research-based writing',
    contextLength: 128000,
    pricing: { input: 2.5, output: 10 },
    capabilities: { chat: true, streaming: true, functionCalling: true },
    tier: 'standard',
    category: 'specialized',
  },
  {
    id: 'x-ai/grok-2-1212',
    name: 'Grok 2',
    provider: 'openrouter',
    description: 'xAI\'s flagship model with unique personality',
    contextLength: 131072,
    pricing: { input: 2, output: 10 },
    capabilities: { chat: true, streaming: true, functionCalling: true },
    tier: 'standard',
    category: 'creative',
  },
  {
    id: 'perplexity/sonar-pro',
    name: 'Sonar Pro',
    provider: 'openrouter',
    description: 'Research-oriented with web access for non-fiction',
    contextLength: 200000,
    pricing: { input: 3, output: 15 },
    capabilities: { chat: true, streaming: true, functionCalling: true },
    tier: 'standard',
    category: 'specialized',
  },
  {
    id: 'nvidia/llama-3.1-nemotron-70b-instruct',
    name: 'Nemotron 70B',
    provider: 'openrouter',
    description: 'NVIDIA-tuned Llama for high-quality output',
    contextLength: 128000,
    pricing: { input: 0.2, output: 0.2 },
    capabilities: { chat: true, streaming: true, functionCalling: true },
    tier: 'budget',
    category: 'creative',
  },
];

// All models combined
export const ALL_MODELS: AIModel[] = [...OPENAI_MODELS, ...OPENROUTER_MODELS];

// Model categories for UI
export const MODEL_CATEGORIES = {
  flagship: {
    name: 'Flagship Models',
    description: 'Most capable models for the best quality',
    icon: '⭐',
  },
  creative: {
    name: 'Creative Writing',
    description: 'Optimized for storytelling and prose',
    icon: '✍️',
  },
  fast: {
    name: 'Fast & Efficient',
    description: 'Quick iterations and outlines',
    icon: '⚡',
  },
  reasoning: {
    name: 'Reasoning Models',
    description: 'Complex plot logic and consistency',
    icon: '🧠',
  },
  specialized: {
    name: 'Specialized',
    description: 'Research and specific use cases',
    icon: '🔬',
  },
} as const;

// Helper function to get model by ID
export function getModelById(id: string): AIModel | undefined {
  return ALL_MODELS.find((m) => m.id === id);
}

// Helper function to get models by category
export function getModelsByCategory(category: AIModel['category']): AIModel[] {
  return ALL_MODELS.filter((m) => m.category === category);
}

// Helper function to get models by provider
export function getModelsByProvider(provider: AIProvider): AIModel[] {
  return ALL_MODELS.filter((m) => m.provider === provider);
}

// Helper function to get recommended models
export function getRecommendedModels(): AIModel[] {
  return ALL_MODELS.filter((m) => m.recommended);
}

// Default model configurations
export const DEFAULT_OUTLINE_MODEL = 'openai/gpt-4o-mini';
export const DEFAULT_CHAPTER_MODEL = 'anthropic/claude-sonnet-4';

// Image Generation Models
export interface ImageModel {
  id: string;
  name: string;
  provider: ImageProvider;
  description: string;
  maxResolution: string;
  pricing: {
    perImage: number; // approximate cost per image in USD
  };
  capabilities: {
    textRendering: boolean;
    highResolution: boolean;
    styleControl: boolean;
  };
  tier: 'premium' | 'standard';
}

export const IMAGE_MODELS: ImageModel[] = [
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'dalle',
    description: 'OpenAI\'s image generation model - proven quality',
    maxResolution: '1792x1024',
    pricing: { perImage: 0.08 },
    capabilities: { textRendering: false, highResolution: true, styleControl: true },
    tier: 'premium',
  },
  {
    id: 'google/gemini-2.5-flash-image',
    name: 'Nano Banana (Gemini 2.5 Flash)',
    provider: 'nanobanana',
    description: 'Fast image generation via OpenRouter',
    maxResolution: '1024x1024',
    pricing: { perImage: 0.02 },
    capabilities: { textRendering: true, highResolution: false, styleControl: true },
    tier: 'standard',
  },
  {
    id: 'google/gemini-3-pro-image-preview',
    name: 'Nano Banana Pro (Gemini 3 Pro)',
    provider: 'nanobanana-pro',
    description: 'Premium image generation - 4K, better text, advanced controls',
    maxResolution: '4096x4096',
    pricing: { perImage: 0.05 },
    capabilities: { textRendering: true, highResolution: true, styleControl: true },
    tier: 'premium',
  },
];

export const DEFAULT_IMAGE_MODEL = 'google/gemini-3-pro-image-preview'; // Nano Banana Pro

export function getImageModelById(id: string): ImageModel | undefined {
  return IMAGE_MODELS.find((m) => m.id === id);
}



