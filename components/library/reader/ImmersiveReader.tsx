'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Music, Book, Layers3 } from 'lucide-react';
import { Book3D } from './Book3D';
import { MobilePageView } from './MobilePageView';
import { ReadingControls, MinimalControls } from './ReadingControls';
import { ThemeSelector } from './ThemeSelector';
import { AmbientSoundManager, usePageTurnSound, useAmbientAudio } from './AmbientSoundManager';
import { TableOfContents } from './TableOfContents';
import { paginateBook, getSpreadPages } from './PageContent';
import {
  ImmersiveReaderProps,
  ReadingTheme,
  FontSize,
  AmbientSoundType,
  READING_THEMES,
  AMBIENT_SOUNDS,
  ReadingState,
} from './types';

// Reader mode type
type ReaderMode = '3d' | 'traditional';

// Hook to detect mobile viewport
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Local storage key prefix
const STORAGE_KEY_PREFIX = 'immersive-reader-';

// Save reading state to localStorage
function saveReadingState(bookId: number, state: Partial<ReadingState & { readerMode: ReaderMode }>) {
  try {
    const key = `${STORAGE_KEY_PREFIX}${bookId}`;
    const existing = localStorage.getItem(key);
    const parsed = existing ? JSON.parse(existing) : {};
    localStorage.setItem(key, JSON.stringify({ ...parsed, ...state, updatedAt: Date.now() }));
  } catch (e) {
    console.error('Failed to save reading state:', e);
  }
}

