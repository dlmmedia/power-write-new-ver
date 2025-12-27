import { Inngest } from 'inngest';

// Create the Inngest client
// This client is used to send events and define functions
export const inngest = new Inngest({
  id: 'powerwrite',
  name: 'PowerWrite Book Studio',
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

// Union type of all events
export type PowerWriteEvents = 
  | BookGenerationStartedEvent 
  | ChapterBatchRequestedEvent
  | BookGenerationCompletedEvent;











