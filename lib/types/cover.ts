// Cover generation types and interfaces

export interface CoverTextCustomization {
  // Custom title (overrides book title)
  customTitle?: string;
  // Custom author name
  customAuthor?: string;
  // Subtitle text
  subtitle?: string;
  // Tagline/quote
  tagline?: string;
  // Publisher name override
  publisherName?: string;
  // Series name
  seriesName?: string;
  seriesNumber?: number;
  // Award/badge text
  awardBadge?: string;
}

export interface CoverTypographyOptions {
  // Title typography
  titleFont: 'serif' | 'sans-serif' | 'display' | 'script' | 'gothic' | 'modern' | 'handwritten';
  titleWeight: 'light' | 'normal' | 'bold' | 'black';
  titleStyle: 'normal' | 'italic' | 'uppercase' | 'small-caps';
  titleEffect?: 'none' | 'shadow' | 'outline' | 'glow' | 'embossed' | '3d';
  
  // Author typography
  authorFont: 'serif' | 'sans-serif' | 'script';
  authorStyle: 'normal' | 'italic' | 'uppercase' | 'small-caps';
  
  // Size preferences
  titleSize: 'small' | 'medium' | 'large' | 'extra-large';
  authorSize: 'small' | 'medium' | 'large';
  
  // Text alignment
  alignment: 'left' | 'center' | 'right';
  verticalPosition: 'top' | 'upper-third' | 'center' | 'lower-third' | 'bottom';
}

export interface CoverLayoutOptions {
  layout: 'classic' | 'modern' | 'bold' | 'elegant' | 'dramatic' | 'minimalist' | 'split' | 'border' | 'full-bleed';
  imagePosition: 'background' | 'top-half' | 'bottom-half' | 'center' | 'left-side' | 'right-side';
  
  // Frame/border options
  borderStyle?: 'none' | 'thin' | 'thick' | 'double' | 'ornate' | 'geometric';
  borderColor?: string;
  
  // Overlay options
  overlayType?: 'none' | 'gradient' | 'solid' | 'vignette' | 'pattern';
  overlayOpacity?: number; // 0-100
  
  // Text placement zone
  textZone?: 'full' | 'top' | 'bottom' | 'left' | 'right' | 'center-band';
}

export interface CoverVisualOptions {
  // Visual style
  style: 'minimalist' | 'illustrative' | 'photographic' | 'abstract' | 'typographic' | 'cinematic' | 'vintage' | 'retro' | 'futuristic';
  
  // Color preferences
  colorScheme: 'warm' | 'cool' | 'monochrome' | 'vibrant' | 'pastel' | 'dark' | 'custom' | 'complementary' | 'analogous';
  customColors?: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background?: string;
  };
  
  // Mood/atmosphere
  mood?: string;
  atmosphere?: 'light' | 'dark' | 'moody' | 'bright' | 'mysterious' | 'dramatic' | 'peaceful' | 'energetic';
  
  // Visual elements to include
  visualElements?: string[];
  avoidElements?: string[];
  
  // Specific imagery requests
  mainSubject?: string;
  backgroundDescription?: string;
}

export interface CoverDesignOptions {
  // Style preferences (legacy support)
  style: 'minimalist' | 'illustrative' | 'photographic' | 'abstract' | 'typographic';
  colorScheme?: 'warm' | 'cool' | 'monochrome' | 'vibrant' | 'pastel' | 'dark' | 'custom';
  customColors?: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
  };
  
  // Typography (legacy)
  typography: {
    titleFont: 'serif' | 'sans-serif' | 'display' | 'script';
    authorFont: 'serif' | 'sans-serif';
    fontSize: 'small' | 'medium' | 'large';
    alignment: 'top' | 'center' | 'bottom';
  };
  
  // Layout (legacy)
  layout: 'classic' | 'modern' | 'bold' | 'elegant' | 'dramatic';
  imagePosition: 'background' | 'top-half' | 'bottom-half' | 'center';
  
  // Additional elements (legacy)
  includeSubtitle?: boolean;
  subtitle?: string;
  includeTagline?: boolean;
  tagline?: string;
  showAuthorPhoto?: boolean;
  
  // Generation method
  generationMethod: 'ai' | 'template' | 'hybrid';
  
  // === NEW COMPREHENSIVE OPTIONS ===
  
  // Text customization
  textCustomization?: CoverTextCustomization;
  
  // Enhanced typography
  typographyOptions?: CoverTypographyOptions;
  
  // Enhanced layout
  layoutOptions?: CoverLayoutOptions;
  
  // Enhanced visuals
  visualOptions?: CoverVisualOptions;
  
  // Custom AI prompt additions
  customPrompt?: string;
  
  // Reference/inspiration
  referenceStyle?: string; // e.g., "like Stephen King covers", "similar to Penguin Classics"
  
  // Output preferences
  outputFormat?: 'portrait' | 'square' | 'landscape';
  aspectRatio?: '2:3' | '3:4' | '1:1' | '4:3' | 'custom';
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
  
  // === NEW COMPREHENSIVE OPTIONS ===
  textCustomization?: CoverTextCustomization;
  typographyOptions?: CoverTypographyOptions;
  layoutOptions?: CoverLayoutOptions;
  visualOptions?: CoverVisualOptions;
  customPrompt?: string;
  referenceStyle?: string;
  
  // Branding options
  showPowerWriteBranding?: boolean;
  hideAuthorName?: boolean;
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
    colorScheme: 'dark',
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
    colorScheme: 'cool',
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

