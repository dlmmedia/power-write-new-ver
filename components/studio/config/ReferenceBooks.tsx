'use client';

import { useState, useEffect } from 'react';
import { BookResult } from '@/lib/services/google-books';
import { useBookStore } from '@/lib/store/book-store';
import { convertToSelectedBook } from '@/lib/utils/book-helpers';
import { BookCard } from '@/components/books/BookCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Sparkles, BookOpen, Library, Search, 
  ChevronDown, ChevronUp, Palette, User, Building2, 
  Briefcase, Laptop, GraduationCap, Utensils, Plane, 
  Feather, Ghost, Heart, Rocket, Microscope, 
  Stethoscope, Lightbulb, Church, Skull,
  LayoutGrid, List, AlertCircle, RefreshCw, X, Check
} from 'lucide-react';

export function ReferenceBooks() {
  const [books, setBooks] = useState<BookResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());
  
  const { 
    selectedBooks, 
    addBook, 
    removeBook, 
    isBookSelected,
    activeCategory,
    setActiveCategory 
  } = useBookStore();
  
  // Handle image loading failures - remove book from display
  const handleImageError = (bookId: string) => {
    setFailedImageIds(prev => new Set(prev).add(bookId));
  };
  
  // Filter out books with failed images
  const displayedBooks = books.filter(book => !failedImageIds.has(book.id));

  const categoryIcons: Record<string, React.ReactNode> = {
    'bestsellers': <Trophy className="w-4 h-4" />,
    'new-releases': <Sparkles className="w-4 h-4" />,
    'fiction': <BookOpen className="w-4 h-4" />,
    'non-fiction': <Library className="w-4 h-4" />,
    'mystery': <Search className="w-4 h-4" />,
    'romance': <Heart className="w-4 h-4" />,
    'science-fiction': <Rocket className="w-4 h-4" />,
    'fantasy': <Ghost className="w-4 h-4" />,
    'horror': <Skull className="w-4 h-4" />,
    'biography': <User className="w-4 h-4" />,
    'history': <Building2 className="w-4 h-4" />,
    'self-help': <Lightbulb className="w-4 h-4" />,
    'business': <Briefcase className="w-4 h-4" />,
    'technology': <Laptop className="w-4 h-4" />,
    'science': <Microscope className="w-4 h-4" />,
    'cooking': <Utensils className="w-4 h-4" />,
    'travel': <Plane className="w-4 h-4" />,
    'poetry': <Feather className="w-4 h-4" />,
    'young-adult': <GraduationCap className="w-4 h-4" />,
    'children': <User className="w-4 h-4" />,
    'graphic-novels': <Palette className="w-4 h-4" />,
    'health': <Stethoscope className="w-4 h-4" />,
    'philosophy': <Lightbulb className="w-4 h-4" />,
    'religion': <Church className="w-4 h-4" />,
    'true-crime': <Search className="w-4 h-4" />,
  };

  const categories = [
    { id: 'bestsellers', label: 'Bestsellers', popular: true },
    { id: 'new-releases', label: 'New Releases', popular: true },
    { id: 'fiction', label: 'Fiction', popular: true },
    { id: 'non-fiction', label: 'Non-Fiction', popular: true },
    { id: 'mystery', label: 'Mystery & Thriller' },
    { id: 'romance', label: 'Romance' },
    { id: 'science-fiction', label: 'Science Fiction' },
    { id: 'fantasy', label: 'Fantasy' },
    { id: 'horror', label: 'Horror' },
    { id: 'biography', label: 'Biography' },
    { id: 'history', label: 'History' },
    { id: 'self-help', label: 'Self-Help' },
    { id: 'business', label: 'Business' },
    { id: 'technology', label: 'Technology' },
    { id: 'science', label: 'Science' },
    { id: 'cooking', label: 'Cooking' },
    { id: 'travel', label: 'Travel' },
    { id: 'poetry', label: 'Poetry' },
    { id: 'young-adult', label: 'Young Adult' },
    { id: 'children', label: 'Children' },
    { id: 'graphic-novels', label: 'Graphic Novels' },
    { id: 'health', label: 'Health & Wellness' },
    { id: 'philosophy', label: 'Philosophy' },
    { id: 'religion', label: 'Religion & Spirituality' },
    { id: 'true-crime', label: 'True Crime' },
  ];

  useEffect(() => {
    fetchBooks(activeCategory);
  }, [activeCategory]);

  const fetchBooks = async (category: string, retry = 0) => {
    setLoading(true);
    setError(null);
    setRetryCount(retry);
    // Clear failed image IDs when fetching new books
    setFailedImageIds(new Set());
    
    try {
      const response = await fetch(`/api/books/search?category=${category}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch books (${response.status})`);
      }
      
      const data = await response.json();
      
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
      
      setBooks(booksWithImages);
      setError(null);
    } catch (err) {
      console.error('Error fetching books:', err);
      
      // Retry up to 3 times
      if (retry < 3) {
        setTimeout(() => {
          fetchBooks(category, retry + 1);
        }, 1000 * (retry + 1));
        return;
      }
      
      setError('Failed to load books. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    
    setLoading(true);
    setError(null);
    setFailedImageIds(new Set()); // Clear failed images when searching
    
    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(searchInput)}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      
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
      
      setBooks(booksWithImages);
      setActiveCategory('search');
    } catch (err) {
      console.error('Error searching books:', err);
      setError('Search failed. Please try again.');
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Reference Books</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Browse and select books to use as references for your writing style and inspiration.
        </p>
      </div>

      {/* Selected Books Summary */}
      {selectedBooks.length > 0 && (
        <div className="bg-yellow-50/80 dark:bg-yellow-950/10 border border-yellow-200/40 dark:border-yellow-800/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {selectedBooks.length} Reference{selectedBooks.length !== 1 ? 's' : ''} Selected
            </p>
            <button
              onClick={() => selectedBooks.forEach(book => removeBook(book.id))}
              className="text-[11px] text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedBooks.map((book) => (
              <div
                key={book.id}
                className="flex items-center gap-1.5 bg-white dark:bg-gray-900/50 rounded-md pl-1 pr-2 py-1 border border-gray-200/60 dark:border-gray-700/30 group"
              >
                <img
                  src={book.imageUrl || '/placeholder-cover.jpg'}
                  alt={book.title}
                  className="w-5 h-7 object-cover rounded shadow-sm"
                />
                <span className="text-[11px] text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                  {book.title}
                </span>
                <button
                  onClick={() => removeBook(book.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="search"
            placeholder="Search for books by title, author, or topic..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <Button type="submit" size="md" variant="primary">
          Search
        </Button>
      </form>

      {/* Category & View Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Category Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {categories.filter(c => c.popular).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeCategory === cat.id 
                  ? 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 ring-1 ring-yellow-500/20' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }`}
            >
              {categoryIcons[cat.id]}
              <span className="hidden sm:inline">{cat.label}</span>
            </button>
          ))}
          
          {/* All Categories Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-700 dark:text-gray-300 font-medium text-sm"
            >
              <span>More</span>
              {showCategoryDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            <AnimatePresence>
              {showCategoryDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowCategoryDropdown(false)}
                  />
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 top-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl w-64 max-h-72 overflow-y-auto z-50"
                  >
                    <div className="p-2">
                      {categories.filter(c => !c.popular).map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setActiveCategory(cat.id);
                            setShowCategoryDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center gap-2 text-sm ${
                            activeCategory === cat.id
                              ? 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-300 font-medium'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {categoryIcons[cat.id] || <BookOpen className="w-4 h-4" />}
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-yellow-600 dark:text-yellow-400' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              aria-label="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-yellow-600 dark:text-yellow-400' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              aria-label="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Title */}
      <div className="flex items-center gap-1.5">
        <span className="text-gray-400 dark:text-gray-500">{categoryIcons[activeCategory]}</span>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {activeCategory === 'search' 
            ? 'Search Results'
            : categories.find(c => c.id === activeCategory)?.label || activeCategory.replace('-', ' ')
          }
        </h3>
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 dark:text-red-400">{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchBooks(activeCategory)}
              className="ml-2"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div>
          {retryCount > 0 && (
            <div className="text-center mb-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Retrying... (attempt {retryCount + 1}/4)
              </span>
            </div>
          )}
          <div className={`
            ${viewMode === 'grid' 
              ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4' 
              : 'flex flex-col gap-3'}
          `}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                {viewMode === 'grid' ? (
                  <>
                    <div className="bg-gray-200 dark:bg-gray-800 aspect-[2/3] rounded-lg mb-2" />
                    <div className="bg-gray-200 dark:bg-gray-800 h-4 rounded mb-1" />
                    <div className="bg-gray-200 dark:bg-gray-800 h-3 w-2/3 rounded" />
                  </>
                ) : (
                  <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && displayedBooks.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {activeCategory === 'search' 
              ? `No books found for "${searchInput}"`
              : 'No books found in this category'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {activeCategory === 'search'
              ? 'Try a different search term or browse categories'
              : 'Try selecting a different category'}
          </p>
          {activeCategory === 'search' && (
            <Button
              variant="outline"
              onClick={() => {
                setActiveCategory('bestsellers');
                setSearchInput('');
              }}
            >
              Browse Bestsellers
            </Button>
          )}
        </div>
      )}

      {/* Books Grid */}
      {!loading && !error && displayedBooks.length > 0 && (
        <motion.div 
          layout
          className={`
            ${viewMode === 'grid' 
              ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4' 
              : 'flex flex-col gap-3'}
          `}
        >
          <AnimatePresence mode="popLayout">
            {displayedBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                isSelected={isBookSelected(book.id)}
                onToggleSelect={handleToggleSelect}
                viewMode={viewMode}
                onImageError={handleImageError}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Tip */}
      <div className="bg-gray-50/80 dark:bg-gray-800/30 rounded-lg p-3 border border-gray-200/40 dark:border-gray-700/20 mt-4">
        <p className="text-[11px] text-gray-500 dark:text-gray-400">
          <strong className="font-medium text-gray-600 dark:text-gray-300">Tip:</strong> Click on a book to view details, or click the + button to add it as a reference. 
          Selected books will be used to inspire your writing style and help auto-populate settings.
        </p>
      </div>
    </div>
  );
}
