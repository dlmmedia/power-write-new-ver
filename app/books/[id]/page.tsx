'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookResult } from '@/lib/services/google-books';
import { useBookStore } from '@/lib/store/book-store';
import { convertToSelectedBook } from '@/lib/utils/book-helpers';
import { Button } from '@/components/ui/Button';

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;
  
  const [book, setBook] = useState<BookResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { addBook, removeBook, isBookSelected } = useBookStore();
  
  const fetchBookDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/books/details/${bookId}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setBook(data.book);
      }
    } catch (err) {
      setError('Failed to load book details');
      console.error('Error fetching book details:', err);
    } finally {
      setLoading(false);
    }
  }, [bookId]);
  
  useEffect(() => {
    fetchBookDetails();
  }, [fetchBookDetails]);
  
  const handleToggleSelect = () => {
    if (!book) return;
    
    if (isBookSelected(book.id)) {
      removeBook(book.id);
    } else {
      addBook(convertToSelectedBook(book));
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-gray-400">Loading book details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !book) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Book not found'}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }
  
  const coverImageUrl = book.imageLinks?.extraLarge || book.imageLinks?.large || book.imageLinks?.medium || book.imageLinks?.small || book.imageLinks?.thumbnail;
  const isSelected = isBookSelected(book.id);
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Page Toolbar */}
      <header className="border-b border-yellow-600/20 bg-black/80 backdrop-blur-md sticky top-16 z-30" style={{ fontFamily: 'var(--font-header)', letterSpacing: 'var(--letter-spacing-header)', boxShadow: 'var(--shadow-header)' }}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white line-clamp-1">{book?.title || 'Book Details'}</h1>
          <Button onClick={() => router.back()} variant="outline" size="sm">
            ← Back
          </Button>
        </div>
      </header>

      {/* Book Details */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column - Book Cover */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {coverImageUrl ? (
                <img
                  src={`/api/proxy-image?url=${encodeURIComponent(coverImageUrl)}`}
                  alt={book.title}
                  className="w-full max-w-md mx-auto rounded-lg shadow-2xl shadow-yellow-400/20"
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📖</div>
                    <p className="text-gray-500">No Cover Available</p>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <Button
                  variant={isSelected ? 'outline' : 'primary'}
                  size="lg"
                  onClick={handleToggleSelect}
                  className="w-full"
                >
                  {isSelected ? '✓ Selected as Reference' : '+ Select as Reference'}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => router.push('/studio')}
                  className="w-full"
                >
                  Start Writing →
                </Button>
              </div>
            </div>
          </div>
          
          {/* Right Column - Book Information */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title and Author */}
            <div>
              <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-header)' }}>{book.title}</h1>
              <p className="text-2xl text-gray-300">
                by {book.authors.join(', ')}
              </p>
            </div>
            
            {/* Rating and Meta Info */}
            <div className="flex flex-wrap gap-4 items-center">
              {book.averageRating && (
                <div className="flex items-center gap-2 bg-yellow-400 text-black px-4 py-2 rounded-full font-bold">
                  ⭐ {book.averageRating.toFixed(1)}
                  {book.ratingsCount && (
                    <span className="text-sm">({book.ratingsCount.toLocaleString()} ratings)</span>
                  )}
                </div>
              )}
              {book.publishedDate && (
                <div className="bg-gray-800 text-gray-300 px-4 py-2 rounded-full">
                  Published: {new Date(book.publishedDate).getFullYear()}
                </div>
              )}
              {book.pageCount && (
                <div className="bg-gray-800 text-gray-300 px-4 py-2 rounded-full">
                  {book.pageCount} pages
                </div>
              )}
            </div>
            
            {/* Categories */}
            {book.categories && book.categories.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3 text-yellow-400" style={{ fontFamily: 'var(--font-nav)' }}>Categories</h2>
                <div className="flex flex-wrap gap-2">
                  {book.categories.map((category, idx) => (
                    <span
                      key={idx}
                      className="bg-gray-800 border border-gray-700 text-gray-300 px-4 py-2 rounded-full text-sm"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Description */}
            {book.description && (
              <div>
                <h2 className="text-xl font-semibold mb-3 text-yellow-400" style={{ fontFamily: 'var(--font-nav)' }}>Description</h2>
                <div 
                  className="text-gray-300 leading-relaxed prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: book.description }}
                />
              </div>
            )}
            
            {/* Additional Details */}
            <div className="border-t border-gray-800 pt-8">
              <h2 className="text-xl font-semibold mb-4 text-yellow-400" style={{ fontFamily: 'var(--font-nav)' }}>Book Details</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {book.publisher && (
                  <>
                    <dt className="text-gray-500 font-medium">Publisher</dt>
                    <dd className="text-gray-300">{book.publisher}</dd>
                  </>
                )}
                {book.publishedDate && (
                  <>
                    <dt className="text-gray-500 font-medium">Publication Date</dt>
                    <dd className="text-gray-300">{book.publishedDate}</dd>
                  </>
                )}
                {book.isbn && (
                  <>
                    <dt className="text-gray-500 font-medium">ISBN</dt>
                    <dd className="text-gray-300 font-mono">{book.isbn}</dd>
                  </>
                )}
                {book.language && (
                  <>
                    <dt className="text-gray-500 font-medium">Language</dt>
                    <dd className="text-gray-300">{book.language.toUpperCase()}</dd>
                  </>
                )}
                {book.pageCount && (
                  <>
                    <dt className="text-gray-500 font-medium">Pages</dt>
                    <dd className="text-gray-300">{book.pageCount}</dd>
                  </>
                )}
              </dl>
            </div>
            
            {/* Google Books Preview */}
            <div className="border-t border-gray-800 pt-8">
              <h2 className="text-xl font-semibold mb-4 text-yellow-400" style={{ fontFamily: 'var(--font-nav)' }}>Preview</h2>
              <div className="bg-gray-900 rounded-lg p-4">
                <iframe
                  src={`https://books.google.com/books?id=${bookId}&lpg=PP1&pg=PP1&output=embed`}
                  width="100%"
                  height="600"
                  className="rounded"
                  style={{ border: 'none' }}
                  title={`Preview of ${book.title}`}
                />
                <p className="text-gray-500 text-sm mt-2 text-center">
                  Preview provided by Google Books
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
