'use client';

import { useState } from 'react';

interface FlipBookCoverProps {
  title: string;
  author: string;
  coverUrl?: string;
  backCoverUrl?: string;
  genre: string;
  subgenre?: string;
  wordCount: number;
  chapters: number;
  description?: string;
  status: string;
  createdAt: string;
}

export function FlipBookCover({
  title,
  author,
  coverUrl,
  backCoverUrl,
  genre,
  subgenre,
  wordCount,
  chapters,
  description,
  status,
  createdAt,
}: FlipBookCoverProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="flex-shrink-0">
      {/* Flip card container */}
      <div
        className="relative w-48 h-72 cursor-pointer group"
        style={{ perspective: '1000px' }}
        onClick={handleFlip}
      >
        {/* Flip indicator hint */}
        <div className="absolute -bottom-8 left-0 right-0 text-center text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
          Click to {isFlipped ? 'see front' : 'flip'}
        </div>

        {/* Card inner - this rotates */}
        <div
          className="relative w-full h-full transition-transform duration-700 ease-in-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front face - Book Cover */}
          <div
            className="absolute inset-0 w-full h-full rounded-lg shadow-2xl overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={`${title} cover`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-bold text-6xl relative overflow-hidden">
                <div className="absolute inset-0 bg-black/5 backdrop-blur-sm"></div>
                <span className="relative z-10">📖</span>
                <div className="absolute bottom-0 left-0 right-0 bg-black/20 p-4 text-xs text-center">
                  {title.substring(0, 30)}{title.length > 30 ? '...' : ''}
                </div>
              </div>
            )}
            
            {/* Flip icon overlay */}
            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>

          {/* Back face - Book Details or Generated Back Cover */}
          <div
            className="absolute inset-0 w-full h-full rounded-lg shadow-2xl overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {/* If we have a real back cover image, show it */}
            {backCoverUrl ? (
              <div className="w-full h-full relative">
                <img
                  src={backCoverUrl}
                  alt={`${title} back cover`}
                  className="w-full h-full object-cover"
                />
                {/* Flip back icon */}
                <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
            ) : (
              /* Fallback: Show mock back cover with book details */
              <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4 flex flex-col">
                {/* Back cover header - mimicking book spine design */}
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600"></div>
                
                <div className="pl-3 flex flex-col h-full">
                  {/* Title area */}
                  <div className="mb-3">
                    <h3 className="font-bold text-sm leading-tight line-clamp-2 text-yellow-400">
                      {title}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">by {author}</p>
                  </div>
                  
                  {/* Decorative divider */}
                  <div className="flex items-center gap-1 mb-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-yellow-400/50 to-transparent"></div>
                    <span className="text-yellow-400 text-[10px]">✦</span>
                    <div className="h-px flex-1 bg-gradient-to-l from-yellow-400/50 to-transparent"></div>
                  </div>

                  {/* Description */}
                  {description && (
                    <div className="flex-1 mb-3 overflow-hidden">
                      <p className="text-[9px] text-gray-300 leading-relaxed line-clamp-6 italic">
                        "{description}"
                      </p>
                    </div>
                  )}

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-1.5 text-[9px] mb-3">
                    <div className="bg-white/5 rounded px-2 py-1.5">
                      <span className="text-yellow-400 font-bold">{chapters}</span>
                      <span className="text-gray-400 ml-1">Chapters</span>
                    </div>
                    <div className="bg-white/5 rounded px-2 py-1.5">
                      <span className="text-yellow-400 font-bold">{wordCount.toLocaleString()}</span>
                      <span className="text-gray-400 ml-1">Words</span>
                    </div>
                    <div className="bg-white/5 rounded px-2 py-1.5 col-span-2">
                      <span className="text-gray-400">~</span>
                      <span className="text-yellow-400 font-bold ml-1">{Math.ceil(wordCount / 200)}</span>
                      <span className="text-gray-400 ml-1">min read</span>
                    </div>
                  </div>

                  {/* Genre badge */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    <span className="bg-yellow-400/20 text-yellow-400 text-[8px] px-1.5 py-0.5 rounded-full border border-yellow-400/30">
                      {genre}
                    </span>
                    {subgenre && subgenre !== genre && (
                      <span className="bg-gray-700/50 text-gray-300 text-[8px] px-1.5 py-0.5 rounded-full">
                        {subgenre}
                      </span>
                    )}
                  </div>

                  {/* Status and date */}
                  <div className="mt-auto pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between text-[8px]">
                      <span className={`px-1.5 py-0.5 rounded-full ${
                        status === 'completed' 
                          ? 'bg-green-500/20 text-green-400' 
                          : status === 'archived'
                          ? 'bg-gray-500/20 text-gray-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                      <span className="text-gray-500">
                        {new Date(createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Flip back icon */}
                <div className="absolute top-2 right-2 bg-white/10 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

