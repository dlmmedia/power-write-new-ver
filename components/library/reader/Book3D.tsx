'use client';

import React, { useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Book3DProps, READING_THEMES, FONT_SIZE_CONFIG, TextChunk, AudioTimestamp } from './types';
import { AudioTextHighlighter } from './AudioTextHighlighter';

// Enhanced page flip component for realistic book-like animation
const PageFlip: React.FC<{
  isFlipping: boolean;
  direction: 'forward' | 'backward';
  theme: string;
  pageBackground: string;
  shadowColor: string;
  onComplete?: () => void;
  frontContent?: React.ReactNode;
  backContent?: React.ReactNode;
}> = ({ isFlipping, direction, pageBackground, shadowColor, onComplete, frontContent, backContent }) => {
  const flipProgress = useSpring(0, {
    stiffness: 100,
    damping: 20,
    mass: 0.8,
  });

  useEffect(() => {
    if (isFlipping) {
      flipProgress.set(direction === 'forward' ? 180 : -180);
    } else {
      flipProgress.set(0);
    }
  }, [isFlipping, direction, flipProgress]);

  // Create dynamic shadow based on flip progress
  const shadowOpacity = useTransform(flipProgress, [-180, -90, 0, 90, 180], [0, 0.4, 0, 0.4, 0]);
  const pageScale = useTransform(flipProgress, [-180, -90, 0, 90, 180], [1, 1.02, 1, 1.02, 1]);

  return (
    <AnimatePresence>
      {isFlipping && (
        <motion.div
          className="absolute inset-0 z-20"
          style={{
            transformStyle: 'preserve-3d',
            transformOrigin: direction === 'forward' ? 'left center' : 'right center',
            scale: pageScale,
          }}
          initial={{ rotateY: 0 }}
          animate={{ rotateY: direction === 'forward' ? 180 : -180 }}
          exit={{ rotateY: direction === 'forward' ? 180 : -180 }}
          transition={{
            type: 'spring',
            stiffness: 80,
            damping: 18,
            mass: 0.6,
          }}
          onAnimationComplete={onComplete}
        >
          {/* Front of page */}
          <div
            className="absolute inset-0 rounded-sm overflow-hidden"
            style={{
              background: pageBackground,
              backfaceVisibility: 'hidden',
              boxShadow: `0 8px 30px ${shadowColor}`,
            }}
          >
            {/* Page curl shadow effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                opacity: shadowOpacity,
                background: direction === 'forward'
                  ? 'linear-gradient(90deg, transparent 60%, rgba(0,0,0,0.2) 90%, rgba(0,0,0,0.3) 100%)'
                  : 'linear-gradient(270deg, transparent 60%, rgba(0,0,0,0.2) 90%, rgba(0,0,0,0.3) 100%)',
              }}
            />
            {/* Flip front content */}
            {frontContent}
          </div>

          {/* Back of page (slightly different color to simulate paper thickness) */}
          <div
            className="absolute inset-0 rounded-sm"
            style={{
              background: `linear-gradient(${direction === 'forward' ? '270deg' : '90deg'}, ${pageBackground}f8, ${pageBackground}e0)`,
              transform: 'rotateY(180deg)',
              backfaceVisibility: 'hidden',
              boxShadow: `inset 0 0 30px rgba(0,0,0,0.1)`,
            }}
          >
            {/* Paper texture on back */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                background: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(0,0,0,0.02) 2px,
                  rgba(0,0,0,0.02) 4px
                )`,
              }}
            />
            {/* Flip back content */}
            {backContent}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const Book3D: React.FC<Book3DProps> = ({
  leftPageContent,
  rightPageContent,
  leftPageNumber,
  rightPageNumber,
  totalPages,
  chapterTitle,
  theme,
  fontSize,
  isFlipping,
  flipDirection,
  onFlipComplete,
  onPageClick,
  flipFrontContent,
  flipBackContent,
  chapterWordStarts,
  audioTimestamps,
  currentAudioTime,
  isAudioPlaying,
  currentWordIndex = -1,
}) => {
  const themeConfig = READING_THEMES[theme];
  const fontConfig = FONT_SIZE_CONFIG[fontSize];

  const wordIndexAtCharPos = useCallback((charPos: number) => {
    const starts = chapterWordStarts;
    if (!starts || starts.length === 0) return Math.round(charPos / 6);
    // Upper-bound minus one: last word start <= charPos
    let lo = 0;
    let hi = starts.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (starts[mid] <= charPos) lo = mid + 1;
      else hi = mid;
    }
    const idx = lo - 1;
    return Math.max(0, Math.min(idx, starts.length - 1));
  }, [chapterWordStarts]);

  // Get page base offset for left page
  const getLeftPageBaseOffset = useCallback(() => {
    return leftPageContent.length > 0 ? wordIndexAtCharPos(leftPageContent[0].startCharIndex) : 0;
  }, [leftPageContent, wordIndexAtCharPos]);

  // Get page base offset for right page
  const getRightPageBaseOffset = useCallback(() => {
    return rightPageContent.length > 0 ? wordIndexAtCharPos(rightPageContent[0].startCharIndex) : 0;
  }, [rightPageContent, wordIndexAtCharPos]);

  // Render paragraph content with enhanced audio highlighting
  const renderLeftContent = () => {
    return (
      <AudioTextHighlighter
        chunks={leftPageContent}
        currentWordIndex={currentWordIndex}
        isAudioPlaying={isAudioPlaying || false}
        theme={theme}
        fontSize={fontConfig.className}
        lineHeight={fontConfig.lineHeight}
        textColor={themeConfig.textColor}
        fontFamily='"EB Garamond", "Crimson Pro", Georgia, serif'
        getPageBaseOffset={getLeftPageBaseOffset}
        enableAutoScroll={false}
      />
    );
  };

  const renderRightContent = () => {
    return (
      <AudioTextHighlighter
        chunks={rightPageContent}
        currentWordIndex={currentWordIndex}
        isAudioPlaying={isAudioPlaying || false}
        theme={theme}
        fontSize={fontConfig.className}
        lineHeight={fontConfig.lineHeight}
        textColor={themeConfig.textColor}
        fontFamily='"EB Garamond", "Crimson Pro", Georgia, serif'
        getPageBaseOffset={getRightPageBaseOffset}
        enableAutoScroll={false}
      />
    );
  };

  // Render lightweight static content for the turning sheet (avoid audio highlight + avoid extra work)
  const renderFlipStaticContent = useCallback((chunks: TextChunk[], side: 'left' | 'right') => {
    const paddingClass = side === 'left' ? 'p-10 pr-12' : 'p-10 pl-12';
    return (
      <div className={`absolute inset-0 overflow-hidden ${paddingClass}`}>
        <div className="h-full overflow-hidden">
          {chunks.length > 0 ? (
            chunks.map((chunk, index) => (
              <p
                key={index}
                className={`mb-5 text-justify ${fontConfig.className} ${fontConfig.lineHeight}`}
                style={{
                  color: themeConfig.textColor,
                  fontFamily: '"EB Garamond", "Crimson Pro", Georgia, serif',
                  textIndent: chunk.isParagraphStart ? '2.5em' : '0',
                  hyphens: 'auto',
                  WebkitHyphens: 'auto',
                  wordBreak: 'break-word',
                  letterSpacing: '0.01em',
                  opacity: 0.98,
                }}
              >
                {chunk.text}
              </p>
            ))
          ) : (
            <div
              className="h-full flex items-center justify-center"
              style={{ color: `${themeConfig.textColor}40` }}
            >
              <span className="text-4xl">📖</span>
            </div>
          )}
        </div>
      </div>
    );
  }, [fontConfig.className, fontConfig.lineHeight, themeConfig.textColor]);

  // Book dimensions - significantly larger
  const bookWidth = 500; // Increased from 380
  const bookHeight = 680; // Increased from 540

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ perspective: '2000px' }}
    >
      {/* Ambient glow behind book */}
      <div
        className="absolute blur-3xl opacity-40 pointer-events-none"
        style={{
          width: bookWidth * 2.5,
          height: bookHeight * 1.5,
          background: `radial-gradient(ellipse at center, ${themeConfig.accentColor}30, transparent 60%)`,
        }}
      />

      {/* Main book container */}
      <motion.div
        className="relative"
        initial={{ scale: 0.85, opacity: 0, y: 60 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{
          duration: 0.7,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        style={{
          transformStyle: 'preserve-3d',
          rotateY: 0,
          rotateX: 0,
        }}
      >
        {/* Book structure */}
        <div
          className="relative flex"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Left page shadow */}
          <div
            className="absolute -left-6 top-10 bottom-10 w-12 blur-2xl opacity-50 pointer-events-none"
            style={{ background: themeConfig.shadowColor }}
          />

          {/* Book spine - thicker for realism */}
          <div
            className="relative flex-shrink-0 z-20"
            style={{
              width: '20px',
              height: bookHeight,
              background: `linear-gradient(90deg, ${themeConfig.spineColor}dd, ${themeConfig.spineColor}, ${themeConfig.spineColor}dd)`,
              boxShadow: `inset 0 0 30px rgba(0,0,0,0.4), 0 0 20px ${themeConfig.shadowColor}`,
              transform: 'translateZ(3px)',
              borderRadius: '2px 0 0 2px',
            }}
          >
            {/* Spine embossed lines */}
            <div className="absolute inset-0 flex flex-col justify-between py-12">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="h-px mx-2"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${themeConfig.accentColor}40, transparent)`,
                  }}
                />
              ))}
            </div>
            {/* Spine title (vertical) */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                transform: 'rotate(180deg)',
              }}
            >
              <span
                className="text-[10px] font-medium tracking-widest uppercase opacity-60 truncate max-h-[400px]"
                style={{ color: themeConfig.accentColor }}
              >
                {chapterTitle}
              </span>
            </div>
          </div>

          {/* Left page */}
          <motion.div
            className="relative cursor-pointer"
            onClick={() => leftPageNumber > 0 && onPageClick('prev')}
            style={{
              width: bookWidth,
              height: bookHeight,
              transformOrigin: 'right center',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Page stack effect (pages behind) */}
            {[4, 3, 2].map((depth) => (
              <div
                key={depth}
                className="absolute inset-0 rounded-l-sm"
                style={{
                  background: themeConfig.pageBackground,
                  transform: `translateZ(-${depth}px) translateX(-${depth * 0.5}px)`,
                  boxShadow: `inset -2px 0 5px rgba(0,0,0,0.08)`,
                  opacity: 1 - depth * 0.05,
                }}
              />
            ))}

            {/* Main left page */}
            <div
              className="absolute inset-0 rounded-l-sm overflow-hidden"
              style={{
                background: themeConfig.pageBackground,
                boxShadow: `inset -6px 0 12px rgba(0,0,0,0.06), 0 4px 12px ${themeConfig.shadowColor}`,
              }}
            >
              {/* Page inner shadow (gutter) */}
              <div
                className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none"
                style={{
                  background: `linear-gradient(90deg, transparent, rgba(0,0,0,0.05))`,
                }}
              />

              {/* Paper texture overlay */}
              <div
                className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
              />

              {/* Content area */}
              <div className="absolute inset-0 p-10 pr-12 overflow-hidden">
                {/* Chapter indicator (only on first page of spread) */}
                {leftPageNumber <= 1 && (
                  <div
                    className="text-center mb-8 pb-5 border-b"
                    style={{
                      borderColor: `${themeConfig.accentColor}30`,
                      color: themeConfig.accentColor,
                    }}
                  >
                    <span className="text-xs uppercase tracking-[0.3em] font-medium">
                      {chapterTitle}
                    </span>
                  </div>
                )}

                {/* Page content */}
                <div className="h-full overflow-hidden">
                  {leftPageContent.length > 0 ? (
                    renderLeftContent()
                  ) : (
                    <div
                      className="h-full flex items-center justify-center"
                      style={{ color: themeConfig.textColor }}
                    >
                      <span className="text-5xl opacity-15">📖</span>
                    </div>
                  )}
                </div>

                {/* Page number */}
                <div
                  className="absolute bottom-5 left-10 text-sm font-medium"
                  style={{ color: `${themeConfig.textColor}60` }}
                >
                  {leftPageNumber > 0 && leftPageNumber}
                </div>
              </div>
            </div>

            {/* Page flip animation for backward */}
            <PageFlip
              isFlipping={isFlipping && flipDirection === 'backward'}
              direction="backward"
              theme={theme}
              pageBackground={themeConfig.pageBackground}
              shadowColor={themeConfig.shadowColor}
              onComplete={onFlipComplete}
              frontContent={
                flipDirection === 'backward' && flipFrontContent
                  ? renderFlipStaticContent(flipFrontContent, 'left')
                  : undefined
              }
              backContent={
                flipDirection === 'backward' && flipBackContent
                  ? renderFlipStaticContent(flipBackContent, 'right')
                  : undefined
              }
            />
          </motion.div>

          {/* Right page */}
          <motion.div
            className="relative cursor-pointer"
            onClick={() => rightPageNumber < totalPages && onPageClick('next')}
            style={{
              width: bookWidth,
              height: bookHeight,
              transformOrigin: 'left center',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Page stack effect (pages behind) */}
            {[4, 3, 2].map((depth) => (
              <div
                key={depth}
                className="absolute inset-0 rounded-r-sm"
                style={{
                  background: themeConfig.pageBackground,
                  transform: `translateZ(-${depth}px) translateX(${depth * 0.5}px)`,
                  boxShadow: `inset 2px 0 5px rgba(0,0,0,0.08)`,
                  opacity: 1 - depth * 0.05,
                }}
              />
            ))}

            {/* Main right page */}
            <div
              className="absolute inset-0 rounded-r-sm overflow-hidden"
              style={{
                background: themeConfig.pageBackground,
                boxShadow: `inset 6px 0 12px rgba(0,0,0,0.06), 0 4px 12px ${themeConfig.shadowColor}`,
              }}
            >
              {/* Page inner shadow (gutter) */}
              <div
                className="absolute left-0 top-0 bottom-0 w-16 pointer-events-none"
                style={{
                  background: `linear-gradient(270deg, transparent, rgba(0,0,0,0.05))`,
                }}
              />

              {/* Paper texture overlay */}
              <div
                className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
              />

              {/* Content area */}
              <div className="absolute inset-0 p-10 pl-12 overflow-hidden">
                {/* Page content */}
                <div className="h-full overflow-hidden">
                  {rightPageContent.length > 0 ? (
                    renderRightContent()
                  ) : (
                    <div
                      className="h-full flex items-center justify-center"
                      style={{ color: themeConfig.textColor }}
                    >
                      <span className="text-5xl opacity-15">📖</span>
                    </div>
                  )}
                </div>

                {/* Page number */}
                <div
                  className="absolute bottom-5 right-10 text-sm font-medium"
                  style={{ color: `${themeConfig.textColor}60` }}
                >
                  {rightPageNumber <= totalPages && rightPageNumber}
                </div>
              </div>
            </div>

            {/* Page flip animation for forward */}
            <PageFlip
              isFlipping={isFlipping && flipDirection === 'forward'}
              direction="forward"
              theme={theme}
              pageBackground={themeConfig.pageBackground}
              shadowColor={themeConfig.shadowColor}
              onComplete={onFlipComplete}
              frontContent={
                flipDirection === 'forward' && flipFrontContent
                  ? renderFlipStaticContent(flipFrontContent, 'right')
                  : undefined
              }
              backContent={
                flipDirection === 'forward' && flipBackContent
                  ? renderFlipStaticContent(flipBackContent, 'left')
                  : undefined
              }
            />
          </motion.div>

          {/* Right page shadow */}
          <div
            className="absolute -right-6 top-10 bottom-10 w-12 blur-2xl opacity-50 pointer-events-none"
            style={{ background: themeConfig.shadowColor }}
          />
        </div>

        {/* Book bottom edge (thickness) - enhanced */}
        <div
          className="absolute left-5 right-0 h-4 rounded-b"
          style={{
            bottom: '-8px',
            background: `linear-gradient(180deg, ${themeConfig.pageBackground}f0, ${themeConfig.pageBackground}90, ${themeConfig.pageBackground}40)`,
            boxShadow: `0 4px 12px ${themeConfig.shadowColor}`,
            transform: 'translateZ(-5px) rotateX(85deg)',
            transformOrigin: 'top center',
          }}
        />

        {/* Page edges (right side) */}
        <div
          className="absolute top-2 bottom-2"
          style={{
            right: '-6px',
            width: '6px',
            background: `repeating-linear-gradient(
              180deg,
              ${themeConfig.pageBackground}f0,
              ${themeConfig.pageBackground}f0 2px,
              ${themeConfig.pageBackground}d0 2px,
              ${themeConfig.pageBackground}d0 4px
            )`,
            borderRadius: '0 2px 2px 0',
            boxShadow: `2px 0 8px ${themeConfig.shadowColor}`,
          }}
        />
      </motion.div>
    </div>
  );
};
