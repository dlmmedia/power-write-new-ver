import { get } from '@vercel/edge-config';
import { BookResult } from './google-books';

interface CachedBooksData {
  books: BookResult[];
  lastUpdated: string;
}

export class BookCacheService {
  private readonly CACHE_KEY = 'cached_books';

  /**
   * Get all cached books from Edge Config
   */
  async getAllCachedBooks(): Promise<BookResult[]> {
    try {
      const data = await get<CachedBooksData>(this.CACHE_KEY);
      return data?.books || [];
    } catch (error) {
      console.error('Error getting cached books from Edge Config:', error);
      return [];
    }
  }

  /**
   * Get a cached book by external ID
   */
  async getCachedBook(externalId: string): Promise<BookResult | null> {
    try {
      const allBooks = await this.getAllCachedBooks();
      return allBooks.find(book => book.id === externalId) || null;
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
      const allBooks = await this.getAllCachedBooks();
      return allBooks.filter(book => book.source === source);
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
      const allBooks = await this.getAllCachedBooks();
      const lowerQuery = query.toLowerCase();

      return allBooks.filter(book => {
        const titleMatch = book.title.toLowerCase().includes(lowerQuery);
        const authorMatch = book.authors.some(author => author.toLowerCase().includes(lowerQuery));
        return titleMatch || authorMatch;
      });
    } catch (error) {
      console.error('Error searching cached books:', error);
      return [];
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const data = await get<CachedBooksData>(this.CACHE_KEY);
      if (!data) {
        return {
          totalBooks: 0,
          goodreadsBooks: 0,
          googleBooksBooks: 0,
          lastUpdated: null,
        };
      }

      const goodreadsBooks = data.books.filter(b => b.source === 'goodreads').length;
      return {
        totalBooks: data.books.length,
        goodreadsBooks,
        googleBooksBooks: data.books.length - goodreadsBooks,
        lastUpdated: data.lastUpdated,
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

}

export const bookCacheService = new BookCacheService();