// Font style presets for easy selection
export const FONT_STYLE_PRESETS = {
  'classic-serif': {
    titleFont: 'serif' as const,
    titleWeight: 'bold' as const,
    titleStyle: 'normal' as const,
    authorFont: 'serif' as const,
    authorStyle: 'italic' as const,
    description: 'Timeless, elegant design with classic serifs'
  },
  'modern-sans': {
    titleFont: 'sans-serif' as const,
    titleWeight: 'bold' as const,
    titleStyle: 'uppercase' as const,
    authorFont: 'sans-serif' as const,
    authorStyle: 'normal' as const,
    description: 'Clean, contemporary sans-serif look'
  },
  'bold-display': {
    titleFont: 'display' as const,
    titleWeight: 'black' as const,
    titleStyle: 'uppercase' as const,
    authorFont: 'sans-serif' as const,
    authorStyle: 'uppercase' as const,
    description: 'Impactful, attention-grabbing display fonts'
  },
  'romantic-script': {
    titleFont: 'script' as const,
    titleWeight: 'normal' as const,
    titleStyle: 'normal' as const,
    authorFont: 'serif' as const,
    authorStyle: 'italic' as const,
    description: 'Elegant, flowing script typography'
  },
  'gothic-dark': {
    titleFont: 'gothic' as const,
    titleWeight: 'bold' as const,
    titleStyle: 'normal' as const,
    authorFont: 'serif' as const,
    authorStyle: 'small-caps' as const,
    description: 'Dark, atmospheric gothic styling'
  },
  'retro-vintage': {
    titleFont: 'display' as const,
    titleWeight: 'bold' as const,
    titleStyle: 'normal' as const,
    authorFont: 'serif' as const,
    authorStyle: 'normal' as const,
    description: 'Vintage-inspired nostalgic design'
  },
  'minimal-elegant': {
    titleFont: 'serif' as const,
    titleWeight: 'light' as const,
    titleStyle: 'small-caps' as const,
    authorFont: 'sans-serif' as const,
    authorStyle: 'normal' as const,
    description: 'Understated, sophisticated minimalism'
  },
  'handwritten': {
    titleFont: 'handwritten' as const,
    titleWeight: 'normal' as const,
    titleStyle: 'normal' as const,
    authorFont: 'sans-serif' as const,
    authorStyle: 'normal' as const,
    description: 'Personal, organic handwritten feel'
  },
} as const;

export type FontStylePreset = keyof typeof FONT_STYLE_PRESETS;

// Visual style presets
export const VISUAL_STYLE_PRESETS = {
  'bestseller': {
    style: 'photographic' as const,
    atmosphere: 'dramatic' as const,
    description: 'Professional bestseller aesthetic'
  },
  'literary': {
    style: 'minimalist' as const,
    atmosphere: 'peaceful' as const,
    description: 'Refined literary fiction style'
  },
  'thriller': {
    style: 'cinematic' as const,
    atmosphere: 'mysterious' as const,
    description: 'High-tension thriller visuals'
  },
  'fantasy-epic': {
    style: 'illustrative' as const,
    atmosphere: 'dramatic' as const,
    description: 'Epic fantasy illustration style'
  },
  'sci-fi-tech': {
    style: 'futuristic' as const,
    atmosphere: 'moody' as const,
    description: 'Futuristic sci-fi aesthetic'
  },
  'romance': {
    style: 'photographic' as const,
    atmosphere: 'bright' as const,
    description: 'Warm romantic imagery'
  },
  'horror': {
    style: 'abstract' as const,
    atmosphere: 'dark' as const,
    description: 'Dark, unsettling horror vibes'
  },
  'memoir': {
    style: 'vintage' as const,
    atmosphere: 'peaceful' as const,
    description: 'Personal memoir aesthetic'
  },
} as const;

export type VisualStylePreset = keyof typeof VISUAL_STYLE_PRESETS;

// Color palette presets with actual colors
export const COLOR_PALETTES = {
  'midnight-gold': {
    primary: '#1a1a2e',
    secondary: '#16213e',
    accent: '#d4af37',
    text: '#ffffff',
    background: '#0f0f1a',
    description: 'Luxurious dark blue with gold accents'
  },
  'crimson-noir': {
    primary: '#1a0a0a',
    secondary: '#2d1f1f',
    accent: '#8b0000',
    text: '#ffffff',
    background: '#0a0505',
    description: 'Dark noir with deep crimson'
  },
  'forest-dawn': {
    primary: '#1a2f1a',
    secondary: '#2d4a2d',
    accent: '#d4a574',
    text: '#f5f5dc',
    background: '#0a150a',
    description: 'Natural forest greens with warm dawn'
  },
  'ocean-mist': {
    primary: '#1a3a4a',
    secondary: '#2d5a6a',
    accent: '#7fcdff',
    text: '#ffffff',
    background: '#0a1a2a',
    description: 'Deep ocean blues with misty highlights'
  },
  'rose-cream': {
    primary: '#f5e6e8',
    secondary: '#e8d5d7',
    accent: '#c97b84',
    text: '#4a3f41',
    background: '#fff5f7',
    description: 'Soft romantic rose tones'
  },
  'monochrome-stark': {
    primary: '#ffffff',
    secondary: '#e0e0e0',
    accent: '#000000',
    text: '#1a1a1a',
    background: '#f5f5f5',
    description: 'Bold black and white contrast'
  },
  'sunset-fire': {
    primary: '#ff6b35',
    secondary: '#f7c59f',
    accent: '#2d1f1f',
    text: '#ffffff',
    background: '#1a0a05',
    description: 'Vibrant sunset oranges and warmth'
  },
  'purple-haze': {
    primary: '#2d1b4e',
    secondary: '#4a2f7a',
    accent: '#9b59b6',
    text: '#ffffff',
    background: '#1a0f2e',
    description: 'Mystical purple gradients'
  },
} as const;

export type ColorPalette = keyof typeof COLOR_PALETTES;
