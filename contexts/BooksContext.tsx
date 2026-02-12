'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';

// Book types matching the API response
export interface BookListItem {
  id: number;
  title: string;
  author: string;
  genre: string;
  status: string;
  productionStatus?: string;
  coverUrl?: string;
  createdAt: string;
  outline?: any;
  config?: any;
  isOwner?: boolean;
  isPublic?: boolean;
  metadata: {
    wordCount: number;
    chapters: number;
    modelUsed?: string;
  };
  audioStats?: {
    chaptersWithAudio: number;
    totalChapters: number;
    totalDuration: number;
  } | null;
}

export interface BookDetail extends BookListItem {
  subgenre?: string;
  backCoverUrl?: string;
  chapters?: Array<{
    id: number;
    number: number;
    title: string;
    content: string;
    wordCount: number;
    status: 'draft' | 'completed';
    audioUrl?: string | null;
    audioDuration?: number | null;
    audioMetadata?: any;
  }>;
  bibliography?: any;
}

interface BooksContextState {
  // Books list
  books: BookListItem[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  
  // Book detail cache
  bookDetailsCache: Map<number, { book: BookDetail; fetchedAt: number }>;
  
  // User tier from books API
  userTier: 'free' | 'pro' | null;
}

interface BooksContextActions {
  // Fetch operations
  fetchBooks: (force?: boolean) => Promise<void>;
  fetchBookDetail: (bookId: number, force?: boolean) => Promise<BookDetail | null>;
  prefetchBookDetail: (bookId: number) => void;
  
  // Cache operations
  getBookFromCache: (bookId: number) => BookListItem | null;
  getBookDetailFromCache: (bookId: number) => BookDetail | null;
  updateBookInCache: (bookId: number, updates: Partial<BookListItem>) => void;
  updateBookDetailInCache: (bookId: number, updates: Partial<BookDetail>) => void;
  invalidateBookDetail: (bookId: number) => void;
  addBookToList: (book: BookListItem) => void;
  
