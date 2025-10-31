import { db } from '@/lib/db';
import { cachedBooks } from '@/lib/db/schema';
import { BookResult } from './google-books';
import { eq, or, ilike, sql, and, gt } from 'drizzle-orm';

export class BookCacheService {
  private readonly CACHE_DURATION_DAYS = 30; // Cache expires after 30 days

  /**
   * Cache a book result to the database
   */
  async cacheBook(book: BookResult): Promise<void> {
    try {
      const externalId = `${book.source}_${book.id}`;
      
      await db.insert(cachedBooks)
        .values({
          externalId,
          source: book.source,
          title: book.title,
          authors: book.authors,
          description: book.description,
          publishedDate: book.publishedDate,
          pageCount: book.pageCount,
          categories: book.categories,
          imageLinks: book.imageLinks,
          averageRating: book.averageRating,
          ratingsCount: book.ratingsCount,
          language: book.language,
          publisher: book.publisher,
          isbn: book.isbn,
          metadata: {},
        })
        .onConflictDoUpdate({
          target: cachedBooks.externalId,
          set: {
            title: book.title,
            authors: book.authors,
            description: book.description,
            publishedDate: book.publishedDate,
            pageCount: book.pageCount,
            categories: book.categories,
            imageLinks: book.imageLinks,
            averageRating: book.averageRating,
            ratingsCount: book.ratingsCount,
            language: book.language,
            publisher: book.publisher,
            isbn: book.isbn,
            updatedAt: new Date(),
          },
        });
    } catch (error) {
      console.error('Error caching book:', error);
    }
  }

  /**
   * Cache multiple books at once
   */
  async cacheBooks(books: BookResult[]): Promise<void> {
    try {
      for (const book of books) {
        await this.cacheBook(book);
      }
      console.log(`Cached ${books.length} books to database`);
    } catch (error) {
      console.error('Error caching books:', error);
    }
  }

  /**
   * Get a cached book by external ID
   */
  async getCachedBook(externalId: string): Promise<BookResult | null> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.CACHE_DURATION_DAYS);

      const result = await db.query.cachedBooks.findFirst({
        where: and(
          eq(cachedBooks.externalId, externalId),
          gt(cachedBooks.updatedAt, cutoffDate)
        ),
      });

      if (!result) return null;

      return this.convertToBookResult(result);
    } catch (error) {
      console.error('Error getting cached book:', error);
      return null;
    }
  }

  /**
   * Get all cached books from a specific source
   */
  async getCachedBooksBySource(source: 'google_books' | 'goodreads'): Promise<BookResult[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.CACHE_DURATION_DAYS);

      const results = await db.query.cachedBooks.findMany({
        where: and(
          eq(cachedBooks.source, source),
          gt(cachedBooks.updatedAt, cutoffDate)
        ),
        limit: 100,
      });

      return results.map(result => this.convertToBookResult(result));
    } catch (error) {
      console.error('Error getting cached books by source:', error);
      return [];
    }
  }

  /**
   * Search cached books by title or author
   */
  async searchCachedBooks(query: string): Promise<BookResult[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.CACHE_DURATION_DAYS);

      const results = await db.query.cachedBooks.findMany({
        where: and(
          or(
            ilike(cachedBooks.title, `%${query}%`),
            sql`${cachedBooks.authors}::text ILIKE ${'%' + query + '%'}`
          ),
          gt(cachedBooks.updatedAt, cutoffDate)
        ),
        limit: 40,
      });

      return results.map(result => this.convertToBookResult(result));
    } catch (error) {
      console.error('Error searching cached books:', error);
      return [];
    }
  }

  /**
   * Get all cached books
   */
  async getAllCachedBooks(): Promise<BookResult[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.CACHE_DURATION_DAYS);

      const results = await db.query.cachedBooks.findMany({
        where: gt(cachedBooks.updatedAt, cutoffDate),
      });

      return results.map(result => this.convertToBookResult(result));
    } catch (error) {
      console.error('Error getting all cached books:', error);
      return [];
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.CACHE_DURATION_DAYS);

      const allBooks = await db.query.cachedBooks.findMany({
        where: gt(cachedBooks.updatedAt, cutoffDate),
      });

      const goodreadsBooks = allBooks.filter(b => b.source === 'goodreads').length;
      
      return {
        totalBooks: allBooks.length,
        goodreadsBooks,
        googleBooksBooks: allBooks.length - goodreadsBooks,
        lastUpdated: allBooks[0]?.updatedAt?.toISOString() || null,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalBooks: 0,
        goodreadsBooks: 0,
        googleBooksBooks: 0,
        lastUpdated: null,
      };
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanExpiredCache(): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.CACHE_DURATION_DAYS);

      const result = await db.delete(cachedBooks)
        .where(sql`${cachedBooks.updatedAt} < ${cutoffDate}`);

      console.log(`Cleaned up expired cache entries`);
      return 0; // Drizzle doesn't return row count easily
    } catch (error) {
      console.error('Error cleaning expired cache:', error);
      return 0;
    }
  }

  /**
   * Convert database cached book to BookResult
   */
  private convertToBookResult(cached: any): BookResult {
    return {
      id: cached.externalId.replace(`${cached.source}_`, ''),
      title: cached.title,
      authors: cached.authors as string[],
      description: cached.description || undefined,
      publishedDate: cached.publishedDate || undefined,
      pageCount: cached.pageCount || undefined,
      categories: cached.categories as string[] || undefined,
      imageLinks: cached.imageLinks as BookResult['imageLinks'] || undefined,
      averageRating: cached.averageRating || undefined,
      ratingsCount: cached.ratingsCount || undefined,
      language: cached.language || undefined,
      publisher: cached.publisher || undefined,
      isbn: cached.isbn || undefined,
      source: cached.source as 'google_books' | 'goodreads',
    };
  }
}

export const bookCacheService = new BookCacheService();
