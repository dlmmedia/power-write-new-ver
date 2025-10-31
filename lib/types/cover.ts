// Cover generation types and interfaces

export interface CoverDesignOptions {
  // Style preferences
  style: 'minimalist' | 'illustrative' | 'photographic' | 'abstract' | 'typographic';
  colorScheme?: 'warm' | 'cool' | 'monochrome' | 'vibrant' | 'pastel' | 'dark' | 'custom';
  customColors?: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
  };
  
  // Typography
  typography: {
    titleFont: 'serif' | 'sans-serif' | 'display' | 'script';
    authorFont: 'serif' | 'sans-serif';
    fontSize: 'small' | 'medium' | 'large';
    alignment: 'top' | 'center' | 'bottom';
  };
  
  // Layout
  layout: 'classic' | 'modern' | 'bold' | 'elegant' | 'dramatic';
  imagePosition: 'background' | 'top-half' | 'bottom-half' | 'center';
  
  // Additional elements
  includeSubtitle?: boolean;
  subtitle?: string;
  includeTagline?: boolean;
  tagline?: string;
  showAuthorPhoto?: boolean;
  
  // Generation method
  generationMethod: 'ai' | 'template' | 'hybrid';
}

export interface CoverMetadata {
  designVersion: string;
  generatedAt: string;
  options: CoverDesignOptions;
  aiPrompt?: string;
  imageUrl?: string;
  templateUsed?: string;
  dimensions: {
    width: number;
    height: number;
  };
  fileSize?: number;
  format: 'png' | 'jpg' | 'webp';
}

export interface CoverGenerationRequest {
  bookId?: number;
  title: string;
  author: string;
  genre: string;
  description: string;
  targetAudience: string;
  themes?: string[];
  mood?: string;
  designOptions?: Partial<CoverDesignOptions>;
}

export interface CoverGenerationResponse {
  success: boolean;
  coverUrl?: string;
  metadata?: CoverMetadata;
  error?: string;
}

// Default cover design options by genre
export const GENRE_COVER_DEFAULTS: Record<string, Partial<CoverDesignOptions>> = {
  'Fantasy': {
    style: 'illustrative',
    colorScheme: 'vibrant',
    typography: { titleFont: 'display', authorFont: 'serif', fontSize: 'large', alignment: 'center' },
    layout: 'dramatic',
  },
  'Science Fiction': {
    style: 'abstract',
    colorScheme: 'cool',
    typography: { titleFont: 'sans-serif', authorFont: 'sans-serif', fontSize: 'large', alignment: 'center' },
    layout: 'modern',
  },
  'Romance': {
    style: 'photographic',
    colorScheme: 'pastel',
    typography: { titleFont: 'script', authorFont: 'serif', fontSize: 'medium', alignment: 'top' },
    layout: 'elegant',
  },
  'Thriller': {
    style: 'photographic',
    colorScheme: 'dark',
    typography: { titleFont: 'sans-serif', authorFont: 'sans-serif', fontSize: 'large', alignment: 'center' },
    layout: 'bold',
  },
  'Mystery': {
    style: 'abstract',
    colorScheme: 'monochrome',
    typography: { titleFont: 'serif', authorFont: 'serif', fontSize: 'medium', alignment: 'center' },
    layout: 'classic',
  },
  'Horror': {
    style: 'abstract',
    colorScheme: 'dark',
    typography: { titleFont: 'display', authorFont: 'sans-serif', fontSize: 'large', alignment: 'center' },
    layout: 'dramatic',
  },
  'Literary Fiction': {
    style: 'minimalist',
    colorScheme: 'monochrome',
    typography: { titleFont: 'serif', authorFont: 'serif', fontSize: 'medium', alignment: 'center' },
    layout: 'elegant',
  },
  'Non-Fiction': {
    style: 'typographic',
    colorScheme: 'vibrant',
    typography: { titleFont: 'sans-serif', authorFont: 'sans-serif', fontSize: 'large', alignment: 'top' },
    layout: 'modern',
  },
  'Biography': {
    style: 'photographic',
    colorScheme: 'warm',
    typography: { titleFont: 'serif', authorFont: 'serif', fontSize: 'medium', alignment: 'bottom' },
    layout: 'classic',
  },
  'Self-Help': {
    style: 'minimalist',
    colorScheme: 'vibrant',
    typography: { titleFont: 'sans-serif', authorFont: 'sans-serif', fontSize: 'large', alignment: 'center' },
    layout: 'modern',
  },
  'Young Adult': {
    style: 'illustrative',
    colorScheme: 'vibrant',
    typography: { titleFont: 'display', authorFont: 'sans-serif', fontSize: 'large', alignment: 'top' },
    layout: 'bold',
  },
};

// Standard book cover dimensions (in pixels, 300 DPI)
export const COVER_DIMENSIONS = {
  // Standard 6x9 paperback
  '6x9': { width: 1800, height: 2700 },
  // Standard 5x8 paperback
  '5x8': { width: 1500, height: 2400 },
  // Standard 8.5x11 textbook
  '8.5x11': { width: 2550, height: 3300 },
  // eBook cover
  'ebook': { width: 1600, height: 2400 },
  // Large format
  'large': { width: 2100, height: 2800 },
} as const;

export type CoverDimensionPreset = keyof typeof COVER_DIMENSIONS;