  // State helpers
  refreshBooks: () => Promise<void>;
  clearError: () => void;
}

type BooksContextType = BooksContextState & BooksContextActions;

const BooksContext = createContext<BooksContextType | undefined>(undefined);

// Cache duration - increased for better performance
// 10 minutes for list, 5 minutes for details (with background revalidation)
const BOOKS_CACHE_DURATION = 10 * 60 * 1000;
const BOOK_DETAIL_CACHE_DURATION = 5 * 60 * 1000;

interface BooksProviderProps {
  children: ReactNode;
}

export function BooksProvider({ children }: BooksProviderProps) {
  const { user, isLoaded: isUserLoaded } = useUser();
  
  // State
  const [books, setBooks] = useState<BookListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [userTier, setUserTier] = useState<'free' | 'pro' | null>(null);
  const [bookDetailsCache, setBookDetailsCache] = useState<Map<number, { book: BookDetail; fetchedAt: number }>>(new Map());
  
  // Refs to track fetch state and prevent duplicates
  const isFetchingRef = useRef(false);
  const fetchPromiseRef = useRef<Promise<void> | null>(null);
  const hasFetchedOnceRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const prefetchingBookIds = useRef<Set<number>>(new Set());
  const pendingBookFetches = useRef<Map<number, Promise<BookDetail | null>>>(new Map());
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Fetch books with SWR-like behavior
  const fetchBooks = useCallback(async (force = false) => {
    // If not authenticated, skip
    if (!isUserLoaded || !user) {
      return;
    }
    
    // Check if we should use cached data
    const now = Date.now();
    const cacheValid = lastFetched && (now - lastFetched) < BOOKS_CACHE_DURATION;
    
    if (!force && cacheValid && books.length > 0) {
      // Return cached data, but revalidate in background (SWR pattern)
      if (!isFetchingRef.current) {
        // Background revalidate
        setTimeout(() => {
          if (!isFetchingRef.current) {
            fetchBooks(true).catch(console.error);
          }
        }, 100);
      }
      return;
    }
    
    // Prevent duplicate concurrent fetches
    if (isFetchingRef.current && fetchPromiseRef.current) {
      return fetchPromiseRef.current;
    }
    
    isFetchingRef.current = true;
    
    // Only show loading if we don't have data yet
    if (books.length === 0) {
      setIsLoading(true);
    }
    
    const fetchPromise = (async () => {
      const maxRetries = 3;
      const baseDelay = 500;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const timestamp = Date.now();
          const response = await fetch(`/api/books?_t=${timestamp}`, {
            cache: 'no-store',
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache',
            },
          });
          
          if (!response.ok) {
            if (response.status === 401) {
              // Auth error - might need to wait for auth to be ready
              if (attempt < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
                continue;
              }
            }
            throw new Error(`Failed to fetch books: ${response.status}`);
          }
          
          const data = await response.json();
          
          setBooks(data.books || []);
          setLastFetched(Date.now());
          setError(null);
          hasFetchedOnceRef.current = true;
          
          if (data.tier) {
            setUserTier(data.tier);
          }
          
          return;
        } catch (err) {
          if (attempt === maxRetries - 1) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch books';
            setError(errorMessage);
            console.error('[BooksContext] Error fetching books:', err);
          } else {
            await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
          }
        }
      }
    })();
    
    fetchPromiseRef.current = fetchPromise;
    
    try {
      await fetchPromise;
    } finally {
      isFetchingRef.current = false;
      fetchPromiseRef.current = null;
      setIsLoading(false);
    }
  }, [isUserLoaded, user, lastFetched, books.length]);
  
  // Fetch book detail with caching and deduplication
  const fetchBookDetail = useCallback(async (bookId: number, force = false): Promise<BookDetail | null> => {
    // Guard against invalid ids (prevents /api/books/NaN → 400)
    if (!Number.isFinite(bookId) || bookId <= 0) {
      return null;
    }
    // Check cache first
    const cached = bookDetailsCache.get(bookId);
    const now = Date.now();
    
    if (!force && cached && (now - cached.fetchedAt) < BOOK_DETAIL_CACHE_DURATION) {
      // Return cached data immediately (stale-while-revalidate pattern)
      // Revalidate in background only if not already fetching
      if (!pendingBookFetches.current.has(bookId)) {
        setTimeout(() => {
          if (!pendingBookFetches.current.has(bookId)) {
            fetchBookDetail(bookId, true).catch(console.error);
          }
        }, 100);
      }
      return cached.book;
    }
    
    // Check if we're already fetching this book (deduplication)
    const pendingFetch = pendingBookFetches.current.get(bookId);
    if (pendingFetch) {
      return pendingFetch;
    }
    
    // Create the fetch promise
    const fetchPromise = (async (): Promise<BookDetail | null> => {
      try {
        const timestamp = Date.now();
        const response = await fetch(`/api/books/${bookId}?_t=${timestamp}`, {
          cache: 'no-store',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch book: ${response.status}`);
        }
        
        const data = await response.json();
        const book = data.book as BookDetail;
        
        // Update cache
        setBookDetailsCache(prev => {
          const newCache = new Map(prev);
          newCache.set(bookId, { book, fetchedAt: Date.now() });
          return newCache;
        });
        
        return book;
      } catch (err) {
        console.error('[BooksContext] Error fetching book detail:', err);
        // Return cached version if available, even if stale
        if (cached) {
          return cached.book;
        }
        return null;
      } finally {
        // Clean up pending fetch
        pendingBookFetches.current.delete(bookId);
      }
    })();
    
    // Store the pending fetch for deduplication
    pendingBookFetches.current.set(bookId, fetchPromise);
    
    return fetchPromise;
  }, [bookDetailsCache]);
  
  // Prefetch book detail without triggering background revalidation
  // Used for hover prefetching - lightweight and non-blocking
  const prefetchBookDetail = useCallback((bookId: number) => {
    // Skip if already cached and not stale
    const cached = bookDetailsCache.get(bookId);
    const now = Date.now();
    if (cached && (now - cached.fetchedAt) < BOOK_DETAIL_CACHE_DURATION) {
      return; // Already cached, no need to prefetch
    }
    
    // Skip if already prefetching this book
    if (prefetchingBookIds.current.has(bookId) || pendingBookFetches.current.has(bookId)) {
      return;
    }
    
    // Mark as prefetching
    prefetchingBookIds.current.add(bookId);
    
    // Prefetch in background - fire and forget
    fetchBookDetail(bookId, false)
      .catch(() => {
        // Silently ignore prefetch errors
      })
      .finally(() => {
        prefetchingBookIds.current.delete(bookId);
      });
  }, [bookDetailsCache, fetchBookDetail]);
  
  // Get book from list cache
  const getBookFromCache = useCallback((bookId: number): BookListItem | null => {
    return books.find(b => b.id === bookId) || null;
  }, [books]);
  
  // Get book detail from cache
  const getBookDetailFromCache = useCallback((bookId: number): BookDetail | null => {
    const cached = bookDetailsCache.get(bookId);
    return cached?.book || null;
  }, [bookDetailsCache]);
  
  // Update book in list cache
  const updateBookInCache = useCallback((bookId: number, updates: Partial<BookListItem>) => {
    setBooks(prev => prev.map(book => 
      book.id === bookId ? { ...book, ...updates } : book
    ));
  }, []);
  
  // Update book detail in cache
  const updateBookDetailInCache = useCallback((bookId: number, updates: Partial<BookDetail>) => {
    setBookDetailsCache(prev => {
      const cached = prev.get(bookId);
      if (!cached) return prev;
      
      const newCache = new Map(prev);
      newCache.set(bookId, {
        book: { ...cached.book, ...updates },
        fetchedAt: cached.fetchedAt,
      });
      return newCache;
    });
    
    // Also update in books list if applicable
    updateBookInCache(bookId, updates);
  }, [updateBookInCache]);
  
  // Invalidate book detail cache
  const invalidateBookDetail = useCallback((bookId: number) => {
    setBookDetailsCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(bookId);
      return newCache;
    });
  }, []);
  
  // Add a newly generated book to the list cache immediately
  // so it appears in the library without waiting for a full refetch
  const addBookToList = useCallback((book: BookListItem) => {
    setBooks(prev => {
      // Avoid duplicates
      if (prev.some(b => b.id === book.id)) {
        return prev.map(b => b.id === book.id ? { ...b, ...book } : b);
      }
      return [book, ...prev];
    });
  }, []);
  
  // Refresh books (force fetch)
  const refreshBooks = useCallback(async () => {
    await fetchBooks(true);
  }, [fetchBooks]);
  
  // Auto-fetch on mount and user change
  useEffect(() => {
    if (!isUserLoaded) return;
    
    const currentUserId = user?.id || null;
    
    // If user changed, clear cache and refetch
    if (lastUserIdRef.current !== currentUserId) {
      lastUserIdRef.current = currentUserId;
      
      if (currentUserId) {
        // User logged in - fetch books
        fetchBooks(true);
      } else {
        // User logged out - clear data
        setBooks([]);
        setBookDetailsCache(new Map());
        setLastFetched(null);
        setUserTier(null);
        hasFetchedOnceRef.current = false;
      }
      return;
    }
    
    // If user is logged in and we haven't fetched yet, fetch
    if (user && !hasFetchedOnceRef.current && !isFetchingRef.current) {
      fetchBooks();
    }
  }, [isUserLoaded, user, fetchBooks]);
  
  const value: BooksContextType = {
    // State
    books,
    isLoading,
    error,
    lastFetched,
    bookDetailsCache,
    userTier,
    
    // Actions
    fetchBooks,
    fetchBookDetail,
    prefetchBookDetail,
    getBookFromCache,
    getBookDetailFromCache,
    updateBookInCache,
    updateBookDetailInCache,
    invalidateBookDetail,
    addBookToList,
    refreshBooks,
    clearError,
  };
  
  return (
    <BooksContext.Provider value={value}>
      {children}
    </BooksContext.Provider>
  );
}

export function useBooks() {
  const context = useContext(BooksContext);
  if (context === undefined) {
    throw new Error('useBooks must be used within a BooksProvider');
  }
  return context;
}

// Hook for getting a single book with auto-fetch
export function useBook(bookId: number | null) {
  const { getBookFromCache, getBookDetailFromCache, fetchBookDetail } = useBooks();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!bookId) {
      setBook(null);
      return;
    }
    
    // Try to get from cache first for instant display
    const cachedDetail = getBookDetailFromCache(bookId);
    if (cachedDetail) {
      setBook(cachedDetail);
    }
    
    // Fetch fresh data
    setIsLoading(true);
    fetchBookDetail(bookId)
      .then(fetchedBook => {
        if (fetchedBook) {
          setBook(fetchedBook);
          setError(null);
        } else if (!cachedDetail) {
          setError('Book not found');
        }
      })
      .catch(err => {
        if (!cachedDetail) {
          setError(err instanceof Error ? err.message : 'Failed to fetch book');
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [bookId, getBookDetailFromCache, fetchBookDetail]);
  
  return { book, isLoading, error };
}
