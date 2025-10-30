export interface SelectedBook {
  id: string;
  title: string;
  authors: string[];
  genre?: string;
  description?: string;
  imageUrl?: string;
  publishedDate?: string;
  pageCount?: number;
  averageRating?: number;
  language?: string;
  publisher?: string;
  categories?: string[];
  metadata?: {
    writingStyle?: string;
    narrativeStructure?: string;
    tone?: string;
    themes?: string[];
  };
}

export interface BookFilters {
  genre?: string;
  author?: string;
  yearFrom?: number;
  yearTo?: number;
  minRating?: number;
  language?: string;
}

export interface BookSortOption {
  field: 'relevance' | 'rating' | 'date' | 'title';
  direction: 'asc' | 'desc';
}

export interface ReferenceBook {
  id: number;
  userId: string;
  title: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: 'pdf' | 'docx' | 'txt';
  extractedText?: string;
  analysis?: ReferenceAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferenceAnalysis {
  writingStyle: {
    style: string;
    confidence: number;
    samples: string[];
  };
  narrativeStructure: {
    structure: string;
    confidence: number;
  };
  tone: string;
  pov: string; // Point of view
  tense: string;
  themes: string[];
  characterTypes: string[];
  avgChapterLength: number;
  vocabularyLevel: string;
  dialogueStyle?: string;
  pacing?: string;
}
