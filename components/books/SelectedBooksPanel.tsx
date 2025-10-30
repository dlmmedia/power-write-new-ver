'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useBookStore } from '@/lib/store/book-store';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const SelectedBooksPanel: React.FC = () => {
  const router = useRouter();
  const { selectedBooks, removeBook, clearBooks } = useBookStore();

  if (selectedBooks.length === 0) {
    return null;
  }

  const handleGenerateClick = () => {
    router.push('/studio');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t-2 border-yellow-400 shadow-2xl z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Selected Books Info */}
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="warning" size="lg">
                {selectedBooks.length} Selected
              </Badge>
            </div>

            {/* Book Thumbnails */}
            <div className="flex items-center gap-2 overflow-x-auto max-w-2xl">
              {selectedBooks.slice(0, 5).map((book) => (
                <div
                  key={book.id}
                  className="relative flex-shrink-0 group"
                >
                  <img
                    src={book.imageUrl || '/placeholder-cover.jpg'}
                    alt={book.title}
                    className="h-16 w-12 object-cover rounded shadow-lg"
                  />
                  <button
                    onClick={() => removeBook(book.id)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
              {selectedBooks.length > 5 && (
                <div className="flex-shrink-0 h-16 w-12 bg-gray-800 rounded flex items-center justify-center text-sm text-gray-400">
                  +{selectedBooks.length - 5}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="md"
              onClick={clearBooks}
            >
              Clear All
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleGenerateClick}
              rightIcon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            >
              Generate Book
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
