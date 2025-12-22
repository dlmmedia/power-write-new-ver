'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggleCompact } from '@/components/ui/ThemeToggle';
import { Logo } from '@/components/ui/Logo';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Library, 
  BookOpen, 
  FileText, 
  Headphones,
  Search,
  ArrowLeft,
  Star,
  Users,
  Globe
} from 'lucide-react';

interface ShowcaseBook {
  id: number;
  title: string;
  author: string;
  genre: string;
  status: string;
  coverUrl?: string;
  summary: string;
  createdAt: string;
  metadata: {
    wordCount: number;
    chapters: number;
    description: string;
  };
  audioStats?: {
    chaptersWithAudio: number;
    totalChapters: number;
    totalDuration: number;
  } | null;
}

export default function ShowcasePage() {
  const router = useRouter();
  const [books, setBooks] = useState<ShowcaseBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGenre, setFilterGenre] = useState('all');

  useEffect(() => {
    fetchShowcaseBooks();
  }, []);

  const fetchShowcaseBooks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/showcase', {
        cache: 'no-store',
      });
      
      if (response.ok) {
        const data = await response.json();
        setBooks(data.books || []);
      }
    } catch (error) {
      console.error('Error fetching showcase books:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books
    .filter((book) => {
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           book.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = filterGenre === 'all' || book.genre === filterGenre;
      return matchesSearch && matchesGenre;
    });

  const genres = ['all', ...Array.from(new Set(books.map((b) => b.genre)))];

  // Helper function to format duration
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors">
      {/* Header */}
      <header className="border-b border-yellow-600/20 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-30" style={{ fontFamily: 'var(--font-header)', letterSpacing: 'var(--letter-spacing-header)', boxShadow: 'var(--shadow-header)' }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="group relative px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/40 dark:to-amber-950/40 border border-yellow-200 dark:border-yellow-800/50 text-yellow-700 dark:text-yellow-300 hover:from-yellow-100 hover:to-amber-100 dark:hover:from-yellow-900/50 dark:hover:to-amber-900/50 hover:border-yellow-300 dark:hover:border-yellow-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
                <span className="font-medium">Home</span>
              </button>
              <Logo size="md" />
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-yellow-500" />
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-header)' }}>Public Showcase</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggleCompact />
              <Button variant="outline" onClick={() => router.push('/library')} className="flex items-center gap-2">
                <Library className="w-4 h-4" />
                My Library
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-yellow-400/10 via-amber-500/5 to-orange-400/10 dark:from-yellow-400/5 dark:via-amber-500/5 dark:to-orange-400/5 border-b border-yellow-600/20">
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
            <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400">
              Featured Books
            </h2>
            <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
            Discover amazing AI-generated books from our community. Read, listen, and get inspired by what's possible with PowerWrite.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Library className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">{books.length} Books</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Users className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">Public Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Search books by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={filterGenre}
            onChange={(e) => setFilterGenre(e.target.value)}
            className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre === 'all' ? 'All Genres' : genre}
              </option>
            ))}
          </select>
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-900 rounded-lg p-6 border border-gray-300 dark:border-gray-800">
                <div className="bg-gray-300 dark:bg-gray-800 aspect-[2/3] rounded mb-4" />
                <div className="bg-gray-300 dark:bg-gray-800 h-6 w-3/4 rounded mb-2" />
                <div className="bg-gray-300 dark:bg-gray-800 h-4 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Library className="w-10 h-10 text-gray-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
              {searchQuery || filterGenre !== 'all' ? 'No books match your search' : 'No books in showcase yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchQuery || filterGenre !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Be the first to showcase your book!'}
            </p>
            <Button variant="primary" onClick={() => router.push('/library')}>
              Go to Library
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-800 hover:border-yellow-400 transition-all hover:shadow-xl cursor-pointer group"
                onClick={() => router.push(`/showcase/${book.id}`)}
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
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-yellow-600/20 to-amber-700/30">
                      <div className="text-center px-4">
                        <h3 className="font-bold text-lg text-white mb-2 line-clamp-3">{book.title}</h3>
                        <p className="text-sm text-gray-300">by {book.author}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Audio badge */}
                  {book.audioStats && book.audioStats.chaptersWithAudio > 0 && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="success" size="sm" className="flex items-center gap-1">
                        <Headphones className="w-3 h-3" />
                        Audio
                      </Badge>
                    </div>
                  )}
                  
                  {/* Public badge */}
                  <div className="absolute top-2 right-2">
                    <Badge variant="default" size="sm" className="bg-yellow-400 text-black flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      Public
                    </Badge>
                  </div>
                </div>

                {/* Book Info */}
                <div className="p-4">
                  <h3 className="font-bold text-base line-clamp-2 mb-1 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">by {book.author}</p>
                  <p className="text-xs text-gray-500 mb-3">{book.genre}</p>

                  {/* Summary preview */}
                  {book.summary && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 italic">
                      "{book.summary}"
                    </p>
                  )}

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
                    {book.audioStats && book.audioStats.chaptersWithAudio > 0 && (
                      <div className="flex items-center gap-1">
                        <Headphones className="w-4 h-4 text-green-500" />
                        <span className="text-green-500 font-medium">
                          {formatDuration(book.audioStats.totalDuration)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>© 2025 PowerWrite. Showcase your AI-generated books with the world.</p>
        </div>
      </footer>
    </div>
  );
}
