// Book Image System Types

/**
 * Types of images that can be generated/inserted into books
 */
export type BookImageType = 
  | 'illustration'    // Story illustrations (characters, scenes, settings)
  | 'diagram'         // Technical diagrams (flowcharts, architecture)
  | 'infographic'     // Infographics (data visualization, stats)
  | 'chart'           // Charts & Graphs (bar, pie, line charts)
  | 'photo'           // Realistic photos (stock-photo style)
  | 'scene'           // Atmospheric scene images
  | 'concept';        // Conceptual/abstract visualizations

/**
 * Visual styles for image generation
 */
export type ImageStyle = 
  | 'realistic'       // Photorealistic style
  | 'illustrated'     // Hand-drawn/artistic illustration
  | 'minimal'         // Clean, minimal design
  | 'vintage'         // Retro/vintage aesthetic
  | 'modern'          // Contemporary, sleek design
  | 'watercolor'      // Watercolor painting style
  | 'digital-art'     // Digital art style
  | 'line-art'        // Simple line drawings
  | 'technical';      // Technical/blueprint style

/**
 * Book genres mapped to recommended image styles
 */
export const GENRE_IMAGE_STYLES: Record<string, { 
  primary: ImageStyle; 
  secondary: ImageStyle;
  recommendedTypes: BookImageType[];
}> = {
  'Fiction': {
    primary: 'illustrated',
    secondary: 'realistic',
    recommendedTypes: ['illustration', 'scene'],
  },
  'Fantasy': {
    primary: 'illustrated',
    secondary: 'digital-art',
    recommendedTypes: ['illustration', 'scene', 'concept'],
  },
  'Science Fiction': {
    primary: 'digital-art',
    secondary: 'modern',
    recommendedTypes: ['illustration', 'diagram', 'concept'],
  },
  'Romance': {
    primary: 'watercolor',
    secondary: 'illustrated',
    recommendedTypes: ['illustration', 'scene'],
  },
  'Thriller': {
    primary: 'realistic',
    secondary: 'modern',
    recommendedTypes: ['photo', 'scene'],
  },
  'Mystery': {
    primary: 'vintage',
    secondary: 'illustrated',
    recommendedTypes: ['illustration', 'scene'],
  },
  'Horror': {
    primary: 'digital-art',
    secondary: 'illustrated',
    recommendedTypes: ['illustration', 'scene', 'concept'],
  },
  'Non-Fiction': {
    primary: 'minimal',
    secondary: 'technical',
    recommendedTypes: ['diagram', 'infographic', 'chart'],
  },
  'Technical': {
    primary: 'technical',
    secondary: 'minimal',
    recommendedTypes: ['diagram', 'infographic', 'chart'],
  },
  'Business': {
    primary: 'modern',
    secondary: 'minimal',
    recommendedTypes: ['infographic', 'chart', 'diagram'],
  },
  'Self-Help': {
    primary: 'modern',
    secondary: 'illustrated',
    recommendedTypes: ['infographic', 'illustration', 'concept'],
  },
  'Biography': {
    primary: 'vintage',
    secondary: 'realistic',
    recommendedTypes: ['photo', 'illustration', 'infographic'],
  },
  'History': {
    primary: 'vintage',
    secondary: 'illustrated',
    recommendedTypes: ['illustration', 'infographic', 'diagram'],
  },
  'Science': {
    primary: 'technical',
    secondary: 'minimal',
    recommendedTypes: ['diagram', 'infographic', 'chart'],
  },
  'Children': {
    primary: 'illustrated',
    secondary: 'watercolor',
    recommendedTypes: ['illustration', 'scene'],
  },
  'Young Adult': {
    primary: 'digital-art',
    secondary: 'illustrated',
    recommendedTypes: ['illustration', 'scene'],
  },
  'Literary Fiction': {
    primary: 'watercolor',
    secondary: 'minimal',
    recommendedTypes: ['illustration', 'scene', 'concept'],
  },
};

/**
 * Image placement options
 */
export type ImagePlacement = 
  | 'inline'          // Inline with text
  | 'full-width'      // Full page width
  | 'float-left'      // Float left with text wrap
  | 'float-right'     // Float right with text wrap
  | 'center'          // Centered block
  | 'chapter-header'  // At start of chapter
  | 'section-break';  // Between sections

