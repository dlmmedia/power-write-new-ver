'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBookStore } from '@/lib/store/book-store';

export const SelectedBooksPanel: React.FC = () => {
  const router = useRouter();
  const { selectedBooks, removeBook, clearBooks } = useBookStore();
  const [hoveredBook, setHoveredBook] = useState<string | null>(null);

  if (selectedBooks.length === 0) {
    return null;
  }

  const handleGenerateClick = () => {
    router.push('/studio');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Gradient border glow effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-amber-400/10 to-transparent pointer-events-none" />
      
      {/* Main panel with glass morphism */}
      <div className="bg-gradient-to-b from-zinc-900/95 to-black/98 backdrop-blur-xl border-t border-zinc-800/50 shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.8)]">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between gap-6">
            
            {/* Left section: Count badge + Book covers */}
            <div className="flex items-center gap-6 flex-1 min-w-0">
              {/* Selection count with icon */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-400/20 blur-xl rounded-full" />
                  <div className="relative flex items-center gap-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg shadow-amber-500/25">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                    <span>{selectedBooks.length}</span>
                    <span className="hidden sm:inline">Selected</span>
                  </div>
                </div>
              </div>

              {/* Book covers carousel */}
              <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-1 min-w-0">
                {selectedBooks.slice(0, 6).map((book, index) => (
                  <div
                    key={book.id}
                    className="relative flex-shrink-0 group cursor-pointer"
                    onMouseEnter={() => setHoveredBook(book.id)}
                    onMouseLeave={() => setHoveredBook(null)}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    {/* Book cover container */}
                    <div className="relative transform transition-all duration-300 ease-out group-hover:scale-110 group-hover:-translate-y-2">
                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 bg-amber-400/0 group-hover:bg-amber-400/30 rounded-lg blur-xl transition-all duration-300" />
                      
                      {/* Book cover */}
                      <div className="relative">
                        <img
                          src={book.imageUrl || '/placeholder-cover.jpg'}
                          alt={book.title}
                          className="h-20 w-14 object-cover rounded-lg shadow-xl ring-1 ring-white/10 group-hover:ring-amber-400/50 transition-all duration-300"
                        />
                        
                        {/* Remove button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBook(book.id);
                          }}
                          className="absolute -top-2 -right-2 bg-zinc-800 hover:bg-red-500 text-zinc-400 hover:text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg ring-1 ring-zinc-700 hover:ring-red-400"
                          title="Remove book"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Title tooltip on hover */}
                      {hoveredBook === book.id && (
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl ring-1 ring-zinc-700 max-w-[180px] truncate z-50">
                          {book.title}
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-800 rotate-45 ring-1 ring-zinc-700" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* More books indicator */}
                {selectedBooks.length > 6 && (
                  <div className="flex-shrink-0 h-20 w-14 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg flex items-center justify-center shadow-xl ring-1 ring-zinc-700">
                    <span className="text-zinc-400 font-semibold text-sm">
                      +{selectedBooks.length - 6}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right section: Action buttons */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Clear All button - fixed visibility */}
              <button
                onClick={clearBooks}
                className="flex items-center gap-2 px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-xl font-medium text-sm transition-all duration-200 ring-1 ring-transparent hover:ring-zinc-700"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden sm:inline">Clear</span>
              </button>

              {/* Generate button - prominent CTA */}
              <button
                onClick={handleGenerateClick}
                className="relative group flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-900 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/30 hover:shadow-amber-400/40 transition-all duration-300 hover:scale-[1.02]"
              >
                {/* Animated glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity" />
                
                <span className="relative">Generate Book</span>
                <svg
                  className="relative w-5 h-5 transform group-hover:translate-x-0.5 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