// Load reading state from localStorage
function loadReadingState(bookId: number): Partial<ReadingState & { readerMode: ReaderMode }> | null {
  try {
    const key = `${STORAGE_KEY_PREFIX}${bookId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error('Failed to load reading state:', e);
    return null;
  }
}

// Floating Sound Panel Component - Easy access to ambient sounds
const FloatingSoundPanel: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  currentSound: AmbientSoundType;
  volume: number;
  isEnabled: boolean;
  soundEffectsEnabled: boolean;
  theme: ReadingTheme;
  onSoundChange: (sound: AmbientSoundType) => void;
  onVolumeChange: (volume: number) => void;
  onToggle: () => void;
  onSoundEffectsToggle: () => void;
}> = ({
  isOpen,
  onClose,
  currentSound,
  volume,
  isEnabled,
  soundEffectsEnabled,
  theme,
  onSoundChange,
  onVolumeChange,
  onToggle,
  onSoundEffectsToggle,
}) => {
  const themeConfig = READING_THEMES[theme];

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="fixed top-20 right-4 z-50 w-80 rounded-2xl overflow-hidden"
      style={{
        background: themeConfig.pageBackground,
        boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.4)',
        border: `1px solid ${themeConfig.accentColor}20`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: `${themeConfig.accentColor}20` }}
      >
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4" style={{ color: themeConfig.accentColor }} />
          <span className="font-medium text-sm" style={{ color: themeConfig.textColor }}>
            Ambient Sounds
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
          style={{ color: themeConfig.textColor }}
        >
          ✕
        </button>
      </div>

      {/* Sound Grid */}
      <div className="p-4 grid grid-cols-3 gap-2">
        {AMBIENT_SOUNDS.map((sound) => (
          <button
            key={sound.id}
            onClick={() => {
              if (currentSound === sound.id && isEnabled) {
                onToggle();
              } else {
                onSoundChange(sound.id);
                if (!isEnabled) onToggle();
              }
            }}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
              currentSound === sound.id && isEnabled ? 'ring-2' : ''
            }`}
            style={{
              background:
                currentSound === sound.id && isEnabled
                  ? `${themeConfig.accentColor}20`
                  : `${themeConfig.textColor}08`,
              ringColor: themeConfig.accentColor,
            }}
          >
            <span className="text-2xl">{sound.icon}</span>
            <span
              className="text-xs font-medium"
              style={{ color: themeConfig.textColor }}
            >
              {sound.name}
            </span>
            {currentSound === sound.id && isEnabled && (
              <motion.div
                className="w-2 h-2 rounded-full"
                style={{ background: themeConfig.accentColor }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Volume Control */}
      {isEnabled && currentSound && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3">
            <VolumeX className="w-4 h-4" style={{ color: `${themeConfig.textColor}60` }} />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${themeConfig.accentColor} 0%, ${themeConfig.accentColor} ${volume * 100}%, ${themeConfig.textColor}20 ${volume * 100}%, ${themeConfig.textColor}20 100%)`,
              }}
            />
            <Volume2 className="w-4 h-4" style={{ color: themeConfig.accentColor }} />
          </div>
          <p
            className="text-xs text-center mt-1"
            style={{ color: `${themeConfig.textColor}60` }}
          >
            {Math.round(volume * 100)}%
          </p>
        </div>
      )}

      {/* Page Turn Toggle */}
      <div
        className="px-4 py-3 border-t flex items-center justify-between"
        style={{ borderColor: `${themeConfig.accentColor}20` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">📄</span>
          <span className="text-xs" style={{ color: themeConfig.textColor }}>
            Page flip sound
          </span>
        </div>
        <button
          onClick={onSoundEffectsToggle}
          className="relative w-10 h-6 rounded-full transition-colors"
          style={{
            background: soundEffectsEnabled
              ? themeConfig.accentColor
              : `${themeConfig.textColor}30`,
          }}
        >
          <motion.div
            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
            animate={{ left: soundEffectsEnabled ? '22px' : '4px' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          />
        </button>
      </div>
    </motion.div>
  );
};

// Traditional Reader View Component
const TraditionalReaderView: React.FC<{
  content: string[];
  pageNumber: number;
  totalPages: number;
  chapterTitle: string;
  theme: ReadingTheme;
  fontSize: FontSize;
}> = ({ content, pageNumber, totalPages, chapterTitle, theme, fontSize }) => {
  const themeConfig = READING_THEMES[theme];
  const fontConfig = {
    sm: { size: 'text-base', leading: 'leading-relaxed' },
    base: { size: 'text-lg', leading: 'leading-relaxed' },
    lg: { size: 'text-xl', leading: 'leading-loose' },
    xl: { size: 'text-2xl', leading: 'leading-loose' },
  };
  const config = fontConfig[fontSize];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto px-8"
    >
      {/* Chapter header */}
      {pageNumber <= 2 && (
        <div
          className="text-center mb-10 pb-6 border-b"
          style={{ borderColor: `${themeConfig.accentColor}30` }}
        >
          <span
            className="text-sm uppercase tracking-[0.3em] font-medium"
            style={{ color: themeConfig.accentColor }}
          >
            {chapterTitle}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="space-y-6">
        {content.map((paragraph, index) => (
          <p
            key={index}
            className={`${config.size} ${config.leading} text-justify`}
            style={{
              color: themeConfig.textColor,
              fontFamily: '"EB Garamond", "Crimson Pro", Georgia, serif',
              textIndent: index > 0 ? '2.5em' : '0',
            }}
          >
            {paragraph}
          </p>
        ))}
      </div>

      {/* Page indicator */}
      <div
        className="text-center mt-10 text-sm"
        style={{ color: `${themeConfig.textColor}60` }}
      >
        Page {pageNumber} of {totalPages}
      </div>
    </motion.div>
  );
};

export const ImmersiveReader: React.FC<ImmersiveReaderProps> = ({
  bookId,
  bookTitle,
  author,
  coverUrl,
  chapters,
  initialChapterIndex = 0,
  initialPage = 0,
  onClose,
}) => {
  // Core reading state
  const [currentChapter, setCurrentChapter] = useState(initialChapterIndex);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [theme, setTheme] = useState<ReadingTheme>('day');
  const [fontSize, setFontSize] = useState<FontSize>('base');
  const [readerMode, setReaderMode] = useState<ReaderMode>('3d');

  // Sound settings
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>(null);
  const [ambientVolume, setAmbientVolume] = useState(0.3);
  const [ambientEnabled, setAmbientEnabled] = useState(false);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);

  // UI state
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'forward' | 'backward'>('forward');
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showSoundPanel, setShowSoundPanel] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Use ambient audio hook
  useAmbientAudio(ambientSound, ambientVolume, ambientEnabled);

  // Page turn sound effect
  const { playPageTurn } = usePageTurnSound(soundEffectsEnabled, 0.4);

  // Mobile detection
  const isMobile = useIsMobile();

  // Paginate book content - using useMemo for instant calculation (no loading delay)
  const { chapterPages, totalBookPages, chapterStartPages } = useMemo(() => {
    return paginateBook(chapters, fontSize);
  }, [chapters, fontSize]);

  // Get current spread pages
  const { leftPage, rightPage, leftPageNumber, rightPageNumber, totalPagesInChapter } = useMemo(() => {
    return getSpreadPages(chapterPages, currentChapter, currentPage);
  }, [chapterPages, currentChapter, currentPage]);

  // Calculate absolute page number for progress
  const absolutePageNumber = useMemo(() => {
    const pagesBeforeCurrentChapter = chapterStartPages[currentChapter] || 0;
    return pagesBeforeCurrentChapter + currentPage + 1;
  }, [chapterStartPages, currentChapter, currentPage]);

  // Current chapter data
  const currentChapterData = chapters[currentChapter];
  const themeConfig = READING_THEMES[theme];

  // Load saved state on mount - instant load without artificial delay
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const saved = loadReadingState(bookId);
    if (saved) {
      if (saved.currentChapter !== undefined) setCurrentChapter(saved.currentChapter);
      if (saved.currentPage !== undefined) setCurrentPage(saved.currentPage);
      if (saved.theme) setTheme(saved.theme);
      if (saved.fontSize) setFontSize(saved.fontSize);
      if (saved.ambientSound !== undefined) setAmbientSound(saved.ambientSound);
      if (saved.ambientVolume !== undefined) setAmbientVolume(saved.ambientVolume);
      if (saved.soundEffectsEnabled !== undefined) setSoundEffectsEnabled(saved.soundEffectsEnabled);
      if (saved.readerMode) setReaderMode(saved.readerMode);
    }
  }, [bookId]);

  // Save state when it changes
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    saveReadingState(bookId, {
      currentChapter,
      currentPage,
      theme,
      fontSize,
      ambientSound,
      ambientVolume,
      soundEffectsEnabled,
      readerMode,
    });
  }, [bookId, currentChapter, currentPage, theme, fontSize, ambientSound, ambientVolume, soundEffectsEnabled, readerMode]);

  // Navigation functions
  const goToNextPage = useCallback(() => {
    if (isFlipping) return;

    const newPage = currentPage + 2;

    if (newPage < totalPagesInChapter) {
      setFlipDirection('forward');
      setIsFlipping(true);
      playPageTurn();

      setTimeout(() => {
        setCurrentPage(newPage);
        setIsFlipping(false);
      }, 450); // Faster flip
    } else if (currentChapter < chapters.length - 1) {
      setFlipDirection('forward');
      setIsFlipping(true);
      playPageTurn();

      setTimeout(() => {
        setCurrentChapter(currentChapter + 1);
        setCurrentPage(0);
        setIsFlipping(false);
      }, 450);
    }
  }, [currentPage, totalPagesInChapter, currentChapter, chapters.length, isFlipping, playPageTurn]);

  const goToPrevPage = useCallback(() => {
    if (isFlipping) return;

    const newPage = currentPage - 2;

    if (newPage >= 0) {
      setFlipDirection('backward');
      setIsFlipping(true);
      playPageTurn();

      setTimeout(() => {
        setCurrentPage(newPage);
        setIsFlipping(false);
      }, 450);
    } else if (currentChapter > 0) {
      setFlipDirection('backward');
      setIsFlipping(true);
      playPageTurn();

      setTimeout(() => {
        const prevChapterPages = chapterPages[currentChapter - 1]?.totalPages || 0;
        const lastPage = prevChapterPages > 1 ? (prevChapterPages - 1) - ((prevChapterPages - 1) % 2) : 0;
        setCurrentChapter(currentChapter - 1);
        setCurrentPage(lastPage);
        setIsFlipping(false);
      }, 450);
    }
  }, [currentPage, currentChapter, isFlipping, chapterPages, playPageTurn]);

  const goToChapter = useCallback(
    (index: number) => {
      if (index >= 0 && index < chapters.length) {
        setCurrentChapter(index);
        setCurrentPage(0);
      }
    },
    [chapters.length]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showThemeSelector || showSoundPanel || showTOC) return;

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
          e.preventDefault();
          goToNextPage();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          goToPrevPage();
          break;
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen?.();
          } else {
            onClose?.();
          }
          break;
        case 't':
        case 'T':
          setShowThemeSelector((prev) => !prev);
          break;
        case 'c':
        case 'C':
          setShowTOC((prev) => !prev);
          break;
        case 's':
        case 'S':
          setShowSoundPanel((prev) => !prev);
          break;
        case 'm':
        case 'M':
          setReaderMode((prev) => (prev === '3d' ? 'traditional' : '3d'));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextPage, goToPrevPage, showThemeSelector, showSoundPanel, showTOC, isFullscreen, onClose]);

  // Fullscreen handling
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Check navigation ability
  const canGoNext = currentPage + 2 < totalPagesInChapter || currentChapter < chapters.length - 1;
  const canGoPrev = currentPage > 0 || currentChapter > 0;

  // Calculate pages per chapter for TOC
  const pagesPerChapter = chapterPages.map((cp) => cp.totalPages);

  // Get current ambient sound info
  const currentSoundInfo = AMBIENT_SOUNDS.find((s) => s.id === ambientSound);

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background gradient */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${themeConfig.background}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Ambient pattern overlay */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(${themeConfig.textColor}20 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
        }}
      />

      {/* Header with book title and controls */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="absolute top-0 left-0 right-0 z-30 p-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg" style={{ color: themeConfig.textColor }}>
              {bookTitle}
            </h1>
            <p className="text-sm" style={{ color: `${themeConfig.textColor}70` }}>
              by {author}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Reader Mode Toggle */}
            <div
              className="flex items-center rounded-full p-1"
              style={{ background: `${themeConfig.textColor}10` }}
            >
              <button
                onClick={() => setReaderMode('3d')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  readerMode === '3d' ? 'shadow-sm' : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  background: readerMode === '3d' ? themeConfig.accentColor : 'transparent',
                  color: readerMode === '3d' ? '#fff' : themeConfig.textColor,
                }}
              >
                <Layers3 className="w-4 h-4" />
                <span className="hidden sm:inline">3D Book</span>
              </button>
              <button
                onClick={() => setReaderMode('traditional')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  readerMode === 'traditional' ? 'shadow-sm' : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  background: readerMode === 'traditional' ? themeConfig.accentColor : 'transparent',
                  color: readerMode === 'traditional' ? '#fff' : themeConfig.textColor,
                }}
              >
                <Book className="w-4 h-4" />
                <span className="hidden sm:inline">Classic</span>
              </button>
            </div>

            {/* Sound Panel Toggle - Easy Access */}
            <button
              onClick={() => setShowSoundPanel(!showSoundPanel)}
              className="relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:scale-105"
              style={{
                background: ambientEnabled ? `${themeConfig.accentColor}20` : `${themeConfig.textColor}10`,
                color: ambientEnabled ? themeConfig.accentColor : themeConfig.textColor,
              }}
              title="Ambient Sounds (S)"
            >
              <Music className="w-5 h-5" />
              {ambientEnabled && currentSoundInfo && (
                <>
                  <span className="text-sm hidden sm:inline">{currentSoundInfo.name}</span>
                  <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                    style={{ background: themeConfig.accentColor }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                </>
              )}
            </button>

            {/* Current chapter badge */}
            <div
              className="px-4 py-2 rounded-full text-sm font-medium hidden md:block"
              style={{
                background: `${themeConfig.accentColor}20`,
                color: themeConfig.accentColor,
              }}
            >
              Chapter {currentChapterData?.number}: {currentChapterData?.title}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating Sound Panel */}
      <AnimatePresence>
        {showSoundPanel && (
          <FloatingSoundPanel
            isOpen={showSoundPanel}
            onClose={() => setShowSoundPanel(false)}
            currentSound={ambientSound}
            volume={ambientVolume}
            isEnabled={ambientEnabled}
            soundEffectsEnabled={soundEffectsEnabled}
            theme={theme}
            onSoundChange={setAmbientSound}
            onVolumeChange={setAmbientVolume}
            onToggle={() => setAmbientEnabled((prev) => !prev)}
            onSoundEffectsToggle={() => setSoundEffectsEnabled((prev) => !prev)}
          />
        )}
      </AnimatePresence>

      {/* Main book area */}
      <div className="absolute inset-0 flex items-center justify-center pt-20 pb-24 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentChapter}-${currentPage}-${readerMode}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {isMobile ? (
              <MobilePageView
                content={rightPage.length > 0 ? rightPage : leftPage}
                pageNumber={currentPage + 1}
                totalPages={totalPagesInChapter}
                chapterTitle={currentChapterData?.title || ''}
                chapterNumber={currentChapterData?.number || 1}
                theme={theme}
                fontSize={fontSize}
                onNextPage={goToNextPage}
                onPrevPage={goToPrevPage}
                canGoNext={canGoNext}
                canGoPrev={canGoPrev}
                isFlipping={isFlipping}
                flipDirection={flipDirection}
              />
            ) : readerMode === '3d' ? (
              <Book3D
                leftPageContent={leftPage}
                rightPageContent={rightPage}
                leftPageNumber={leftPageNumber}
                rightPageNumber={rightPageNumber}
                totalPages={totalPagesInChapter}
                chapterTitle={`Chapter ${currentChapterData?.number}: ${currentChapterData?.title}`}
                theme={theme}
                fontSize={fontSize}
                isFlipping={isFlipping}
                flipDirection={flipDirection}
                onFlipComplete={() => setIsFlipping(false)}
                onPageClick={(direction) => {
                  if (direction === 'next') goToNextPage();
                  else goToPrevPage();
                }}
              />
            ) : (
              <TraditionalReaderView
                content={[...leftPage, ...rightPage]}
                pageNumber={leftPageNumber}
                totalPages={totalPagesInChapter}
                chapterTitle={`Chapter ${currentChapterData?.number}: ${currentChapterData?.title}`}
                theme={theme}
                fontSize={fontSize}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Minimal floating navigation */}
      <MinimalControls
        theme={theme}
        onPrev={goToPrevPage}
        onNext={goToNextPage}
        canPrev={canGoPrev}
        canNext={canGoNext}
      />

      {/* Bottom controls */}
      <ReadingControls
        currentPage={absolutePageNumber}
        totalPages={totalBookPages}
        currentChapter={currentChapter}
        totalChapters={chapters.length}
        chapterTitle={currentChapterData?.title || ''}
        theme={theme}
        fontSize={fontSize}
        ambientSound={ambientSound}
        ambientVolume={ambientVolume}
        soundEffectsEnabled={soundEffectsEnabled}
        onThemeChange={setTheme}
        onFontSizeChange={setFontSize}
        onAmbientSoundChange={setAmbientSound}
        onAmbientVolumeChange={setAmbientVolume}
        onSoundEffectsToggle={() => setSoundEffectsEnabled((prev) => !prev)}
        onOpenTOC={() => setShowTOC(true)}
        onClose={() => onClose?.()}
        onPrevPage={goToPrevPage}
        onNextPage={goToNextPage}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Theme Selector Modal */}
      <ThemeSelector
        currentTheme={theme}
        onSelect={(t) => {
          setTheme(t);
          setShowThemeSelector(false);
        }}
        isOpen={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
        currentFontSize={fontSize}
        onFontSizeChange={setFontSize}
      />

      {/* Ambient Sound Manager Modal (legacy, kept for compatibility) */}
      <AmbientSoundManager
        currentSound={ambientSound}
        volume={ambientVolume}
        isEnabled={ambientEnabled}
        soundEffectsEnabled={soundEffectsEnabled}
        theme={theme}
        onSoundChange={setAmbientSound}
        onVolumeChange={setAmbientVolume}
        onToggle={() => setAmbientEnabled((prev) => !prev)}
        onSoundEffectsToggle={() => setSoundEffectsEnabled((prev) => !prev)}
        isOpen={false}
        onClose={() => {}}
      />

      {/* Table of Contents */}
      <TableOfContents
        chapters={chapters}
        currentChapter={currentChapter}
        onSelectChapter={goToChapter}
        isOpen={showTOC}
        onClose={() => setShowTOC(false)}
        theme={theme}
        bookTitle={bookTitle}
        author={author}
        currentPageInChapter={currentPage + 1}
        pagesPerChapter={pagesPerChapter}
      />

      {/* Keyboard shortcuts hint (shows briefly on load) */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.8 }}
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-30"
        >
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 5, duration: 1 }}
            className="flex items-center gap-4 px-4 py-2 rounded-full text-xs"
            style={{
              background: `${themeConfig.pageBackground}e0`,
              color: `${themeConfig.textColor}80`,
              boxShadow: `0 4px 20px ${themeConfig.shadowColor}`,
            }}
          >
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-current/10">←</kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-current/10">→</kbd> Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-current/10">S</kbd> Sounds
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-current/10">M</kbd> Mode
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-current/10">C</kbd> Contents
            </span>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default ImmersiveReader;
