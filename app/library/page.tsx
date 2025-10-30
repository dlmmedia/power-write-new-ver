'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { getDemoUserId } from '@/lib/services/demo-account';

interface BookListItem {
  id: number;
  title: string;
  author: string;
  genre: string;
  status: string;
  createdAt: string;
  metadata: {
    wordCount: number;
    chapters: number;
  };
}

export default function LibraryPage() {
  const router = useRouter();
  const [books, setBooks] = useState<BookListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGenre, setFilterGenre] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'words'>('date');

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/books?userId=${getDemoUserId()}`);
      const data = await response.json();
      setBooks(data.books || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-yellow-600 bg-black sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Home
              </button>
              <div className="bg-yellow-400 text-black font-bold px-3 py-1 text-2xl">
                PW
              </div>
              <h1 className="text-2xl font-bold">My Library</h1>
            </div>

            <Button variant="primary" onClick={() => router.push('/studio')}>
              + New Book
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Filters & Search */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Search books by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            value={filterGenre}
            onChange={(e) => setFilterGenre(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
            className="bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="date">Sort by Date</option>
            <option value="title">Sort by Title</option>
            <option value="words">Sort by Word Count</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <div className="text-2xl font-bold text-yellow-400">{books.length}</div>
            <div className="text-sm text-gray-400">Total Books</div>
          </div>
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <div className="text-2xl font-bold text-yellow-400">
              {books.filter((b) => b.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-400">Completed</div>
          </div>
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <div className="text-2xl font-bold text-yellow-400">
              {books.reduce((sum, b) => sum + (b.metadata?.wordCount || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Total Words</div>
          </div>
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <div className="text-2xl font-bold text-yellow-400">
              {books.reduce((sum, b) => sum + (b.metadata?.chapters || 0), 0)}
            </div>
            <div className="text-sm text-gray-400">Total Chapters</div>
          </div>
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="bg-gray-800 h-6 w-3/4 rounded mb-2" />
                <div className="bg-gray-800 h-4 w-1/2 rounded mb-4" />
                <div className="bg-gray-800 h-4 w-full rounded" />
              </div>
            ))}
          </div>
        ) : filteredAndSortedBooks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">
              {searchQuery || filterGenre !== 'all' ? 'No books match your filters' : 'No books yet'}
            </p>
            <Button variant="primary" onClick={() => router.push('/studio')}>
              Create Your First Book
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedBooks.map((book) => (
              <div
                key={book.id}
                className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-yellow-400 transition-colors cursor-pointer"
                onClick={() => router.push(`/library/${book.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-lg line-clamp-2">{book.title}</h3>
                  <Badge 
                    variant={book.status === 'completed' ? 'success' : 'default'}
                    size="sm"
                  >
                    {book.status}
                  </Badge>
                </div>

                <p className="text-sm text-gray-400 mb-1">by {book.author}</p>
                <p className="text-xs text-gray-500 mb-4">{book.genre}</p>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">📖</span>
                    <span className="text-gray-400">{book.metadata?.chapters || 0} chapters</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">📝</span>
                    <span className="text-gray-400">
                      {(book.metadata?.wordCount || 0).toLocaleString()} words
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500">
                  {new Date(book.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
