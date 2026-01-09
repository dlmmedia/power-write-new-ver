'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Check, ChevronRight } from 'lucide-react';
import { TableOfContentsProps, READING_THEMES, Chapter } from './types';

interface ExtendedTableOfContentsProps extends TableOfContentsProps {
  bookTitle: string;
  author: string;
  currentPageInChapter: number;
  pagesPerChapter: number[];
}

export const TableOfContents: React.FC<ExtendedTableOfContentsProps> = ({
  chapters,
  currentChapter,
  onSelectChapter,
  isOpen,
  onClose,
  theme,
  bookTitle,
  author,
  currentPageInChapter,
  pagesPerChapter,
}) => {
  const themeConfig = READING_THEMES[theme];

  // Calculate reading progress for each chapter
  const getChapterProgress = (index: number): number => {
    if (index < currentChapter) return 100;
    if (index > currentChapter) return 0;
    const totalPages = pagesPerChapter[index] || 1;
    return Math.round((currentPageInChapter / totalPages) * 100);
  };

  // Get total word count
  const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
  const wordsRead = chapters
    .slice(0, currentChapter)
    .reduce((sum, ch) => sum + ch.wordCount, 0) + 
    (chapters[currentChapter]?.wordCount || 0) * (getChapterProgress(currentChapter) / 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Slide-out panel */}
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-[400px] max-w-[90vw] overflow-hidden flex flex-col"
            style={{
              background: themeConfig.pageBackground,
              boxShadow: `10px 0 50px ${themeConfig.shadowColor}`,
            }}
          >
            {/* Header */}
            <div 
              className="flex-shrink-0 p-6 border-b"
              style={{ borderColor: `${themeConfig.accentColor}30` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h2 
                    className="font-bold text-xl leading-tight line-clamp-2 mb-1"
                    style={{ color: themeConfig.textColor }}
                  >
                    {bookTitle}
                  </h2>
                  <p 
                    className="text-sm"
                    style={{ color: `${themeConfig.textColor}70` }}
                  >
                    by {author}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-2 rounded-xl transition-colors ml-3"
                  style={{ 
                    background: `${themeConfig.textColor}10`,
                    color: themeConfig.textColor 
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Reading progress summary */}
              <div 
                className="p-4 rounded-xl"
                style={{ background: `${themeConfig.accentColor}15` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span 
                    className="text-sm font-medium"
                    style={{ color: themeConfig.textColor }}
                  >
                    Reading Progress
                  </span>
                  <span 
                    className="text-sm font-bold"
                    style={{ color: themeConfig.accentColor }}
                  >
                    {Math.round((wordsRead / totalWords) * 100)}%
                  </span>
                </div>
                <div 
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: `${themeConfig.textColor}15` }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: themeConfig.accentColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(wordsRead / totalWords) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
                <div 
                  className="flex justify-between mt-2 text-xs"
                  style={{ color: `${themeConfig.textColor}60` }}
                >
                  <span>{Math.round(wordsRead).toLocaleString()} words read</span>
                  <span>{totalWords.toLocaleString()} total</span>
                </div>
              </div>
            </div>

            {/* Chapter list */}
            <div 
              className="flex-1 overflow-y-auto p-4"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: `${themeConfig.accentColor}40 transparent`,
              }}
            >
              <h3 
                className="text-sm font-semibold uppercase tracking-wider mb-4 px-2"
                style={{ color: `${themeConfig.textColor}60` }}
              >
                Chapters ({chapters.length})
              </h3>
              
              <div className="space-y-2">
                {chapters.map((chapter, index) => {
                  const progress = getChapterProgress(index);
                  const isCompleted = progress === 100;
                  const isCurrent = index === currentChapter;

                  return (
                    <motion.button
                      key={chapter.id}
                      onClick={() => {
                        onSelectChapter(index);
                        onClose();
                      }}
                      className="w-full text-left p-4 rounded-xl transition-all group relative overflow-hidden"
                      style={{
                        background: isCurrent 
                          ? `${themeConfig.accentColor}20`
                          : `${themeConfig.textColor}05`,
                        boxShadow: isCurrent 
                          ? `0 0 0 2px ${themeConfig.accentColor}` 
                          : 'none',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Progress background */}
                      {progress > 0 && progress < 100 && (
                        <div 
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: `linear-gradient(90deg, ${themeConfig.accentColor}10 ${progress}%, transparent ${progress}%)`,
                          }}
                        />
                      )}

                      <div className="relative flex items-start gap-3">
                        {/* Chapter number / status */}
                        <div 
                          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                          style={{
                            background: isCompleted 
                              ? themeConfig.accentColor
                              : isCurrent 
                                ? `${themeConfig.accentColor}30`
                                : `${themeConfig.textColor}10`,
                            color: isCompleted 
                              ? themeConfig.pageBackground
                              : isCurrent
                                ? themeConfig.accentColor
                                : themeConfig.textColor,
                          }}
                        >
                          {isCompleted ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            chapter.number
                          )}
                        </div>

                        {/* Chapter info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span 
                              className="font-medium line-clamp-1"
                              style={{ color: themeConfig.textColor }}
                            >
                              {chapter.title}
                            </span>
                            {isCurrent && (
                              <span 
                                className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold"
                                style={{
                                  background: themeConfig.accentColor,
                                  color: themeConfig.pageBackground,
                                }}
                              >
                                Reading
                              </span>
                            )}
                          </div>
                          <div 
                            className="flex items-center gap-2 mt-1 text-xs"
                            style={{ color: `${themeConfig.textColor}60` }}
                          >
                            <span>{chapter.wordCount.toLocaleString()} words</span>
                            <span>•</span>
                            <span>~{Math.ceil(chapter.wordCount / 200)} min</span>
                            {pagesPerChapter[index] && (
                              <>
                                <span>•</span>
                                <span>{pagesPerChapter[index]} pages</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight 
                          className="flex-shrink-0 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: themeConfig.accentColor }}
                        />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div 
              className="flex-shrink-0 p-4 border-t"
              style={{ borderColor: `${themeConfig.accentColor}20` }}
            >
              <div 
                className="flex items-center justify-center gap-2 text-sm"
                style={{ color: `${themeConfig.textColor}60` }}
              >
                <BookOpen className="w-4 h-4" />
                <span>Chapter {currentChapter + 1} of {chapters.length}</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TableOfContents;
