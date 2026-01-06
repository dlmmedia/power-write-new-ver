import {
  db,
  withRetry,
  DEFAULT_RETRY_CONFIG,
  QUICK_RETRY_CONFIG,
  EXTENDED_RETRY_CONFIG,
} from './index';
import {
  generatedBooks,
  bookChapters,
  referenceBooks,
  users,
  bibliographyReferences,
  bibliographyConfigs,
  citations,
  InsertGeneratedBook,
  InsertBookChapter,
  InsertReferenceBook,
  InsertBibliographyReference,
  InsertBibliographyConfig,
  InsertCitation,
  GeneratedBook,
  BookChapter,
  ReferenceBook,
  BibliographyReference,
  BibliographyConfigDB,
  Citation,
} from './schema';
import { eq, and, desc, like, inArray } from 'drizzle-orm';

// ============ USER OPERATIONS ============

export async function ensureDemoUser(userId: string) {
  return withRetry(async () => {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      await db.insert(users).values({
        id: userId,
        email: `${userId}@demo.powerwrite.com`,
        firstName: 'Demo',
        lastName: 'User',
        plan: 'starter',
        creditsUsed: 0,
        creditsLimit: 10,
      });
    }
  }, DEFAULT_RETRY_CONFIG, 'ensureDemoUser');
}

// ============ BOOK OPERATIONS ============

export async function createBook(data: InsertGeneratedBook): Promise<GeneratedBook> {
  return withRetry(async () => {
    const [book] = await db.insert(generatedBooks).values(data).returning();
    return book;
  }, EXTENDED_RETRY_CONFIG, 'createBook');
}

export async function getBook(id: number): Promise<GeneratedBook | null> {
  return withRetry(async () => {
    const [book] = await db
      .select()
      .from(generatedBooks)
      .where(eq(generatedBooks.id, id))
      .limit(1);
    return book || null;
  }, DEFAULT_RETRY_CONFIG, 'getBook');
}

export async function updateBook(
  id: number,
  data: Partial<InsertGeneratedBook>
): Promise<GeneratedBook | null> {
  return withRetry(async () => {
    const [book] = await db
      .update(generatedBooks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(generatedBooks.id, id))
      .returning();
    return book || null;
  }, EXTENDED_RETRY_CONFIG, 'updateBook');
}

export async function deleteBook(id: number): Promise<void> {
  return withRetry(async () => {
    await db.delete(generatedBooks).where(eq(generatedBooks.id, id));
  }, DEFAULT_RETRY_CONFIG, 'deleteBook');
}

export async function getUserBooks(userId: string): Promise<GeneratedBook[]> {
  return withRetry(async () => {
    return await db
      .select()
      .from(generatedBooks)
      .where(eq(generatedBooks.userId, userId))
      .orderBy(desc(generatedBooks.createdAt));
  }, DEFAULT_RETRY_CONFIG, 'getUserBooks');
}

export async function searchBooks(
  userId: string,
  query: string
): Promise<GeneratedBook[]> {
  return withRetry(async () => {
    return await db
      .select()
      .from(generatedBooks)
      .where(
        and(
          eq(generatedBooks.userId, userId),
          like(generatedBooks.title, `%${query}%`)
        )
      )
      .orderBy(desc(generatedBooks.createdAt));
  }, QUICK_RETRY_CONFIG, 'searchBooks');
}

export async function getBooksByGenre(
  userId: string,
  genre: string
): Promise<GeneratedBook[]> {
  return withRetry(async () => {
    return await db
      .select()
      .from(generatedBooks)
      .where(
        and(
          eq(generatedBooks.userId, userId),
          eq(generatedBooks.genre, genre)
        )
      )
      .orderBy(desc(generatedBooks.createdAt));
  }, QUICK_RETRY_CONFIG, 'getBooksByGenre');
}

