'use client';

import { useState, useEffect } from 'react';
import { BookResult } from '@/lib/services/google-books';
import { useBookStore } from '@/lib/store/book-store';
import { convertToSelectedBook } from '@/lib/utils/book-helpers';
import { BookCard } from '@/components/books/BookCard';
import { SelectedBooksPanel } from '@/components/books/SelectedBooksPanel';
import { FeaturedSection } from '@/components/home/FeaturedSection';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ThemeToggleCompact } from '@/components/ui/ThemeToggle';

export default function Home() {
  const [books, setBooks] = useState<BookResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  
  const { 
    selectedBooks, 
    addBook, 
    removeBook, 
    isBookSelected,
    activeCategory,
    setActiveCategory 
  } = useBookStore();

  useEffect(() => {
    fetchBooks(activeCategory);
  }, [activeCategory]);

  const fetchBooks = async (category: string) => {
    setLoading(true);
    try {
      console.log('Fetching books for category:', category);
      const response = await fetch(`/api/books/search?category=${category}`);
      const data = await response.json();
      console.log('Books received:', data.books?.length || 0);
      if (data.books && data.books.length > 0) {
        console.log('First book:', data.books[0].title);
        console.log('First book images:', data.books[0].imageLinks);
      }
      setBooks(data.books || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(searchInput)}`);
      const data = await response.json();
      setBooks(data.books || []);
      setActiveCategory('search');
    } catch (error) {
      console.error('Error searching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (book: BookResult) => {
    if (isBookSelected(book.id)) {
      removeBook(book.id);
    } else {
      addBook(convertToSelectedBook(book));
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white pb-32 transition-colors">
      {/* Header */}
      <header className="border-b border-yellow-600 bg-white dark:bg-black sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="bg-yellow-400 text-black font-bold px-3 py-1 text-2xl">
              PW
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="/" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Browse Books</a>
              <a href="/studio" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Studio</a>
              <a href="/library" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Library</a>
              <a href="/landing" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">About</a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggleCompact />
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <Input
                type="search"
                placeholder="Search books..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-64"
              />
              <Button type="submit" size="md" variant="primary">
                Search
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Featured Books Section */}
      <FeaturedSection 
        books={books}
        onSelectBook={handleToggleSelect}
        isBookSelected={isBookSelected}
      />

      {/* Category Tabs */}
      <section className="border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex space-x-8">
              {['bestsellers', 'new-releases', 'fiction', 'non-fiction'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-lg font-semibold capitalize ${
                    activeCategory === cat
                      ? 'text-yellow-600 dark:text-yellow-400 border-b-2 border-yellow-600 dark:border-yellow-400 pb-1'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {cat.replace('-', ' ')}
                </button>
              ))}
            </div>
            {selectedBooks.length > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedBooks.length} book{selectedBooks.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Books Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold capitalize">
              {activeCategory === 'search' ? 'Search Results' : activeCategory.replace('-', ' ')}
            </h2>
            {selectedBooks.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  books.forEach(book => {
                    if (!isBookSelected(book.id)) {
                      addBook(convertToSelectedBook(book));
                    }
                  });
                }}
              >
                Select All Visible
              </Button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 dark:bg-gray-800 aspect-[2/3] rounded-lg mb-2" />
                  <div className="bg-gray-200 dark:bg-gray-800 h-4 rounded mb-1" />
                  <div className="bg-gray-200 dark:bg-gray-800 h-3 w-2/3 rounded" />
                </div>
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              <p>No books found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isSelected={isBookSelected(book.id)}
                  onToggleSelect={handleToggleSelect}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Selected Books Panel */}
      <SelectedBooksPanel />

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>© 2025 PowerWrite. Create amazing books with AI.</p>
        </div>
      </footer>
    </main>
  );
}
