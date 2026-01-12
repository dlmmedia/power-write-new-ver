import { BookConfiguration } from './studio';

export interface GenerationProgress {
  bookId: number;
  stage: 'outline' | 'chapters' | 'cover' | 'formatting' | 'complete' | 'error';
  currentChapter?: number;
  totalChapters: number;
  percentage: number;
  message: string;
  startedAt: Date;
  estimatedCompletion?: Date;
}

export interface ChapterOutline {
  number: number;
  title: string;
  summary: string;
  wordCount: number;
  themes?: string[];
}

export interface BookOutline {
  title: string;
  author: string;
  genre: string;
  description: string;
  chapters: ChapterOutline[];
  themes?: string[];
  characters?: CharacterOutline[];
  totalWordCount: number;
}

export interface CharacterOutline {
  name: string;
  role: string;
  description: string;
}

export interface GeneratedChapter {
  id: number;
  bookId: number;
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratedBook {
  id: number;
  userId: string;
  title: string;
  author: string;
  genre: string;
  summary: string;
  outline?: BookOutline;
  content?: string;
  chapters?: GeneratedChapter[];
  config: BookConfiguration;
  metadata: BookMetadata;
  coverImageUrl?: string;
  pdfUrl?: string;
  docxUrl?: string;
  audioUrl?: string;
  status: BookStatus;
  productionStatus?: ProductionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type BookStatus = 'draft' | 'generating' | 'outline-ready' | 'chapters-generating' | 'completed' | 'failed';

export type ProductionStatus = 'draft' | 'in-progress' | 'content-complete' | 'audio-pending' | 'published';

export interface BookMetadata {
  wordCount: number;
  pageCount?: number;
  readingTime?: number; // in minutes
  chapters: number;
  generatedAt?: Date;
  lastModified: Date;
}

export interface CoverGenerationConfig {
  title: string;
  author: string;
  genre: string;
  style: 'minimalist' | 'illustrative' | 'photographic' | 'abstract' | 'typographic';
  colorScheme: string;
  themes: string[];
  description: string;
  referenceImageUrl?: string;
}

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'txt' | 'epub';
  includeCover: boolean;
  includeTOC: boolean;
  includePageNumbers: boolean;
  includeFrontMatter: boolean;
  includeBackMatter: boolean;
}

export interface AudioGenerationConfig {
  bookId: number;
  voice: string;
  speed: number; // 0.5 to 2.0
  language: string;
  chapterByChapter: boolean;
}

export interface GenerationRequest {
  config: BookConfiguration;
  stage: 'outline' | 'full-book' | 'chapters' | 'single-chapter';
  chapterNumbers?: number[]; // For regenerating specific chapters
  saveToDatabase: boolean;
}

export interface GenerationResponse {
  success: boolean;
  bookId?: number;
  outline?: BookOutline;
  chapters?: GeneratedChapter[];
  error?: string;
  progress?: GenerationProgress;
}