export async function getBooksByStatus(
  userId: string,
  status: string
): Promise<GeneratedBook[]> {
  return withRetry(async () => {
    return await db
      .select()
      .from(generatedBooks)
      .where(
        and(
          eq(generatedBooks.userId, userId),
          eq(generatedBooks.status, status)
        )
      )
      .orderBy(desc(generatedBooks.createdAt));
  }, QUICK_RETRY_CONFIG, 'getBooksByStatus');
}

// ============ CHAPTER OPERATIONS ============

export async function createChapter(data: InsertBookChapter): Promise<BookChapter> {
  return withRetry(async () => {
    const [chapter] = await db.insert(bookChapters).values(data).returning();
    return chapter;
  }, EXTENDED_RETRY_CONFIG, 'createChapter');
}

export async function createMultipleChapters(
  chapters: InsertBookChapter[]
): Promise<BookChapter[]> {
  if (chapters.length === 0) return [];
  return withRetry(async () => {
    return await db.insert(bookChapters).values(chapters).returning();
  }, EXTENDED_RETRY_CONFIG, 'createMultipleChapters');
}

export async function getChapter(id: number): Promise<BookChapter | null> {
  return withRetry(async () => {
    const [chapter] = await db
      .select()
      .from(bookChapters)
      .where(eq(bookChapters.id, id))
      .limit(1);
    return chapter || null;
  }, DEFAULT_RETRY_CONFIG, 'getChapter');
}

export async function getBookChapters(bookId: number): Promise<BookChapter[]> {
  return withRetry(async () => {
    return await db
      .select()
      .from(bookChapters)
      .where(eq(bookChapters.bookId, bookId))
      .orderBy(bookChapters.chapterNumber);
  }, DEFAULT_RETRY_CONFIG, 'getBookChapters');
}

// Get audio stats for multiple books (for library listing)
export interface BookAudioStats {
  bookId: number;
  chaptersWithAudio: number;
  totalChapters: number;
  totalDuration: number; // in seconds
}

export async function getBooksAudioStats(bookIds: number[]): Promise<Map<number, BookAudioStats>> {
  if (bookIds.length === 0) return new Map();

  const chapters = await withRetry(async () => {
    return await db
      .select()
      .from(bookChapters)
      .where(inArray(bookChapters.bookId, bookIds));
  }, DEFAULT_RETRY_CONFIG, 'getBooksAudioStats');

  const statsMap = new Map<number, BookAudioStats>();

  // Initialize stats for all book IDs
  bookIds.forEach(id => {
    statsMap.set(id, {
      bookId: id,
      chaptersWithAudio: 0,
      totalChapters: 0,
      totalDuration: 0,
    });
  });

  // Aggregate stats from chapters
  chapters.forEach(chapter => {
    const stats = statsMap.get(chapter.bookId);
    if (stats) {
      stats.totalChapters++;
      if (chapter.audioUrl) {
        stats.chaptersWithAudio++;
        stats.totalDuration += chapter.audioDuration || 0;
      }
    }
  });

  return statsMap;
}

export async function updateChapter(
  id: number,
  data: Partial<InsertBookChapter>
): Promise<BookChapter | null> {
  return withRetry(async () => {
    const [chapter] = await db
      .update(bookChapters)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bookChapters.id, id))
      .returning();
    return chapter || null;
  }, EXTENDED_RETRY_CONFIG, 'updateChapter');
}

export async function deleteChapter(id: number): Promise<void> {
  return withRetry(async () => {
    await db.delete(bookChapters).where(eq(bookChapters.id, id));
  }, DEFAULT_RETRY_CONFIG, 'deleteChapter');
}

export async function deleteBookChapters(bookId: number): Promise<void> {
  return withRetry(async () => {
    await db.delete(bookChapters).where(eq(bookChapters.bookId, bookId));
  }, DEFAULT_RETRY_CONFIG, 'deleteBookChapters');
}

