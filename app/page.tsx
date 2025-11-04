'use client';

import { useState, useEffect } from 'react';
import { BookResult } from '@/lib/services/google-books';
import { useBookStore } from '@/lib/store/book-store';
import { convertToSelectedBook } from '@/lib/utils/book-helpers';
import { BookCard } from '@/components/books/BookCard';
import { SelectedBooksPanel } from '@/components/books/SelectedBooksPanel';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ThemeToggleCompact } from '@/components/ui/ThemeToggle';

export default function Home() {
  const [books, setBooks] = useState<BookResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  const { 
    selectedBooks, 
    addBook, 
    removeBook, 
    isBookSelected,
    activeCategory,
    setActiveCategory 
  } = useBookStore();

  // Comprehensive list of categories
  const categories = [
    { id: 'bestsellers', label: '🏆 Bestsellers', popular: true },
    { id: 'new-releases', label: '🆕 New Releases', popular: true },
    { id: 'fiction', label: '📚 Fiction', popular: true },
    { id: 'non-fiction', label: '📖 Non-Fiction', popular: true },
    { id: 'mystery', label: '🔍 Mystery & Thriller' },
    { id: 'romance', label: '💕 Romance' },
    { id: 'science-fiction', label: '🚀 Science Fiction' },
    { id: 'fantasy', label: '🧙 Fantasy' },
    { id: 'horror', label: '👻 Horror' },
    { id: 'biography', label: '👤 Biography' },
    { id: 'history', label: '🏛️ History' },
    { id: 'self-help', label: '💪 Self-Help' },
    { id: 'business', label: '💼 Business' },
    { id: 'technology', label: '💻 Technology' },
    { id: 'science', label: '🔬 Science' },
    { id: 'cooking', label: '🍳 Cooking' },
    { id: 'travel', label: '✈️ Travel' },
    { id: 'poetry', label: '📝 Poetry' },
    { id: 'young-adult', label: '🎓 Young Adult' },
    { id: 'children', label: '👶 Children' },
    { id: 'graphic-novels', label: '🎨 Graphic Novels' },
    { id: 'health', label: '🏥 Health & Wellness' },
    { id: 'philosophy', label: '🤔 Philosophy' },
    { id: 'religion', label: '🕊️ Religion & Spirituality' },
    { id: 'true-crime', label: '🔪 True Crime' },
  ];

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
      
      // Filter out books without images
      const booksWithImages = (data.books || []).filter((book: BookResult) => {
        const hasImage = book.imageLinks && (
          book.imageLinks.thumbnail || 
          book.imageLinks.small || 
          book.imageLinks.medium || 
          book.imageLinks.large || 
          book.imageLinks.extraLarge
        );
        
        if (!hasImage) {
          console.log(`Filtered out book without image: ${book.title}`);
        }
        
        return hasImage;
      });
      
      console.log(`Books with images: ${booksWithImages.length} out of ${data.books?.length || 0}`);
      if (booksWithImages.length > 0) {
        console.log('First book:', booksWithImages[0].title);
        console.log('First book images:', booksWithImages[0].imageLinks);
      }
      
      setBooks(booksWithImages);
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
      
      // Filter out books without images
      const booksWithImages = (data.books || []).filter((book: BookResult) => {
        const hasImage = book.imageLinks && (
          book.imageLinks.thumbnail || 
          book.imageLinks.small || 
          book.imageLinks.medium || 
          book.imageLinks.large || 
          book.imageLinks.extraLarge
        );
        return hasImage;
      });
      
      console.log(`Search results with images: ${booksWithImages.length} out of ${data.books?.length || 0}`);
      setBooks(booksWithImages);
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

      {/* Category Tabs */}
      <section className="border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              {/* Quick access popular categories */}
              <div className="hidden md:flex space-x-6">
                {categories.filter(c => c.popular).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`text-lg font-semibold ${
                      activeCategory === cat.id
                        ? 'text-yellow-600 dark:text-yellow-400 border-b-2 border-yellow-600 dark:border-yellow-400 pb-1'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              
              {/* Dropdown for all categories */}
              <div className="relative">
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-900 dark:text-white font-medium"
                >
                  <span>All Categories</span>
                  <span className="text-xs">{showCategoryDropdown ? '▲' : '▼'}</span>
                </button>
                
                {showCategoryDropdown && (
                  <>
                    {/* Backdrop to close dropdown when clicking outside */}
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setShowCategoryDropdown(false)}
                    />
                    
                    {/* Dropdown menu */}
                    <div className="absolute left-0 top-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl w-80 max-h-96 overflow-y-auto z-20">
                      <div className="p-2">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Popular Categories
                        </div>
                        {categories.filter(c => c.popular).map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setActiveCategory(cat.id);
                              setShowCategoryDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                              activeCategory === cat.id
                                ? 'bg-yellow-400/10 border-l-2 border-yellow-400 text-yellow-600 dark:text-yellow-400 font-medium'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                        
                        <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                        
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          More Categories
                        </div>
                        {categories.filter(c => !c.popular).map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setActiveCategory(cat.id);
                              setShowCategoryDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                              activeCategory === cat.id
                                ? 'bg-yellow-400/10 border-l-2 border-yellow-400 text-yellow-600 dark:text-yellow-400 font-medium'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
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
            <h2 className="text-3xl font-bold">
              {activeCategory === 'search' 
                ? 'Search Results' 
                : categories.find(c => c.id === activeCategory)?.label || activeCategory.replace('-', ' ')}
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
