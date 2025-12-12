import { ReferenceAnalysis } from './book';

// Main Book Configuration Interface
export interface BookConfiguration {
  // A. Basic Information
  basicInfo: {
    title: string;
    author: string;
    coAuthors?: string[];
    genre: string;
    subGenre?: string;
    series?: {
      name: string;
      number: number;
    };
  };

  // B. Content Settings
  content: {
    description: string;
    targetWordCount: number;
    numChapters: number;
    chapterLengthPreference: 'consistent' | 'variable';
    bookStructure: 'linear' | 'non-linear' | 'episodic' | 'circular';
  };

  // C. Writing Style & Tone
  writingStyle: {
    style: 'formal' | 'casual' | 'academic' | 'conversational' | 'poetic' | 'technical' | 'journalistic';
    tone: 'serious' | 'humorous' | 'dark' | 'light-hearted' | 'inspirational' | 'satirical' | 'neutral';
    pov: 'first-person' | 'second-person' | 'third-person-limited' | 'third-person-omniscient';
    tense: 'past' | 'present' | 'future' | 'mixed';
    narrativeVoice: 'active' | 'passive' | 'descriptive' | 'dialogue-heavy';
  };

  // D. Audience & Purpose
  audience: {
    targetAudience: 'children' | 'young-adult' | 'adult' | 'academic' | 'professional';
    ageRange?: {
      min: number;
      max: number;
    };
    readingLevel: 'elementary' | 'middle-school' | 'high-school' | 'college' | 'graduate';
    purpose: 'entertainment' | 'education' | 'reference' | 'self-help' | 'inspiration' | 'professional';
    contentWarnings?: string[];
    rating?: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';
  };

  // E. Character Development
  characters?: {
    protagonist?: CharacterProfile;
    antagonist?: CharacterProfile;
    supporting?: CharacterProfile[];
    developmentPreference: 'deep' | 'moderate' | 'minimal';
  };

  // F. Plot & Structure
  plot: {
    narrativeStructure: 'three-act' | 'hero-journey' | 'five-act' | 'freytag' | 'circular' | 'custom';
    plotPoints?: {
      incitingIncident?: string;
      risingAction?: string[];
      climax?: string;
      fallingAction?: string;
      resolution?: string;
    };
    subplots?: string[];
    pacing: 'fast' | 'moderate' | 'slow' | 'variable';
  };

  // G. Themes & Motifs
  themes: {
    primary: string[];
    secondary?: string[];
    motifs?: string[];
    symbolism?: string[];
    philosophical?: string[];
  };

  // H. Setting & World-Building
  setting: {
    timePeriod: 'historical' | 'contemporary' | 'future' | 'fantasy' | 'mixed';
    specificEra?: string;
    location: 'real-world' | 'fictional' | 'mixed';
    locationDetails?: string;
    worldBuildingDepth: 'minimal' | 'moderate' | 'extensive';
    culturalElements?: string[];
  };

  // I. Language & Dialogue
  language: {
    complexity: 'simple' | 'moderate' | 'complex' | 'mixed';
    dialogueStyle: 'realistic' | 'stylized' | 'minimal' | 'extensive';
    dialectUsage?: boolean;
    technicalJargon: 'none' | 'minimal' | 'moderate' | 'heavy';
    foreignLanguage?: string[];
  };

  // J. Bibliography & References
  bibliography?: {
    include: boolean;
    citationStyle: 'APA' | 'MLA' | 'Chicago' | 'Harvard' | 'IEEE';
    referenceFormat: 'footnotes' | 'endnotes' | 'in-text' | 'bibliography';
    sourceVerification: 'strict' | 'moderate' | 'relaxed';
  };

  // K. Formatting Preferences
  formatting: {
    pageSize: 'us-letter' | 'a4' | 'custom';
    customSize?: { width: number; height: number };
    margins: 'narrow' | 'normal' | 'wide' | 'custom';
    customMargins?: { top: number; bottom: number; left: number; right: number };
    fontFamily: string;
    fontSize: number;
    lineSpacing: 'single' | '1.5' | 'double' | 'custom';
    customLineSpacing?: number;
    paragraphIndentation: 'none' | 'first-line' | 'hanging';
    chapterHeadingStyle: 'centered' | 'left' | 'right';
    pageNumberPlacement: 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right' | 'none';
  };

  // L. Front/Back Matter
  frontBackMatter: {
    dedication?: string;
    acknowledgments?: string;
    preface?: string;
    foreword?: string;
    introduction?: string;
    epilogue?: string;
    appendices?: string[];
    glossary?: boolean;
    index?: boolean;
    aboutAuthor?: string;
    copyright?: string;
  };

  // M. Visual Elements
  visuals: {
    coverStyle: 'minimalist' | 'illustrative' | 'photographic' | 'abstract' | 'typographic';
    coverColorScheme?: string;
    coverTypography?: string;
    chapterIllustrations: boolean;
    diagrams?: boolean;
  };

  // N. AI Model Settings
  aiSettings: {
    provider: 'openai' | 'openrouter';
    model: string; // Model for outline generation
    chapterModel?: string; // Model for chapter generation (defaults to model if not set)
    temperature: number;
    maxTokens: number;
    customSystemPrompt?: string;
    generationStrategy: 'sequential' | 'parallel' | 'hybrid';
    // Generation speed preset - determines model and parallelization
    generationSpeed?: 'quality' | 'balanced' | 'fast';
    // Whether to use parallel chapter generation (default true)
    useParallelGeneration?: boolean;
  };

