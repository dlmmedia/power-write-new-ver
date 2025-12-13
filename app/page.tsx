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
import { Logo } from '@/components/ui/Logo';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Sparkles, BookOpen, Library, Search, 
  ChevronDown, ChevronUp, Palette, User, Building2, 
  Briefcase, Laptop, GraduationCap, Utensils, Plane, 
  Feather, Ghost, Heart, Rocket, Microscope, 
  Stethoscope, Lightbulb, Church, Skull,
  LayoutGrid, List
} from 'lucide-react';

export default function Home() {
  const [books, setBooks] = useState<BookResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { 
    selectedBooks, 
    addBook, 
    removeBook, 
    isBookSelected,
    activeCategory,
    setActiveCategory 
  } = useBookStore();

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

  // Comprehensive list of categories
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
    <main className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white pb-32 md:pb-8 transition-colors">
      {/* Header */}
      <header className="border-b border-yellow-600/20 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-30" style={{ fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", monospace', letterSpacing: '0.2px', boxShadow: '0px 4px 12px 0px rgba(0, 0, 0, 0.15)' }}>
        <div className="container mx-auto px-4 py-4">
          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Logo size="md" />
              <nav className="flex items-center space-x-1">
                {[
                  { href: '/', label: 'Browse Books' },
                  { href: '/studio', label: 'Studio' },
                  { href: '/library', label: 'Library' },
                  { href: '/landing', label: 'About' },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200"
                  >
                    {link.label}
                  </a>
                ))}
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

          {/* Mobile Header */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-3">
              <Logo size="sm" />
              <ThemeToggleCompact />
            </div>
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <Input
                type="search"
                placeholder="Search books..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm" variant="primary">
                Search
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <section className="border-b border-gray-200 dark:border-gray-800 sticky top-[73px] md:top-[73px] z-30 bg-white/90 dark:bg-black/90 backdrop-blur-md" style={{ opacity: 0.92 }}>
        <div className="container mx-auto px-4">
          {/* Desktop Categories */}
          <div className="hidden md:flex justify-between items-center flex-wrap" style={{ paddingTop: '11px', paddingBottom: '11px', fontFamily: '"SF Compact Rounded", sans-serif', boxShadow: '0px 4px 12px 0px rgba(0, 0, 0, 0.15)' }}>
            <div className="flex items-center gap-4">
              {/* Quick access popular categories */}
              <div className="flex space-x-2">
                {categories.filter(c => c.popular).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      activeCategory === cat.id 
                        ? 'text-white shadow-md' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {activeCategory === cat.id && (
                      <motion.div
                        layoutId="activeCategory"
                        className="absolute inset-0 bg-yellow-500 rounded-full"
                        style={{ boxShadow: '0px 4px 12px 0px rgba(0, 0, 0, 0.15)' }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      {categoryIcons[cat.id]}
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
              
              {/* Dropdown for all categories */}
              <div className="relative">
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-900 dark:text-white font-medium text-sm"
                >
                  <span>All Categories</span>
                  {showCategoryDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                <AnimatePresence>
                  {showCategoryDropdown && (
                    <>
                      {/* Backdrop to close dropdown when clicking outside */}
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setShowCategoryDropdown(false)}
                      />
                      
                      {/* Dropdown menu */}
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 top-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl w-80 max-h-96 overflow-y-auto z-50"
                      >
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
                              className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 ${
                                activeCategory === cat.id
                                  ? 'bg-yellow-400/10 border-l-2 border-yellow-400 text-yellow-600 dark:text-yellow-400 font-medium'
                                  : 'text-gray-900 dark:text-white'
                              }`}
                            >
                              {categoryIcons[cat.id]}
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
                              className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 ${
                                activeCategory === cat.id
                                  ? 'bg-yellow-400/10 border-l-2 border-yellow-400 text-yellow-600 dark:text-yellow-400 font-medium'
                                  : 'text-gray-900 dark:text-white'
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
            
            {selectedBooks.length > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {selectedBooks.length} book{selectedBooks.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>

          {/* Mobile Categories */}
          <div className="md:hidden py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="relative flex-1">
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-900 rounded-lg text-gray-900 dark:text-white font-medium"
                >
                  <span className="truncate flex items-center gap-2">
                    {(() => {
                      const current = categories.find(c => c.id === activeCategory);
                      return current ? (
                        <>
                          {categoryIcons[current.id]}
                          {current.label}
                        </>
                      ) : 'Select Category';
                    })()}
                  </span>
                  {showCategoryDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <AnimatePresence>
                  {showCategoryDropdown && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setShowCategoryDropdown(false)}
                      />
                      
                      {/* Dropdown menu */}
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50"
                      >
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
                              className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 ${
                                activeCategory === cat.id
                                  ? 'bg-yellow-400/10 border-l-2 border-yellow-400 text-yellow-600 dark:text-yellow-400 font-medium'
                                  : 'text-gray-900 dark:text-white'
                              }`}
                            >
                              {categoryIcons[cat.id]}
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
                              className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 ${
                                activeCategory === cat.id
                                  ? 'bg-yellow-400/10 border-l-2 border-yellow-400 text-yellow-600 dark:text-yellow-400 font-medium'
                                  : 'text-gray-900 dark:text-white'
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

              {selectedBooks.length > 0 && (
                <div className="ml-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap font-medium">
                  {selectedBooks.length} selected
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Books Grid */}
      <section className="py-6 md:py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h2 className="text-xl md:text-3xl font-bold flex items-center justify-start gap-2" style={{ fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", monospace' }}>
              {activeCategory === 'search' ? (
                 <>
                   <Search className="w-6 h-6 md:w-8 md:h-8" />
                   Search Results
                 </>
              ) : (
                <>
                  {categoryIcons[activeCategory]}
                  {categories.find(c => c.id === activeCategory)?.label || activeCategory.replace('-', ' ')}
                </>
              )}
            </h2>
            
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="hidden md:flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
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
                  className="hidden md:flex"
                >
                  Select All Visible
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className={`
              ${viewMode === 'grid' 
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6' 
                : 'flex flex-col gap-3'}
            `}>
              {[...Array(12)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  {viewMode === 'grid' ? (
                    <>
                      <div className="bg-gray-200 dark:bg-gray-800 aspect-[2/3] rounded-lg mb-2" />
                      <div className="bg-gray-200 dark:bg-gray-800 h-4 rounded mb-1" />
                      <div className="bg-gray-200 dark:bg-gray-800 h-3 w-2/3 rounded" />
                    </>
                  ) : (
                    <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                  )}
                </div>
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              <p>No books found</p>
            </div>
          ) : (
            <motion.div 
              layout
              className={`
                ${viewMode === 'grid' 
                  ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6' 
                  : 'flex flex-col gap-3'}
              `}
            >
              <AnimatePresence mode="popLayout">
                {books.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    isSelected={isBookSelected(book.id)}
                    onToggleSelect={handleToggleSelect}
                    viewMode={viewMode}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
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