export async function updateChapterAudio(
  chapterId: number,
  audioUrl: string,
  audioDuration: number,
  audioMetadata?: any
): Promise<BookChapter | null> {
  return withRetry(async () => {
    const [chapter] = await db
      .update(bookChapters)
      .set({
        audioUrl,
        audioDuration,
        audioMetadata,
        updatedAt: new Date(),
      })
      .where(eq(bookChapters.id, chapterId))
      .returning();
    return chapter || null;
  }, EXTENDED_RETRY_CONFIG, 'updateChapterAudio');
}

export async function getChapterByBookAndNumber(
  bookId: number,
  chapterNumber: number
): Promise<BookChapter | null> {
  return withRetry(async () => {
    const [chapter] = await db
      .select()
      .from(bookChapters)
      .where(
        and(
          eq(bookChapters.bookId, bookId),
          eq(bookChapters.chapterNumber, chapterNumber)
        )
      )
      .limit(1);
    return chapter || null;
  }, DEFAULT_RETRY_CONFIG, 'getChapterByBookAndNumber');
}

// ============ REFERENCE BOOK OPERATIONS ============

export async function createReferenceBook(
  data: InsertReferenceBook
): Promise<ReferenceBook> {
  return withRetry(async () => {
    const [refBook] = await db.insert(referenceBooks).values(data).returning();
    return refBook;
  }, EXTENDED_RETRY_CONFIG, 'createReferenceBook');
}

export async function getReferenceBook(id: number): Promise<ReferenceBook | null> {
  return withRetry(async () => {
    const [refBook] = await db
      .select()
      .from(referenceBooks)
      .where(eq(referenceBooks.id, id))
      .limit(1);
    return refBook || null;
  }, DEFAULT_RETRY_CONFIG, 'getReferenceBook');
}

export async function getUserReferenceBooks(
  userId: string
): Promise<ReferenceBook[]> {
  return withRetry(async () => {
    return await db
      .select()
      .from(referenceBooks)
      .where(eq(referenceBooks.userId, userId))
      .orderBy(desc(referenceBooks.createdAt));
  }, DEFAULT_RETRY_CONFIG, 'getUserReferenceBooks');
}

export async function updateReferenceBook(
  id: number,
  data: Partial<InsertReferenceBook>
): Promise<ReferenceBook | null> {
  return withRetry(async () => {
    const [refBook] = await db
      .update(referenceBooks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(referenceBooks.id, id))
      .returning();
    return refBook || null;
  }, EXTENDED_RETRY_CONFIG, 'updateReferenceBook');
}

export async function deleteReferenceBook(id: number): Promise<void> {
  return withRetry(async () => {
    await db.delete(referenceBooks).where(eq(referenceBooks.id, id));
  }, DEFAULT_RETRY_CONFIG, 'deleteReferenceBook');
}

// ============ COMBINED OPERATIONS ============

export async function getBookWithChapters(bookId: number | string) {
  const id = typeof bookId === 'string' ? parseInt(bookId, 10) : bookId;
  const book = await getBook(id);
  if (!book) {
    return null;
  }
  const chapters = await getBookChapters(id);
  return {
    ...book,
    chapters,
  };
}

export async function duplicateBook(
  bookId: number,
  userId: string
): Promise<GeneratedBook | null> {
  const original = await getBook(bookId);
  if (!original) return null;

  const { id, createdAt, updatedAt, ...bookData } = original;
  const newBook = await createBook({
    ...bookData,
    // Ensure JSON fields conform to expected Insert types
    outline: bookData.outline as any,
    chapters: bookData.chapters as any,
    config: bookData.config as any,
    metadata: bookData.metadata as any,
    sourceBookData: bookData.sourceBookData as any,
    referenceBooks: bookData.referenceBooks as any,
    coverMetadata: bookData.coverMetadata as InsertGeneratedBook['coverMetadata'],
    userId,
    title: `${bookData.title} (Copy)`,
    status: 'draft',
  });

  const originalChapters = await getBookChapters(bookId);
  if (originalChapters.length > 0) {
    const newChapters: InsertBookChapter[] = originalChapters.map(({ id, bookId: _, createdAt, updatedAt, audioMetadata, ...chapterData }) => ({
      ...chapterData,
      bookId: newBook.id,
      audioMetadata: audioMetadata as InsertBookChapter['audioMetadata'],
    }));
    await createMultipleChapters(newChapters);
  }

  return newBook;
}

