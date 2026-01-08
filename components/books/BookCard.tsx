'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookResult } from '@/lib/services/google-books';
import { motion } from 'framer-motion';
import { Check, Star, Book, Plus } from 'lucide-react';

interface BookCardProps {
  book: BookResult;
  isSelected: boolean;
  onToggleSelect: (book: BookResult) => void;
  onClick?: (book: BookResult) => void;
  viewMode?: 'grid' | 'list';
  onImageError?: (bookId: string) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  isSelected,
  onToggleSelect,
  onClick,
  viewMode = 'grid',
  onImageError,
}) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const handleImageError = () => {
    setImageError(true);
    // Report the failed image to parent so it can filter out this book
    if (onImageError) {
      onImageError(book.id);
    }
  };
  
  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking the selection area or if it's a selection interaction
    if ((e.target as HTMLElement).closest('.selection-trigger')) {
      return;
    }
    
    if (onClick) {
      onClick(book);
    } else {
      router.push(`/books/${book.id}`);
    }
  };

  const handleSelectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect(book);
  };

  // Get best available image URL
  const getImageUrl = () => {
    if (!book.imageLinks) return null;
    return book.imageLinks.large || book.imageLinks.extraLarge || book.imageLinks.medium || book.imageLinks.small || book.imageLinks.thumbnail;
  };

  const imageUrl = getImageUrl();
  const hasImage = imageUrl && !imageError;

  // Grid View Implementation
  if (viewMode === 'grid') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className={`group relative cursor-pointer flex flex-col h-full rounded-xl transition-all duration-300 ${
          isSelected 
            ? 'ring-2 ring-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10' 
            : 'hover:shadow-xl dark:hover:shadow-yellow-900/20'
        }`}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Selection Indicator - Top Right */}
        <div 
          className="selection-trigger absolute top-3 right-3 z-20"
          onClick={handleSelectionClick}
        >
          <motion.div
            initial={false}
            animate={{
              scale: isSelected ? 1 : isHovered ? 1 : 0.8,
              opacity: isSelected ? 1 : isHovered ? 1 : 0,
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md transition-all duration-300 border-2 cursor-pointer ${
              isSelected 
                ? 'bg-yellow-500 border-yellow-500 text-white' 
                : 'bg-black/40 border-white/50 text-white hover:bg-yellow-500 hover:border-yellow-500 hover:text-white'
            }`}
          >
            {isSelected ? (
              <Check className="w-4 h-4 stroke-[3]" />
            ) : (
              <Plus className="w-4 h-4 stroke-[3]" />
            )}
          </motion.div>
        </div>

        {/* Rating Badge - Top Left */}
        {book.averageRating && (
          <div className="absolute top-3 left-3 z-10 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span>{book.averageRating.toFixed(1)}</span>
          </div>
        )}

        {/* Book Cover */}
        <div className="relative w-full aspect-[2/3] overflow-hidden rounded-t-xl bg-gray-100 dark:bg-gray-800 shadow-inner">
          {hasImage ? (
            <>
              <motion.img
                src={`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`}
                alt={book.title}
                className={`w-full h-full object-cover will-change-transform ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                animate={{ scale: isHovered ? 1.05 : 1 }}
                transition={{ duration: 0.4 }}
                onLoad={() => setImageLoaded(true)}
                onError={handleImageError}
                loading="lazy"
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
              <Book className="w-12 h-12 mb-2 opacity-50" />
              <span className="text-xs font-medium">No Cover</span>
            </div>
          )}
          
          {/* Subtle overlay gradient on hover - Darker for better visibility of select button */}
          <div 
            className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ fontFamily: '"Geist Mono", monospace' }}
          />

          {/* Hover Action Overlay */}
          <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
            isHovered && !isSelected ? 'opacity-100' : 'opacity-0'
          }`}>
            <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/20">
              View Details
            </span>
          </div>
        </div>

        {/* Book Info */}
        <div className={`p-3 flex-1 flex flex-col bg-white dark:bg-gray-900/50 rounded-b-xl border border-t-0 border-gray-100 dark:border-gray-800 transition-colors duration-200 ${
          isHovered ? 'border-gray-200 dark:border-gray-700' : ''
        }`}>
          <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 mb-1 leading-snug group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
            {book.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-auto">
            {book.authors?.join(', ') || 'Unknown Author'}
          </p>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-xs text-gray-400 font-medium">
              {book.publishedDate ? new Date(book.publishedDate).getFullYear() : 'N/A'}
            </span>
            {isSelected && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded-full"
              >
                Selected
              </motion.span>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // List View Implementation
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative cursor-pointer flex items-center p-3 rounded-xl transition-all duration-200 border ${
        isSelected 
          ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-500 ring-1 ring-yellow-500' 
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-yellow-400/50 hover:shadow-md'
      }`}
      onClick={handleCardClick}
    >
      {/* Selection Checkbox Area */}
      <div 
        className="selection-trigger mr-4 flex-shrink-0"
        onClick={handleSelectionClick}
      >
        <motion.div 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
          isSelected 
            ? 'bg-yellow-500 border-yellow-500' 
            : 'border-gray-300 dark:border-gray-600 group-hover:border-yellow-400 bg-white dark:bg-gray-800'
        }`}>
          {isSelected ? (
            <Check className="w-4 h-4 text-white stroke-[3]" />
          ) : (
            <Plus className={`w-4 h-4 text-gray-400 group-hover:text-yellow-500 transition-colors ${isHovered ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
          )}
        </motion.div>
      </div>

      {/* Small Thumbnail */}
      <div className="relative w-12 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm mr-4">
        {hasImage ? (
          <img
            src={`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`}
            alt={book.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Book className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 mr-4">
        <h3 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
          {book.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {book.authors?.join(', ') || 'Unknown Author'}
        </p>
      </div>

      {/* Meta */}
      <div className="hidden sm:block text-sm text-gray-400 font-medium whitespace-nowrap">
        {book.publishedDate ? new Date(book.publishedDate).getFullYear() : 'N/A'}
      </div>

      {/* Rating */}
      {book.averageRating && (
        <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-yellow-600 dark:text-yellow-400 ml-4 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
          <Star className="w-3 h-3 fill-current" />
          {book.averageRating.toFixed(1)}
        </div>
      )}
    </motion.div>
  );
};
