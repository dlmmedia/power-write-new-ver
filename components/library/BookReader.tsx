'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Chapter {
  id: number;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  status: 'draft' | 'completed';
}

interface BookReaderProps {
  bookTitle: string;
  author: string;
  chapters: Chapter[];
  onClose?: () => void;
}

export const BookReader: React.FC<BookReaderProps> = ({
  bookTitle,
  author,
  chapters,
  onClose,
}) => {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [showChapterList, setShowChapterList] = useState(false);

  const currentChapter = chapters[currentChapterIndex];

  const goToNextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
      window.scrollTo(0, 0);
    }
  };

  const goToPreviousChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1);
      window.scrollTo(0, 0);
    }
  };

  const goToChapter = (index: number) => {
    setCurrentChapterIndex(index);
    setShowChapterList(false);
    window.scrollTo(0, 0);
  };

  const fontSizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const lineHeightClasses = {
    sm: 'leading-relaxed',
    base: 'leading-relaxed',
    lg: 'leading-loose',
    xl: 'leading-loose',
  };

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="border-b border-yellow-600 bg-black px-4 py-3 flex-shrink-0">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
            )}
            <div>
              <h1 className="font-bold text-lg">{bookTitle}</h1>
              <p className="text-sm text-gray-400">by {author}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Font Size Controls */}
            <div className="flex items-center gap-1 bg-gray-900 rounded px-2 py-1">
              <span className="text-xs text-gray-400 mr-2">Font:</span>
              <button
                onClick={() => setFontSize('sm')}
                className={`px-2 py-1 text-xs rounded ${fontSize === 'sm' ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white'}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('base')}
                className={`px-2 py-1 text-sm rounded ${fontSize === 'base' ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white'}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('lg')}
                className={`px-2 py-1 text-base rounded ${fontSize === 'lg' ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white'}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('xl')}
                className={`px-2 py-1 text-lg rounded ${fontSize === 'xl' ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white'}`}
              >
                A
              </button>
            </div>

            {/* Chapter Navigator */}
            <button
              onClick={() => setShowChapterList(!showChapterList)}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 px-3 py-2 rounded transition-colors"
            >
              <span className="text-sm">
                Chapter {currentChapter.number} of {chapters.length}
              </span>
              <span className="text-xs">{showChapterList ? '▲' : '▼'}</span>
            </button>

            <Badge variant="info">
              {currentChapter.wordCount.toLocaleString()} words
            </Badge>
          </div>
        </div>

        {/* Chapter List Dropdown */}
        {showChapterList && (
          <div className="absolute right-4 top-16 bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto w-80 z-50">
            <div className="p-2">
              <h3 className="font-semibold text-sm text-gray-400 px-2 py-1">Chapters</h3>
              {chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  onClick={() => goToChapter(index)}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-gray-800 transition-colors ${
                    index === currentChapterIndex ? 'bg-yellow-400/10 border-l-2 border-yellow-400' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">
                        Chapter {chapter.number}: {chapter.title}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {chapter.wordCount.toLocaleString()} words
                      </div>
                    </div>
                    {index === currentChapterIndex && (
                      <Badge variant="success" size="sm">Reading</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          {/* Chapter Header */}
          <div className="mb-8 border-b border-gray-800 pb-4">
            <Badge variant="warning" size="sm" className="mb-2">
              Chapter {currentChapter.number}
            </Badge>
            <h2 className="text-3xl font-bold mb-2">{currentChapter.title}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{currentChapter.wordCount.toLocaleString()} words</span>
              <span>•</span>
              <span>~{Math.ceil(currentChapter.wordCount / 200)} min read</span>
              {currentChapter.status === 'draft' && (
                <>
                  <span>•</span>
                  <Badge variant="default" size="sm">Draft</Badge>
                </>
              )}
            </div>
          </div>

          {/* Chapter Content */}
          <div 
            className={`prose prose-invert max-w-none ${fontSizeClasses[fontSize]} ${lineHeightClasses[fontSize]}`}
            style={{
              fontFamily: 'Georgia, serif',
            }}
          >
            {currentChapter.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4 text-gray-200 text-justify">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Chapter Navigation */}
          <div className="mt-12 pt-8 border-t border-gray-800 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goToPreviousChapter}
              disabled={currentChapterIndex === 0}
            >
              ← Previous Chapter
            </Button>

            <div className="text-center text-sm text-gray-400">
              <div>Chapter {currentChapter.number} of {chapters.length}</div>
              <div className="text-xs mt-1">
                Progress: {Math.round(((currentChapterIndex + 1) / chapters.length) * 100)}%
              </div>
            </div>

            <Button
              variant="outline"
              onClick={goToNextChapter}
              disabled={currentChapterIndex === chapters.length - 1}
            >
              Next Chapter →
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Navigation Bar (bottom) */}
      <div className="border-t border-gray-800 bg-black/95 backdrop-blur px-4 py-3 flex-shrink-0">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              Reading: <span className="text-white font-medium">{currentChapter.title}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousChapter}
              disabled={currentChapterIndex === 0}
              className="p-2 hover:bg-gray-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous Chapter"
            >
              ◀
            </button>
            
            <div className="w-64 bg-gray-800 rounded-full h-2 mx-4">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all"
                style={{ width: `${((currentChapterIndex + 1) / chapters.length) * 100}%` }}
              />
            </div>

            <button
              onClick={goToNextChapter}
              disabled={currentChapterIndex === chapters.length - 1}
              className="p-2 hover:bg-gray-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next Chapter"
            >
              ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
