import { db } from './index';
import {
  generatedBooks,
  bookChapters,
  referenceBooks,
  users,
  InsertGeneratedBook,
  InsertBookChapter,
  InsertReferenceBook,
  GeneratedBook,
  BookChapter,
  ReferenceBook,
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
    userId,
    title: `${bookData.title} (Copy)`,
    status: 'draft',
  });

  const originalChapters = await getBookChapters(bookId);
  if (originalChapters.length > 0) {
    const newChapters = originalChapters.map(({ id, bookId: _, createdAt, updatedAt, ...chapterData }) => ({
      ...chapterData,
      bookId: newBook.id,
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
