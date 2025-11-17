// Offline Book Cache Service using IndexedDB

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface BookCache {
  id: number;
  title: string;
  author: string;
  genre: string;
  coverUrl?: string;
  content: any; // Full book data
  cachedAt: number;
  lastAccessed: number;
}

interface OfflineCacheDB extends DBSchema {
  books: {
    key: number;
    value: BookCache;
    indexes: { 'by-accessed': number };
  };
  assets: {
    key: string;
    value: {
      url: string;
      data: Blob;
      cachedAt: number;
    };
  };
}

const DB_NAME = 'powerwrite-offline';
const DB_VERSION = 1;
const MAX_CACHED_BOOKS = 10;

class OfflineCacheService {
  private db: IDBPDatabase<OfflineCacheDB> | null = null;

  async init() {
    if (typeof window === 'undefined') return;

    try {
      this.db = await openDB<OfflineCacheDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Create books store
          if (!db.objectStoreNames.contains('books')) {
            const bookStore = db.createObjectStore('books', { keyPath: 'id' });
            bookStore.createIndex('by-accessed', 'lastAccessed');
          }

          // Create assets store
          if (!db.objectStoreNames.contains('assets')) {
            db.createObjectStore('assets', { keyPath: 'url' });
          }
        },
      });

      console.log('Offline cache initialized');
    } catch (error) {
      console.error('Failed to initialize offline cache:', error);
    }
  }

  async cacheBook(bookData: any) {
    if (!this.db) await this.init();
    if (!this.db) return;

    try {
      const bookCache: BookCache = {
        id: bookData.id,
        title: bookData.title,
        author: bookData.author,
        genre: bookData.genre,
        coverUrl: bookData.coverUrl,
        content: bookData,
        cachedAt: Date.now(),
        lastAccessed: Date.now(),
      };

      // Remove old cached version if it exists to prevent stale data
      const existing = await this.db.get('books', bookData.id);
      if (existing) {
        await this.db.delete('books', bookData.id);
        console.log(`Removed old cached version of book ${bookData.id}`);
      }

      await this.db.put('books', bookCache);
      console.log(`Book ${bookData.id} cached for offline access`);

      // Manage cache size
      await this.cleanupOldBooks();

      // Cache cover image if available
      if (bookData.coverUrl) {
        await this.cacheAsset(bookData.coverUrl);
      }
    } catch (error) {
      console.error('Failed to cache book:', error);
    }
  }

  async getCachedBook(bookId: number): Promise<any | null> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    try {
      const cached = await this.db.get('books', bookId);
      
      if (cached) {
        // Update last accessed time
        cached.lastAccessed = Date.now();
        await this.db.put('books', cached);
        
        console.log(`Retrieved cached book ${bookId}`);
        return cached.content;
      }

      return null;
    } catch (error) {
      console.error('Failed to get cached book:', error);
      return null;
    }
  }

  async getCachedBooks(): Promise<BookCache[]> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    try {
      const books = await this.db.getAll('books');
      return books.sort((a, b) => b.lastAccessed - a.lastAccessed);
    } catch (error) {
      console.error('Failed to get cached books:', error);
      return [];
    }
  }

  async isBookCached(bookId: number): Promise<boolean> {
    if (!this.db) await this.init();
    if (!this.db) return false;

    try {
      const cached = await this.db.get('books', bookId);
      return !!cached;
    } catch (error) {
      return false;
    }
  }

  async removeCachedBook(bookId: number) {
    if (!this.db) await this.init();
    if (!this.db) return;

    try {
      await this.db.delete('books', bookId);
      console.log(`Removed cached book ${bookId}`);
    } catch (error) {
      console.error('Failed to remove cached book:', error);
    }
  }

  async cleanupOldBooks() {
    if (!this.db) return;

    try {
      const books = await this.db.getAll('books');
      
      if (books.length > MAX_CACHED_BOOKS) {
        // Sort by last accessed (oldest first)
        books.sort((a, b) => a.lastAccessed - b.lastAccessed);
        
        // Remove oldest books
        const toRemove = books.slice(0, books.length - MAX_CACHED_BOOKS);
        
        for (const book of toRemove) {
          await this.db.delete('books', book.id);
          console.log(`Removed old cached book ${book.id}`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old books:', error);
    }
  }

  async cacheAsset(url: string) {
    if (!this.db) await this.init();
    if (!this.db) return;

    try {
      // Check if already cached
      const existing = await this.db.get('assets', url);
      if (existing) return;

      // Fetch and cache the asset
      const response = await fetch(url);
      const blob = await response.blob();

      await this.db.put('assets', {
        url,
        data: blob,
        cachedAt: Date.now(),
      });

      console.log(`Asset cached: ${url}`);
    } catch (error) {
      console.error('Failed to cache asset:', error);
    }
  }

  async getCachedAsset(url: string): Promise<Blob | null> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    try {
      const cached = await this.db.get('assets', url);
      return cached ? cached.data : null;
    } catch (error) {
      console.error('Failed to get cached asset:', error);
      return null;
    }
  }

  async clearAllCache() {
    if (!this.db) await this.init();
    if (!this.db) return;

    try {
      await this.db.clear('books');
      await this.db.clear('assets');
      console.log('All offline cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  async getCacheSize(): Promise<number> {
    if (!this.db) await this.init();
    if (!this.db) return 0;

    try {
      let totalSize = 0;

      // Calculate books size (approximate)
      const books = await this.db.getAll('books');
      books.forEach(book => {
        totalSize += JSON.stringify(book.content).length;
      });

      // Calculate assets size
      const assets = await this.db.getAll('assets');
      for (const asset of assets) {
        totalSize += asset.data.size;
      }

      return totalSize;
    } catch (error) {
      console.error('Failed to calculate cache size:', error);
      return 0;
    }
  }

  async getCacheStats() {
    if (!this.db) await this.init();
    if (!this.db) return { bookCount: 0, assetCount: 0, totalSize: 0 };

    try {
      const books = await this.db.getAll('books');
      const assets = await this.db.getAll('assets');
      const totalSize = await this.getCacheSize();

      return {
        bookCount: books.length,
        assetCount: assets.length,
        totalSize,
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { bookCount: 0, assetCount: 0, totalSize: 0 };
    }
  }
}

// Export singleton instance
export const offlineCache = new OfflineCacheService();

// Initialize on load
if (typeof window !== 'undefined') {
  offlineCache.init();
}



