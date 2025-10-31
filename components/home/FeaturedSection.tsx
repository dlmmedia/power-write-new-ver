'use client';

import { useState, useEffect } from 'react';
import { BookResult } from '@/lib/services/google-books';
import { Button } from '@/components/ui/Button';

interface FeaturedSectionProps {
  books: BookResult[];
  onSelectBook: (book: BookResult) => void;
  isBookSelected: (bookId: string) => boolean;
}

export function FeaturedSection({ books, onSelectBook, isBookSelected }: FeaturedSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const featuredBooks = books.slice(0, 5);

  // Reset index when books change
  useEffect(() => {
    if (currentIndex >= featuredBooks.length) {
      setCurrentIndex(0);
    }
  }, [featuredBooks.length, currentIndex]);

  useEffect(() => {
    if (featuredBooks.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredBooks.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [featuredBooks.length]);

  if (featuredBooks.length === 0) {
    return null;
  }

  const currentBook = featuredBooks[currentIndex];
  
  // Safety check - if currentBook is undefined, return null
  if (!currentBook) {
    return null;
  }

  // Use highest quality images for featured section
  const backgroundImageUrl = currentBook.imageLinks?.extraLarge ?? currentBook.imageLinks?.large ?? currentBook.imageLinks?.medium ?? null;
  const coverImageUrl = currentBook.imageLinks?.extraLarge ?? currentBook.imageLinks?.large ?? currentBook.imageLinks?.medium ?? null;

  return (
    <section className="relative h-[600px] overflow-hidden bg-black">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0">
        {backgroundImageUrl ? (
          <img
            src={`/api/proxy-image?url=${encodeURIComponent(backgroundImageUrl)}`}
            alt={currentBook.title}
            className="w-full h-full object-cover opacity-30 blur-sm"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
      </div>

      {/* Content */}
      <div className="relative h-full container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 h-full items-center">
          {/* Left Side - Book Info */}
          <div className="space-y-6 pt-20 lg:pt-0">
            <div className="inline-block">
              <span className="bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full">
                FEATURED BOOK
              </span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-white">
              {currentBook.title}
            </h1>

            <div className="flex items-center gap-4">
              <p className="text-xl text-gray-300">
                by {currentBook.authors.join(', ')}
              </p>
              {currentBook.averageRating && (
                <div className="flex items-center gap-1 bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold">
                  ⭐ {currentBook.averageRating.toFixed(1)}
                  {currentBook.ratingsCount && (
                    <span className="text-xs ml-1">({currentBook.ratingsCount})</span>
                  )}
                </div>
              )}
            </div>

            {currentBook.description && (
              <p className="text-gray-300 text-lg line-clamp-4">
                {currentBook.description}
              </p>
            )}

            <div className="flex items-center gap-3">
              {currentBook.categories && currentBook.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentBook.categories.slice(0, 3).map((category, idx) => (
                    <span
                      key={idx}
                      className="bg-gray-800 border border-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                variant={isBookSelected(currentBook.id) ? 'outline' : 'primary'}
                size="lg"
                onClick={() => onSelectBook(currentBook)}
              >
                {isBookSelected(currentBook.id) ? '✓ Selected' : '+ Select as Reference'}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.location.href = '/studio'}
              >
                Start Writing →
              </Button>
            </div>
          </div>

          {/* Right Side - Book Cover */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-20 rounded-lg" />
              {coverImageUrl ? (
                <img
                  src={`/api/proxy-image?url=${encodeURIComponent(coverImageUrl)}`}
                  alt={currentBook.title}
                  className="relative w-[400px] h-[600px] object-cover rounded-lg shadow-2xl shadow-black/50 transform hover:scale-105 transition-transform duration-300"
                />
              ) : null}
            </div>
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3">
          {featuredBooks.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'bg-yellow-400 w-8'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={() => setCurrentIndex((prev) => (prev - 1 + featuredBooks.length) % featuredBooks.length)}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
        >
          ←
        </button>
        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % featuredBooks.length)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
        >
          →
        </button>
      </div>
    </section>
  );
}