// ============ STATISTICS ============

export async function getUserBookStats(userId: string): Promise<{
  totalBooks: number;
  completedBooks: number;
  totalWords: number;
  totalChapters: number;
}> {
  const books = await getUserBooks(userId);
  
  return {
    totalBooks: books.length,
    completedBooks: books.filter(b => b.status === 'completed').length,
    totalWords: books.reduce((sum, b) => {
      const metadata = b.metadata as any;
      return sum + (metadata?.wordCount || 0);
    }, 0),
    totalChapters: books.reduce((sum, b) => {
      const metadata = b.metadata as any;
      return sum + (metadata?.chapters || 0);
    }, 0),
  };
}

// ============ BIBLIOGRAPHY OPERATIONS ============

export async function getBibliographyConfig(bookId: number): Promise<BibliographyConfigDB | null> {
  try {
    const [config] = await db
      .select()
      .from(bibliographyConfigs)
      .where(eq(bibliographyConfigs.bookId, bookId))
      .limit(1);
    return config || null;
  } catch (error: any) {
    // Handle case where table doesn't exist (code 42P01)
    if (error?.cause?.code === '42P01' || error?.message?.includes('does not exist')) {
      console.warn('Bibliography configs table does not exist, skipping');
      return null;
    }
    throw error;
  }
}

export async function createBibliographyConfig(data: InsertBibliographyConfig): Promise<BibliographyConfigDB> {
  const [config] = await db.insert(bibliographyConfigs).values(data).returning();
  return config;
}

export async function updateBibliographyConfig(
  bookId: number,
  data: Partial<InsertBibliographyConfig>
): Promise<BibliographyConfigDB | null> {
  const [config] = await db
    .update(bibliographyConfigs)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(bibliographyConfigs.bookId, bookId))
    .returning();
  return config || null;
}

export async function upsertBibliographyConfig(data: InsertBibliographyConfig): Promise<BibliographyConfigDB> {
  const existing = await getBibliographyConfig(data.bookId);
  if (existing) {
    const updated = await updateBibliographyConfig(data.bookId, data);
    return updated!;
  }
  return await createBibliographyConfig(data);
}

export async function getBibliographyReferences(bookId: number): Promise<BibliographyReference[]> {
  try {
    return await db
      .select()
      .from(bibliographyReferences)
      .where(eq(bibliographyReferences.bookId, bookId))
      .orderBy(bibliographyReferences.createdAt);
  } catch (error: any) {
    // Handle case where table doesn't exist (code 42P01)
    if (error?.cause?.code === '42P01' || error?.message?.includes('does not exist')) {
      console.warn('Bibliography references table does not exist, skipping');
      return [];
    }
    throw error;
  }
}

export async function createBibliographyReference(data: InsertBibliographyReference): Promise<BibliographyReference> {
  const [ref] = await db.insert(bibliographyReferences).values(data).returning();
  return ref;
}

export async function updateBibliographyReference(
  id: string,
  data: Partial<InsertBibliographyReference>
): Promise<BibliographyReference | null> {
  const [ref] = await db
    .update(bibliographyReferences)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(bibliographyReferences.id, id))
    .returning();
  return ref || null;
}

export async function deleteBibliographyReference(id: string): Promise<void> {
  await db.delete(bibliographyReferences).where(eq(bibliographyReferences.id, id));
}

