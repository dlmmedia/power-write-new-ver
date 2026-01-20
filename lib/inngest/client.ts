import { Inngest } from 'inngest';

// Create the Inngest client
// This client is used to send events and define functions
const INNGEST_DEV = (process.env.INNGEST_DEV || '').toLowerCase();
const INNGEST_BASE_URL = process.env.INNGEST_BASE_URL?.trim();
const INNGEST_EVENT_KEY = process.env.INNGEST_EVENT_KEY?.trim();
const INNGEST_SIGNING_KEY = process.env.INNGEST_SIGNING_KEY?.trim();

export function getMissingInngestEnv(): Array<'INNGEST_EVENT_KEY' | 'INNGEST_SIGNING_KEY'> {
  // In local dev, Inngest Dev Server can be used without real cloud keys.
  // If explicitly in dev mode and a base URL is provided, don't require keys.
  const isDevMode = INNGEST_DEV === '1' || INNGEST_DEV === 'true' || INNGEST_DEV === 'yes';
  if (isDevMode && INNGEST_BASE_URL) return [];

  const missing: Array<'INNGEST_EVENT_KEY' | 'INNGEST_SIGNING_KEY'> = [];
  if (!INNGEST_EVENT_KEY) missing.push('INNGEST_EVENT_KEY');
  if (!INNGEST_SIGNING_KEY) missing.push('INNGEST_SIGNING_KEY');
  return missing;
}

export function isInngestConfigured(): boolean {
  return getMissingInngestEnv().length === 0;
}

export const inngest = new Inngest({
  id: 'powerwrite',
  name: 'PowerWrite Book Studio',
  eventKey: INNGEST_EVENT_KEY,
  signingKey: INNGEST_SIGNING_KEY,
  baseUrl: INNGEST_BASE_URL,
  // Event types for TypeScript
});

// Event type definitions for type safety
export type BookGenerationStartedEvent = {
  name: 'book/generation.started';
  data: {
    bookId: number;
    userId: string;
    totalChapters: number;
    outline: {
      title: string;
      author: string;
      genre: string;
      description: string;
      chapters: Array<{
        number: number;
        title: string;
        summary: string;
        wordCount: number;
      }>;
    };
    config: {
      chapterModel: string;
      generationSpeed: 'quality' | 'balanced' | 'fast';
      useParallel: boolean;
      bibliographyEnabled: boolean;
      citationStyle?: string;
    };
  };
};

export type ChapterBatchRequestedEvent = {
  name: 'book/chapter.batch.requested';
  data: {
    bookId: number;
    chapterNumbers: number[];
    previousContext: string;
    outline: BookGenerationStartedEvent['data']['outline'];
    config: BookGenerationStartedEvent['data']['config'];
  };
};

export type BookGenerationCompletedEvent = {
  name: 'book/generation.completed';
  data: {
    bookId: number;
    totalChapters: number;
    totalWords: number;
  };
};

// Video export events
export type VideoExportStartedEvent = {
  name: 'video/export.started';
  data: {
    jobId: number;
    bookId: number;
    userId: string;
    scope: 'chapter' | 'full';
    chapterNumber?: number;
    theme: 'day' | 'night' | 'sepia' | 'focus';
    fontSize: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | 'xxl';
    baseUrl: string;
  };
};

export type VideoExportCancelledEvent = {
  name: 'video/export.cancelled';
  data: {
    jobId: number;
  };
};

// Union type of all events
export type PowerWriteEvents = 
  | BookGenerationStartedEvent 
  | ChapterBatchRequestedEvent
  | BookGenerationCompletedEvent
  | VideoExportStartedEvent
  | VideoExportCancelledEvent;