  // O. Advanced Options
  advanced?: {
    contentFiltering: boolean;
    factChecking?: boolean;
    plagiarismChecking?: boolean;
    seoOptimization?: boolean;
    readabilityTarget?: number;
    accessibilityFeatures?: string[];
    multiLanguage?: string[];
  };

  // Reference Book Data
  referenceBooks?: {
    selectedBookIds: string[];
    analysis?: ReferenceAnalysis;
    autoPopulated: boolean;
  };

  // Custom Instructions
  customInstructions?: string;
}

export interface CharacterProfile {
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'mentor' | 'foil';
  description: string;
  age?: number;
  background?: string;
  motivation?: string;
  arc?: string;
  relationships?: { [key: string]: string };
}

// Default configuration
export const defaultBookConfiguration: BookConfiguration = {
  basicInfo: {
    title: '',
    author: '',
    genre: 'fiction',
  },
  content: {
    description: '',
    targetWordCount: 80000,
    numChapters: 10,
    chapterLengthPreference: 'consistent',
    bookStructure: 'linear',
  },
  writingStyle: {
    style: 'conversational',
    tone: 'neutral',
    pov: 'third-person-limited',
    tense: 'past',
    narrativeVoice: 'active',
  },
  audience: {
    targetAudience: 'adult',
    readingLevel: 'high-school',
    purpose: 'entertainment',
  },
  plot: {
    narrativeStructure: 'three-act',
    pacing: 'moderate',
  },
  themes: {
    primary: [],
  },
  setting: {
    timePeriod: 'contemporary',
    location: 'real-world',
    worldBuildingDepth: 'moderate',
  },
  language: {
    complexity: 'moderate',
    dialogueStyle: 'realistic',
    technicalJargon: 'minimal',
  },
  formatting: {
    pageSize: 'us-letter',
    margins: 'normal',
    fontFamily: 'Times New Roman',
    fontSize: 12,
    lineSpacing: 'double',
    paragraphIndentation: 'first-line',
    chapterHeadingStyle: 'centered',
    pageNumberPlacement: 'bottom-center',
  },
  frontBackMatter: {},
  visuals: {
    coverStyle: 'photographic',
    chapterIllustrations: false,
  },
  aiSettings: {
    provider: 'openrouter',
    model: 'openai/gpt-4o-mini', // Fast model for outlines
    chapterModel: 'anthropic/claude-sonnet-4', // Premium model for chapter writing
    temperature: 0.85,
    maxTokens: 4000,
    generationStrategy: 'parallel', // Default to parallel for speed
    // generationSpeed is intentionally not set - use custom model by default
    // User can select a speed preset if they want to override their custom model
    useParallelGeneration: true, // Enable parallel generation by default
  },
};

// Genre options
export const GENRE_OPTIONS = [
  'Fiction',
  'Non-Fiction',
  'Fantasy',
  'Science Fiction',
  'Romance',
  'Thriller',
  'Mystery',
  'Horror',
  'Historical Fiction',
  'Contemporary',
  'Young Adult',
  'Literary Fiction',
  'Biography',
  'Memoir',
  'Self-Help',
  'Business',
  'Technical',
  'Academic',
] as const;

// Narrative structure options
export const NARRATIVE_STRUCTURES = [
  { value: 'three-act', label: 'Three-Act Structure', description: 'Setup, Confrontation, Resolution' },
  { value: 'hero-journey', label: "Hero's Journey", description: 'Classic monomyth structure' },
  { value: 'five-act', label: 'Five-Act Structure', description: 'Exposition, Rising Action, Climax, Falling Action, Denouement' },
  { value: 'freytag', label: "Freytag's Pyramid", description: 'Introduction, Rise, Climax, Return, Catastrophe' },
  { value: 'circular', label: 'Circular Narrative', description: 'Story ends where it begins' },
  { value: 'custom', label: 'Custom', description: 'Define your own structure' },
] as const;

// Generation speed presets with model and settings info
export const GENERATION_SPEED_OPTIONS = [
  {
    value: 'quality' as const,
    label: '⭐ Quality',
    description: 'Best writing quality with Claude Sonnet 4',
    model: 'anthropic/claude-sonnet-4',
    estimatedTime: '2-4 min per batch',
    features: ['Superior coherence', 'Rich prose', 'Best for final drafts'],
  },
  {
    value: 'balanced' as const,
    label: '⚡ Balanced',
    description: 'Fast generation with Gemini 2.5 Flash',
    model: 'google/gemini-2.5-flash-preview',
    estimatedTime: '30-60 sec per batch',
    features: ['1M context window', 'Good quality', 'Great for iteration'],
  },
  {
    value: 'fast' as const,
    label: '🚀 Fast',
    description: 'Fastest generation with Claude Haiku',
    model: 'anthropic/claude-3.5-haiku',
    estimatedTime: '15-30 sec per batch',
    features: ['Quickest results', 'Good for outlines', 'Budget-friendly'],
  },
] as const;

export type GenerationSpeed = typeof GENERATION_SPEED_OPTIONS[number]['value'];
