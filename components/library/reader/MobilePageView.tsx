'use client';

import React, { useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ReadingTheme, FontSize, READING_THEMES, FONT_SIZE_CONFIG, TextChunk, AudioTimestamp } from './types';
import { AudioTextHighlighter } from './AudioTextHighlighter';

interface MobilePageViewProps {
  content: TextChunk[];
  pageNumber: number;
  totalPages: number;
  chapterTitle: string;
  chapterNumber: number;
  theme: ReadingTheme;
  fontSize: FontSize;
  onNextPage: () => void;
  onPrevPage: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  isFlipping: boolean;
  flipDirection: 'forward' | 'backward';
  audioTimestamps?: AudioTimestamp[] | null;
  currentAudioTime?: number;
  isAudioPlaying?: boolean;
  currentWordIndex?: number;
}

export const MobilePageView: React.FC<MobilePageViewProps> = ({
  content,
  pageNumber,
  totalPages,
  chapterTitle,
  chapterNumber,
  theme,
  fontSize,
  onNextPage,
  onPrevPage,
  canGoNext,
  canGoPrev,
  isFlipping,
  flipDirection,
  audioTimestamps,
  currentAudioTime,
  isAudioPlaying,
  currentWordIndex = -1,
}) => {
  const themeConfig = READING_THEMES[theme];
  const fontConfig = FONT_SIZE_CONFIG[fontSize];

  // Handle swipe gestures
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold && canGoNext) {
      onNextPage();
    } else if (info.offset.x > threshold && canGoPrev) {
      onPrevPage();
    }
  };

  // Estimate word offset from character index (average ~6 chars per word including space)
  const estimateWordOffset = useCallback((startCharIndex: number) => Math.round(startCharIndex / 6), []);

  // Get page base offset - memoized to prevent unnecessary re-renders
  const getPageBaseOffset = useCallback(() => {
    return content.length > 0 ? estimateWordOffset(content[0].startCharIndex) : 0;
  }, [content, estimateWordOffset]);

  // Render paragraph content with enhanced audio highlighting
  const renderContent = () => {
    return (
      <AudioTextHighlighter
        chunks={content}
        currentWordIndex={currentWordIndex}
        isAudioPlaying={isAudioPlaying || false}
        theme={theme}
        fontSize={fontConfig.className}
        lineHeight={fontConfig.lineHeight}
        textColor={themeConfig.textColor}
        fontFamily='"EB Garamond", "Crimson Pro", Georgia, serif'
        getPageBaseOffset={getPageBaseOffset}
      />
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Page container */}
      <motion.div
        className="flex-1 relative overflow-hidden rounded-2xl mx-4 my-2"
        style={{
          background: themeConfig.pageBackground,
          boxShadow: `0 8px 32px ${themeConfig.shadowColor}`,
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        {/* Chapter header */}
        {pageNumber <= 1 && (
          <div 
            className="text-center py-4 px-6 border-b"
            style={{ borderColor: `${themeConfig.accentColor}30` }}
          >
            <span 
              className="text-xs uppercase tracking-widest font-medium"
              style={{ color: themeConfig.accentColor }}
            >
              Chapter {chapterNumber}
            </span>
            <h2 
              className="text-lg font-bold mt-1"
              style={{ color: themeConfig.textColor }}
            >
              {chapterTitle}
            </h2>
          </div>
        )}

        {/* Content area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={pageNumber}
            initial={{ 
              opacity: 0, 
              x: flipDirection === 'forward' ? 50 : -50 
            }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ 
              opacity: 0, 
              x: flipDirection === 'forward' ? -50 : 50 
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute inset-0 p-6 overflow-y-auto reader-scrollbar"
            style={{ top: pageNumber <= 1 ? '80px' : 0 }}
          >
            {content.length > 0 ? (
              renderContent()
            ) : (
              <div 
                className="h-full flex items-center justify-center"
                style={{ color: `${themeConfig.textColor}40` }}
              >
                <span className="text-4xl">📖</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Page number */}
        <div 
          className="absolute bottom-3 left-0 right-0 text-center text-xs font-medium"
          style={{ color: `${themeConfig.textColor}60` }}
        >
          Page {pageNumber} of {totalPages}
        </div>

        {/* Swipe hint overlay */}
        <div className="absolute inset-x-0 bottom-10 flex justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.5 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
            style={{
              background: `${themeConfig.textColor}10`,
              color: `${themeConfig.textColor}50`,
            }}
          >
            <ChevronLeft className="w-3 h-3" />
            <span>Swipe to navigate</span>
            <ChevronRight className="w-3 h-3" />
          </motion.div>
        </div>
      </motion.div>

      {/* Navigation buttons (touch-friendly) */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3">
        <button
          onClick={onPrevPage}
          disabled={!canGoPrev}
          className="flex items-center gap-2 px-4 py-3 rounded-xl transition-all disabled:opacity-30"
          style={{
            background: canGoPrev ? `${themeConfig.accentColor}20` : 'transparent',
            color: themeConfig.textColor,
          }}
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Prev</span>
        </button>

        <div 
          className="text-center"
          style={{ color: `${themeConfig.textColor}70` }}
        >
          <div className="text-xs font-medium">
            {Math.round((pageNumber / totalPages) * 100)}%
          </div>
        </div>

        <button
          onClick={onNextPage}
          disabled={!canGoNext}
          className="flex items-center gap-2 px-4 py-3 rounded-xl transition-all disabled:opacity-30"
          style={{
            background: canGoNext ? `${themeConfig.accentColor}20` : 'transparent',
            color: themeConfig.textColor,
          }}
        >
          <span className="text-sm font-medium">Next</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MobilePageView;
