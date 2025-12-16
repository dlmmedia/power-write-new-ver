'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, UserButton, SignedIn } from '@clerk/nextjs';
import { useUserTier } from '@/contexts/UserTierContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ThemeToggleCompact } from '@/components/ui/ThemeToggle';
import { Logo } from '@/components/ui/Logo';
import { 
  Library, 
  CheckCircle2, 
  Type, 
  Layers,
  Plus,
  ArrowLeft,
  Play,
  Loader2,
  BookOpen,
  FileText,
  Palette,
  Crown,
  Sparkles,
  Lock,
  Headphones
} from 'lucide-react';

interface BookListItem {
  id: number;
  title: string;
  author: string;
  genre: string;
  status: string;
  coverUrl?: string;
  createdAt: string;
  outline?: any;
  config?: any;
  isOwner?: boolean;
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

type UserTier = 'free' | 'pro';

export default function LibraryPage() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { userTier, isProUser, showUpgradeModal: triggerUpgradeModal, setUserTier, syncUser: contextSyncUser } = useUserTier();
  const [books, setBooks] = useState<BookListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGenre, setFilterGenre] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'words'>('date');
  const [generatingCovers, setGeneratingCovers] = useState<Set<number>>(new Set());
  const [continuingBooks, setContinuingBooks] = useState<Set<number>>(new Set());
  const [generationProgress, setGenerationProgress] = useState<{[key: number]: { progress: number; message: string }}>({});

  // Sync user on mount and fetch books
  useEffect(() => {
    if (isUserLoaded) {
      if (user) {
        // User is authenticated - sync and fetch books
        contextSyncUser().then(() => {
          fetchBooks();
        }).catch(() => {
          // Even if sync fails, try to fetch books (user might already exist)
          fetchBooks();
        });
      } else {
        // User is not authenticated - just fetch books (they might be public)
        fetchBooks();
      }
    }
  }, [isUserLoaded, user, contextSyncUser]);

  // Note: User sync is now handled by UserTierContext

  const fetchBooks = async (retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = 500; // Start with 500ms delay

    setLoading(true);
    try {
      // Add cache busting to ensure fresh data
      const timestamp = Date.now();
      const response = await fetch(`/api/books?_t=${timestamp}`, {
        cache: 'no-store',
        credentials: 'include', // Ensure cookies are sent
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        // If 500 or 401 and we haven't exhausted retries, retry with exponential backoff
        if ((response.status === 500 || response.status === 401) && retryCount < maxRetries) {
          const delay = retryDelay * Math.pow(2, retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchBooks(retryCount + 1);
        }
        
        // Only log error if we've exhausted retries or it's not a retryable error
        if (retryCount >= maxRetries || (response.status !== 500 && response.status !== 401)) {
          console.error('Fetch books failed:', response.status);
        }
        return;
      }
      
      const data = await response.json();
      setBooks(data.books || []);
      if (data.tier) {
        setUserTier(data.tier);
      }
    } catch (error) {
      // Retry on network errors too
      if (retryCount < maxRetries) {
        const delay = retryDelay * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchBooks(retryCount + 1);
      }
      // Only log if we've exhausted retries
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  // Upgrade success is handled by the GlobalUpgradeModal and UserTierContext

  const handleGenerateCover = async (bookId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Prevent navigation to book detail
    
    // Check if Pro user
    if (!isProUser) {
      triggerUpgradeModal('generate-cover');
      return;
    }
    
    setGeneratingCovers(prev => new Set(prev).add(bookId));
    
    try {
      const response = await fetch(`/api/books/${bookId}/cover`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success && data.coverUrl) {
        // Update book in local state
        setBooks(prev => prev.map(book => 
          book.id === bookId ? { ...book, coverUrl: data.coverUrl } : book
        ));
        return true;
      } else {
        console.error('Failed to generate cover:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Error generating cover:', error);
      return false;
    } finally {
      setGeneratingCovers(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookId);
        return newSet;
      });
    }
  };

  // Continue generating a book that was interrupted
  const handleContinueGeneration = useCallback(async (book: BookListItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Check if Pro user
    if (!isProUser) {
      triggerUpgradeModal('continue-generation');
      return;
    }
    
    if (!book.outline || !book.config) {
      alert('Unable to continue: Book outline or config is missing');
      return;
    }

    setContinuingBooks(prev => new Set(prev).add(book.id));
    setGenerationProgress(prev => ({
      ...prev,
      [book.id]: { progress: 0, message: 'Resuming generation...' }
    }));

    const chapterModel = book.metadata?.modelUsed || 'anthropic/claude-sonnet-4';
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;

    try {
      while (true) {
        const response = await fetch('/api/generate/book-incremental', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            outline: book.outline,
            config: book.config,
            modelId: chapterModel,
            bookId: book.id,
          }),
        });

        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          throw new Error('Server error');
        }

        if (!data.success) {
          consecutiveErrors++;
          if (consecutiveErrors >= maxConsecutiveErrors) {
            throw new Error(data.details || data.error || 'Generation failed');
          }
          setGenerationProgress(prev => ({
            ...prev,
            [book.id]: { progress: prev[book.id]?.progress || 0, message: `Retrying... (${consecutiveErrors}/${maxConsecutiveErrors})` }
          }));
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }

        consecutiveErrors = 0;
        setGenerationProgress(prev => ({
          ...prev,
          [book.id]: { progress: data.progress, message: data.message }
        }));

        if (data.phase === 'completed') {
          // Refresh the books list
          await fetchBooks();
          setGenerationProgress(prev => {
            const newState = { ...prev };
            delete newState[book.id];
            return newState;
          });
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error continuing generation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setGenerationProgress(prev => ({
        ...prev,
        [book.id]: { progress: prev[book.id]?.progress || 0, message: `Error: ${errorMessage}` }
      }));
    } finally {
      setContinuingBooks(prev => {
        const newSet = new Set(prev);
        newSet.delete(book.id);
        return newSet;
      });
    }
  }, []);

  const filteredAndSortedBooks = books
    .filter((book) => {
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           book.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = filterGenre === 'all' || book.genre === filterGenre;
      return matchesSearch && matchesGenre;
    })
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'words') return (b.metadata?.wordCount || 0) - (a.metadata?.wordCount || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const genres = ['all', ...Array.from(new Set(books.map((b) => b.genre)))];

  // Helper function to format duration in seconds to a readable format
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  const libraryTitle = 'Library';

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors">
      {/* Header */}
      <header className="border-b border-yellow-600/20 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-30" style={{ fontFamily: 'var(--font-header)', letterSpacing: 'var(--letter-spacing-header)', boxShadow: 'var(--shadow-header)' }}>
        <div className="container mx-auto px-4 py-4">
            {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="group relative px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/40 dark:to-amber-950/40 border border-yellow-200 dark:border-yellow-800/50 text-yellow-700 dark:text-yellow-300 hover:from-yellow-100 hover:to-amber-100 dark:hover:from-yellow-900/50 dark:hover:to-amber-900/50 hover:border-yellow-300 dark:hover:border-yellow-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
                <span className="font-medium">Home</span>
              </button>
              <Logo size="md" />
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-header)' }}>{libraryTitle}</h1>
              {/* Tier Badge */}
              {isProUser ? (
                <Badge variant="success" size="sm" className="flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Pro
                </Badge>
              ) : (
                <button
                  onClick={() => triggerUpgradeModal()}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  <Sparkles className="w-3 h-3" />
                  Upgrade to Pro
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggleCompact />
              {isProUser ? (
                <Button variant="primary" onClick={() => router.push('/studio')} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Book
                </Button>
              ) : (
                <button
                  onClick={() => triggerUpgradeModal('generate-book')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium text-sm hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  <Lock className="w-4 h-4" />
                  New Book
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">PRO</span>
                </button>
              )}
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/')}
                  className="group p-2 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/40 dark:to-amber-950/40 border border-yellow-200 dark:border-yellow-800/50 text-yellow-700 dark:text-yellow-300 hover:from-yellow-100 hover:to-amber-100 dark:hover:from-yellow-900/50 dark:hover:to-amber-900/50 hover:border-yellow-300 dark:hover:border-yellow-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
                </button>
                <Logo size="sm" />
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggleCompact />
                {isProUser ? (
                  <Button variant="primary" size="sm" onClick={() => router.push('/studio')} className="flex items-center gap-1">
                    <Plus className="w-4 h-4" />
                    New
                  </Button>
                ) : (
                  <button
                    onClick={() => triggerUpgradeModal('generate-book')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium text-sm hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    <Lock className="w-3 h-3" />
                    New
                  </button>
                )}
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <h1 className="text-lg font-bold">{libraryTitle}</h1>
              {isProUser ? (
                <Badge variant="success" size="sm" className="flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Pro
                </Badge>
              ) : (
                <button
                  onClick={() => triggerUpgradeModal()}
                  className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                >
                  <Sparkles className="w-3 h-3" />
                  Upgrade
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
              className="flex-1 md:flex-none bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre === 'all' ? 'All Genres' : genre}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 md:flex-none bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="date">Date</option>
              <option value="title">Title</option>
              <option value="words">Words</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          <div className="group bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all hover:border-yellow-400 dark:hover:border-yellow-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-lg text-yellow-600 dark:text-yellow-400 group-hover:scale-110 transition-transform">
                <Library className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Books</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{books.length}</div>
          </div>

          <div className="group bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all hover:border-green-400 dark:hover:border-green-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Completed</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {books.filter((b) => b.status === 'completed').length}
            </div>
          </div>

          <div className="group bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all hover:border-blue-400 dark:hover:border-blue-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Type className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Words</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {books.reduce((sum, b) => sum + (b.metadata?.wordCount || 0), 0).toLocaleString()}
            </div>
          </div>

          <div className="group bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all hover:border-purple-400 dark:hover:border-purple-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Chapters</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {books.reduce((sum, b) => sum + (b.metadata?.chapters || 0), 0)}
            </div>
          </div>

          {/* Audio Stats */}
          {(() => {
            const totalChaptersWithAudio = books.reduce((sum, b) => sum + (b.audioStats?.chaptersWithAudio || 0), 0);
            const totalAudioDuration = books.reduce((sum, b) => sum + (b.audioStats?.totalDuration || 0), 0);
            if (totalChaptersWithAudio === 0) return null;
            return (
              <div className="group bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all hover:border-green-400 dark:hover:border-green-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Audio</div>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {totalChaptersWithAudio}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDuration(totalAudioDuration)} total
                </div>
              </div>
            );
          })()}
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-900 rounded-lg p-4 md:p-6 border border-gray-300 dark:border-gray-800">
                <div className="bg-gray-300 dark:bg-gray-800 h-6 w-3/4 rounded mb-2" />
                <div className="bg-gray-300 dark:bg-gray-800 h-4 w-1/2 rounded mb-4" />
                <div className="bg-gray-300 dark:bg-gray-800 h-4 w-full rounded" />
              </div>
            ))}
          </div>
        ) : filteredAndSortedBooks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg mb-4">
              {searchQuery || filterGenre !== 'all' ? 'No books match your filters' : 'No books yet'}
            </p>
            {isProUser ? (
              <Button variant="primary" size="md" onClick={() => router.push('/studio')}>
                Create Your First Book
              </Button>
            ) : (
              <button
                onClick={() => triggerUpgradeModal('generate-book')}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2 mx-auto"
              >
                <Lock className="w-4 h-4" />
                Create Your First Book
                <span className="text-xs bg-white/20 px-2 py-1 rounded">PRO</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredAndSortedBooks.map((book) => (
              <div
                key={book.id}
                className="bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-800 hover:border-yellow-400 transition-all hover:shadow-xl cursor-pointer group"
                onClick={() => router.push(`/library/${book.id}`)}
              >
                {/* Cover Image */}
                <div className="relative w-full aspect-[2/3] bg-gray-800 overflow-hidden">
                  {book.coverUrl && book.coverUrl.trim() !== '' ? (
                    <img
                      src={book.coverUrl}
                      alt={`${book.title} cover`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 relative">
                      <div className="text-center px-4">
                        <h3 className="font-bold text-lg text-white mb-2 line-clamp-3">{book.title}</h3>
                        <p className="text-sm text-gray-400 mb-4">by {book.author}</p>
                        
                        {/* Continue Generation Button for books in progress */}
                        {book.status === 'generating' ? (
                          <div className="space-y-2">
                            {generationProgress[book.id] && (
                              <div className="mb-2">
                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-yellow-400 transition-all duration-300"
                                    style={{ width: `${generationProgress[book.id].progress}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                  {generationProgress[book.id].message}
                                </p>
                              </div>
                            )}
                            {isProUser ? (
                              <button
                                onClick={(e) => handleContinueGeneration(book, e)}
                                disabled={continuingBooks.has(book.id)}
                                className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-medium hover:bg-yellow-500 disabled:bg-yellow-600 disabled:cursor-not-allowed transition-colors"
                              >
                                {continuingBooks.has(book.id) ? (
                                  <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                    </svg>
                                    Generating...
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-2">
                                    <Play className="w-4 h-4" />
                                    Continue Generation
                                  </span>
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); triggerUpgradeModal('continue-generation'); }}
                                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-colors"
                              >
                                <span className="flex items-center gap-2">
                                  <Lock className="w-4 h-4" />
                                  Continue Generation
                                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">PRO</span>
                                </span>
                              </button>
                            )}
                          </div>
                        ) : (
                          /* Generate Cover Button */
                          isProUser ? (
                            <button
                              onClick={(e) => handleGenerateCover(book.id, e)}
                              disabled={generatingCovers.has(book.id)}
                              className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-medium hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                            >
                              {generatingCovers.has(book.id) ? (
                                <span className="flex items-center gap-2">
                                  <Loader2 className="animate-spin h-4 w-4" />
                                  Generating...
                                </span>
                              ) : (
                                <span className="flex items-center gap-2">
                                  <Palette className="w-4 h-4" />
                                  Generate Cover
                                </span>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); triggerUpgradeModal('generate-cover'); }}
                              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-colors"
                            >
                              <span className="flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                Generate Cover
                                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">PRO</span>
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                  {/* Status badge overlay */}
                  <div className="absolute top-2 right-2">
                    <Badge 
                      variant={book.status === 'completed' ? 'success' : book.status === 'generating' ? 'warning' : 'default'}
                      size="sm"
                    >
                      {book.status === 'generating' ? 'In Progress' : book.status}
                    </Badge>
                  </div>
                </div>

                {/* Book Info */}
                <div className="p-4">
                  <h3 className="font-bold text-base line-clamp-2 mb-1">{book.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">by {book.author}</p>
                  <p className="text-xs text-gray-500 mb-3">{book.genre}</p>

                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4 text-yellow-500" />
                      <span className="text-gray-400">{book.metadata?.chapters || 0} ch</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4 text-yellow-500" />
                      <span className="text-gray-400">
                        {(book.metadata?.wordCount || 0).toLocaleString()}
                      </span>
                    </div>
                    {/* Audio Indicator */}
                    {book.audioStats && book.audioStats.chaptersWithAudio > 0 && (
                      <div className="flex items-center gap-1" title={`${book.audioStats.chaptersWithAudio}/${book.audioStats.totalChapters} chapters have audio (${formatDuration(book.audioStats.totalDuration)})`}>
                        <Headphones className="w-4 h-4 text-green-500" />
                        <span className="text-green-500 font-medium">
                          {book.audioStats.chaptersWithAudio}/{book.audioStats.totalChapters}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-800 text-xs text-gray-500">
                    {new Date(book.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
