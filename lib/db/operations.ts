import { db } from './index';
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
}

// ============ BOOK OPERATIONS ============

export async function createBook(data: InsertGeneratedBook): Promise<GeneratedBook> {
  const [book] = await db.insert(generatedBooks).values(data).returning();
  return book;
}

export async function getBook(id: number): Promise<GeneratedBook | null> {
  const [book] = await db
    .select()
    .from(generatedBooks)
    .where(eq(generatedBooks.id, id))
    .limit(1);
  return book || null;
}

export async function updateBook(
  id: number,
  data: Partial<InsertGeneratedBook>
): Promise<GeneratedBook | null> {
  const [book] = await db
    .update(generatedBooks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(generatedBooks.id, id))
    .returning();
  return book || null;
}

export async function deleteBook(id: number): Promise<void> {
  await db.delete(generatedBooks).where(eq(generatedBooks.id, id));
}

export async function getUserBooks(userId: string): Promise<GeneratedBook[]> {
  return await db
    .select()
    .from(generatedBooks)
    .where(eq(generatedBooks.userId, userId))
    .orderBy(desc(generatedBooks.createdAt));
}

export async function searchBooks(
  userId: string,
  query: string
): Promise<GeneratedBook[]> {
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
}

export async function getBooksByGenre(
  userId: string,
  genre: string
): Promise<GeneratedBook[]> {
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
}

export async function getBooksByStatus(
  userId: string,
  status: string
): Promise<GeneratedBook[]> {
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
}

// ============ CHAPTER OPERATIONS ============

export async function createChapter(data: InsertBookChapter): Promise<BookChapter> {
  const [chapter] = await db.insert(bookChapters).values(data).returning();
  return chapter;
}

export async function createMultipleChapters(
  chapters: InsertBookChapter[]
): Promise<BookChapter[]> {
  if (chapters.length === 0) return [];
  return await db.insert(bookChapters).values(chapters).returning();
}

export async function getChapter(id: number): Promise<BookChapter | null> {
  const [chapter] = await db
    .select()
    .from(bookChapters)
    .where(eq(bookChapters.id, id))
    .limit(1);
  return chapter || null;
}

export async function getBookChapters(bookId: number): Promise<BookChapter[]> {
  return await db
    .select()
    .from(bookChapters)
    .where(eq(bookChapters.bookId, bookId))
    .orderBy(bookChapters.chapterNumber);
}

export async function updateChapter(
  id: number,
  data: Partial<InsertBookChapter>
): Promise<BookChapter | null> {
  const [chapter] = await db
    .update(bookChapters)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(bookChapters.id, id))
    .returning();
  return chapter || null;
}

export async function deleteChapter(id: number): Promise<void> {
  await db.delete(bookChapters).where(eq(bookChapters.id, id));
}

export async function deleteBookChapters(bookId: number): Promise<void> {
  await db.delete(bookChapters).where(eq(bookChapters.bookId, bookId));
}

export async function updateChapterAudio(
  chapterId: number,
  audioUrl: string,
  audioDuration: number,
  audioMetadata?: any
): Promise<BookChapter | null> {
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
}

export async function getChapterByBookAndNumber(
  bookId: number,
  chapterNumber: number
): Promise<BookChapter | null> {
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
}

// ============ REFERENCE BOOK OPERATIONS ============

export async function createReferenceBook(
  data: InsertReferenceBook
): Promise<ReferenceBook> {
  const [refBook] = await db.insert(referenceBooks).values(data).returning();
  return refBook;
}

export async function getReferenceBook(id: number): Promise<ReferenceBook | null> {
  const [refBook] = await db
    .select()
    .from(referenceBooks)
    .where(eq(referenceBooks.id, id))
    .limit(1);
  return refBook || null;
}

export async function getUserReferenceBooks(
  userId: string
): Promise<ReferenceBook[]> {
  return await db
    .select()
    .from(referenceBooks)
    .where(eq(referenceBooks.userId, userId))
    .orderBy(desc(referenceBooks.createdAt));
}

export async function updateReferenceBook(
  id: number,
  data: Partial<InsertReferenceBook>
): Promise<ReferenceBook | null> {
  const [refBook] = await db
    .update(referenceBooks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(referenceBooks.id, id))
    .returning();
  return refBook || null;
}

export async function deleteReferenceBook(id: number): Promise<void> {
  await db.delete(referenceBooks).where(eq(referenceBooks.id, id));
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
  const [config] = await db
    .select()
    .from(bibliographyConfigs)
    .where(eq(bibliographyConfigs.bookId, bookId))
    .limit(1);
  return config || null;
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
  return await db
    .select()
    .from(bibliographyReferences)
    .where(eq(bibliographyReferences.bookId, bookId))
    .orderBy(bibliographyReferences.createdAt);
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
  return await db
    .select()
    .from(citations)
    .where(eq(citations.bookId, bookId))
    .orderBy(citations.createdAt);
}

export async function getChapterCitations(chapterId: number): Promise<Citation[]> {
  return await db
    .select()
    .from(citations)
    .where(eq(citations.chapterId, chapterId))
    .orderBy(citations.position);
}

export async function createCitation(data: InsertCitation): Promise<Citation> {
  const [citation] = await db.insert(citations).values(data).returning();
  return citation;
}

export async function deleteCitation(id: string): Promise<void> {
  await db.delete(citations).where(eq(citations.id, id));
}

// Get complete bibliography data for a book (for export)
export async function getBookBibliography(bookId: number): Promise<{
  config: BibliographyConfigDB | null;
  references: BibliographyReference[];
  citations: Citation[];
} | null> {
  const config = await getBibliographyConfig(bookId);
  const references = await getBibliographyReferences(bookId);
  const bookCitations = await getBookCitations(bookId);
  
  return {
    config,
    references,
    citations: bookCitations,
  };
}

// Get book with chapters and bibliography
export async function getBookWithChaptersAndBibliography(bookId: number | string) {
  const id = typeof bookId === 'string' ? parseInt(bookId, 10) : bookId;
  const book = await getBook(id);
  if (!book) {
    return null;
  }
  const chapters = await getBookChapters(id);
  const bibliography = await getBookBibliography(id);
  
  return {
    ...book,
    chapters,
    bibliography,
  };
}