/**
 * Image size options for display
 */
export type ImageSize = 
  | 'small'           // 25% width, max 200px
  | 'medium'          // 50% width, max 400px  
  | 'large'           // 75% width, max 600px
  | 'full';           // Full width of content area

/**
 * Image size display information
 */
export const IMAGE_SIZE_INFO: Record<ImageSize, {
  name: string;
  description: string;
  cssClass: string;
}> = {
  small: {
    name: 'Small',
    description: '25% width',
    cssClass: 'w-1/4 max-w-[200px]',
  },
  medium: {
    name: 'Medium', 
    description: '50% width',
    cssClass: 'w-1/2 max-w-[400px]',
  },
  large: {
    name: 'Large',
    description: '75% width', 
    cssClass: 'w-3/4 max-w-[600px]',
  },
  full: {
    name: 'Full Width',
    description: '100% width',
    cssClass: 'w-full',
  },
};

/**
 * Auto-placement strategies for book generation
 */
export type AutoPlacementStrategy = 
  | 'none'                // No auto-placement
  | 'chapter-start'       // One image at start of each chapter
  | 'section-breaks'      // At section/scene breaks
  | 'key-concepts'        // When key concepts are introduced
  | 'per-page-estimate'   // Roughly every N pages
  | 'smart';              // AI analyzes and suggests placement

/**
 * Configuration for image generation during book creation
 */
export interface BookImageConfig {
  enabled: boolean;
  imagesPerChapter: number;           // 0-5 images per chapter
  preferredTypes: BookImageType[];    // Preferred image types
  preferredStyle: ImageStyle;         // Overall style preference
  autoPlacement: AutoPlacementStrategy;
  generateCaptions: boolean;          // Auto-generate captions
  includeAltText: boolean;            // Generate alt text for accessibility
  placement: ImagePlacement;          // Default placement
  aspectRatio?: '1:1' | '16:9' | '4:3' | '3:2' | '2:3';
}

/**
 * Default image configuration
 */
export const DEFAULT_IMAGE_CONFIG: BookImageConfig = {
  enabled: false,
  imagesPerChapter: 1,
  preferredTypes: ['illustration'],
  preferredStyle: 'illustrated',
  autoPlacement: 'smart',
  generateCaptions: true,
  includeAltText: true,
  placement: 'center',
  aspectRatio: '16:9',
};

/**
 * Metadata stored with each image
 */
export interface BookImageMetadata {
  width: number;
  height: number;
  style: ImageStyle;
  generationModel: string;
  generatedAt: string;
  fileSize?: number;
  format: 'png' | 'jpeg' | 'webp';
  aspectRatio: string;
}

/**
 * A book image entity
 */
export interface BookImage {
  id: number;
  bookId: number;
  chapterId?: number;
  imageUrl: string;
  thumbnailUrl?: string;
  imageType: BookImageType;
  position: number;              // Character position in chapter content
  placement: ImagePlacement;
  caption?: string;
  altText?: string;
  prompt?: string;               // Generation prompt for reference/regeneration
  metadata: BookImageMetadata;
  source: 'generated' | 'uploaded';
  createdAt: Date;
}

/**
 * Request to generate a book image
 */
export interface GenerateBookImageRequest {
  bookId: number;
  chapterId?: number;
  bookTitle: string;
  bookGenre: string;
  chapterTitle?: string;
  chapterContent?: string;       // Context for image generation
  imageType: BookImageType;
  style?: ImageStyle;
  customPrompt?: string;         // User-provided prompt override
  contextBefore?: string;        // Text before image position
  contextAfter?: string;         // Text after image position
  placement?: ImagePlacement;
  aspectRatio?: '1:1' | '16:9' | '4:3' | '3:2' | '2:3';
}

/**
 * Response from image generation
 */
export interface GenerateBookImageResponse {
  success: boolean;
  imageUrl?: string;
  thumbnailUrl?: string;
  prompt?: string;
  caption?: string;
  altText?: string;
  metadata?: BookImageMetadata;
  error?: string;
}