export async function getBookCitations(bookId: number): Promise<Citation[]> {
  try {
    return await db
      .select()
      .from(citations)
      .where(eq(citations.bookId, bookId))
      .orderBy(citations.createdAt);
  } catch (error: any) {
    // Handle case where table doesn't exist (code 42P01)
    if (error?.cause?.code === '42P01' || error?.message?.includes('does not exist')) {
      console.warn('Citations table does not exist, skipping');
      return [];
    }
    throw error;
  }
}

export async function getChapterCitations(chapterId: number): Promise<Citation[]> {
  try {
    return await db
      .select()
      .from(citations)
      .where(eq(citations.chapterId, chapterId))
      .orderBy(citations.position);
  } catch (error: any) {
    // Handle case where table doesn't exist (code 42P01)
    if (error?.cause?.code === '42P01' || error?.message?.includes('does not exist')) {
      console.warn('Citations table does not exist, skipping');
      return [];
    }
    throw error;
  }
}

export async function createCitation(data: InsertCitation): Promise<Citation> {
  const [citation] = await db.insert(citations).values(data).returning();
  return citation;
}

export async function deleteCitation(id: string): Promise<void> {
  await db.delete(citations).where(eq(citations.id, id));
}

// Get complete bibliography data for a book (for export)
// Parallelized for better performance
export async function getBookBibliography(bookId: number): Promise<{
  config: BibliographyConfigDB | null;
  references: BibliographyReference[];
  citations: Citation[];
} | null> {
  // Fetch all bibliography data in parallel for better performance
  const [config, references, bookCitations] = await Promise.all([
    getBibliographyConfig(bookId),
    getBibliographyReferences(bookId),
    getBookCitations(bookId),
  ]);
  
  return {
    config,
    references,
    citations: bookCitations,
  };
}

// Get book with chapters and bibliography
// Parallelized for better performance - fetches book, chapters, and bibliography simultaneously
export async function getBookWithChaptersAndBibliography(bookId: number | string) {
  const id = typeof bookId === 'string' ? parseInt(bookId, 10) : bookId;
  
  // First fetch book to check if it exists
  const book = await getBook(id);
  if (!book) {
    return null;
  }
  
  // Then fetch chapters and bibliography in parallel for better performance
  const [chapters, bibliography] = await Promise.all([
    getBookChapters(id),
    getBookBibliography(id),
  ]);
  
  return {
    ...book,
    chapters,
    bibliography,
  };
}

// ============ SHOWCASE OPERATIONS ============

export async function getPublicBooks(): Promise<GeneratedBook[]> {
  return await db
    .select()
    .from(generatedBooks)
    .where(eq(generatedBooks.isPublic, true))
    .orderBy(desc(generatedBooks.updatedAt));
}

export async function toggleBookPublic(
  bookId: number,
  isPublic: boolean
): Promise<GeneratedBook | null> {
  const [book] = await db
    .update(generatedBooks)
    .set({ isPublic, updatedAt: new Date() })
    .where(eq(generatedBooks.id, bookId))
    .returning();
  return book || null;
}

export async function getPublicBook(bookId: number): Promise<GeneratedBook | null> {
  const [book] = await db
    .select()
    .from(generatedBooks)
    .where(
      and(
        eq(generatedBooks.id, bookId),
        eq(generatedBooks.isPublic, true)
      )
    )
    .limit(1);
  return book || null;
}

// Parallelized for better performance
export async function getPublicBookWithChapters(bookId: number | string) {
  const id = typeof bookId === 'string' ? parseInt(bookId, 10) : bookId;
  const book = await getPublicBook(id);
  if (!book) {
    return null;
  }
  
  // Fetch chapters and bibliography in parallel
  const [chapters, bibliography] = await Promise.all([
    getBookChapters(id),
    getBookBibliography(id),
  ]);
  
  return {
    ...book,
    chapters,
    bibliography,
  };
}