/**
 * Image suggestion from AI analysis
 */
export interface ImageSuggestion {
  position: number;              // Suggested position in text
  imageType: BookImageType;
  description: string;           // What the image should show
  reasoning: string;             // Why an image is suggested here
  priority: 'high' | 'medium' | 'low';
}

/**
 * Result of analyzing chapter for image opportunities
 */
export interface ChapterImageAnalysis {
  chapterId: number;
  chapterTitle: string;
  suggestions: ImageSuggestion[];
  recommendedCount: number;
}

/**
 * Image type descriptions for UI
 */
export const IMAGE_TYPE_INFO: Record<BookImageType, {
  name: string;
  description: string;
  icon: string;
  bestFor: string[];
}> = {
  illustration: {
    name: 'Illustration',
    description: 'Artistic illustrations of characters, scenes, or objects',
    icon: 'palette',
    bestFor: ['Fiction', 'Fantasy', 'Children', 'Young Adult'],
  },
  diagram: {
    name: 'Diagram',
    description: 'Technical diagrams, flowcharts, and system architecture',
    icon: 'bar-chart',
    bestFor: ['Technical', 'Non-Fiction', 'Science', 'Business'],
  },
  infographic: {
    name: 'Infographic',
    description: 'Data visualizations, statistics, and information graphics',
    icon: 'trending-up',
    bestFor: ['Business', 'Self-Help', 'Non-Fiction', 'Science'],
  },
  chart: {
    name: 'Chart',
    description: 'Bar charts, pie charts, line graphs, and data charts',
    icon: 'trending-down',
    bestFor: ['Business', 'Science', 'Non-Fiction', 'Technical'],
  },
  photo: {
    name: 'Realistic Photo',
    description: 'Photorealistic images in stock photo style',
    icon: 'camera',
    bestFor: ['Biography', 'Thriller', 'Non-Fiction', 'Business'],
  },
  scene: {
    name: 'Scene',
    description: 'Atmospheric scenes showing locations and environments',
    icon: 'landscape',
    bestFor: ['Fiction', 'Fantasy', 'Thriller', 'Romance'],
  },
  concept: {
    name: 'Concept Art',
    description: 'Abstract or conceptual visualizations of ideas',
    icon: 'lightbulb',
    bestFor: ['Self-Help', 'Fantasy', 'Science Fiction', 'Philosophy'],
  },
};

/**
 * Image style descriptions for UI
 */
export const IMAGE_STYLE_INFO: Record<ImageStyle, {
  name: string;
  description: string;
}> = {
  realistic: {
    name: 'Realistic',
    description: 'Photorealistic, high-detail images',
  },
  illustrated: {
    name: 'Illustrated',
    description: 'Hand-drawn, artistic illustration style',
  },
  minimal: {
    name: 'Minimal',
    description: 'Clean, simple design with minimal elements',
  },
  vintage: {
    name: 'Vintage',
    description: 'Retro, aged, or historical aesthetic',
  },
  modern: {
    name: 'Modern',
    description: 'Contemporary, sleek, and polished design',
  },
  watercolor: {
    name: 'Watercolor',
    description: 'Soft watercolor painting style',
  },
  'digital-art': {
    name: 'Digital Art',
    description: 'Modern digital art and CGI style',
  },
  'line-art': {
    name: 'Line Art',
    description: 'Simple line drawings and sketches',
  },
  technical: {
    name: 'Technical',
    description: 'Blueprint or technical drawing style',
  },
};

/**
 * Get recommended image configuration for a genre
 */
export function getGenreImageDefaults(genre: string): Partial<BookImageConfig> {
  const genreConfig = GENRE_IMAGE_STYLES[genre] || GENRE_IMAGE_STYLES['Fiction'];
  return {
    preferredTypes: genreConfig.recommendedTypes,
    preferredStyle: genreConfig.primary,
  };
}

/**
 * Aspect ratio dimensions
 */
export const ASPECT_RATIOS: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1792, height: 1024 },
  '4:3': { width: 1365, height: 1024 },
  '3:2': { width: 1536, height: 1024 },
  '2:3': { width: 1024, height: 1536 },
};
