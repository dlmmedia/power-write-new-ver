'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  List, 
  Palette, 
  Volume2, 
  VolumeX, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Maximize2,
  Minimize2,
  BookOpen,
  Settings2
} from 'lucide-react';
import { 
  ReadingControlsProps, 
  ReadingTheme, 
  FontSize, 
  AmbientSoundType, 
  READING_THEMES,
  AMBIENT_SOUNDS
} from './types';

interface ExtendedReadingControlsProps extends ReadingControlsProps {
  onPrevPage: () => void;
  onNextPage: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const ReadingControls: React.FC<ExtendedReadingControlsProps> = ({
  currentPage,
  totalPages,
  currentChapter,
  totalChapters,
  chapterTitle,
  theme,
  fontSize,
  ambientSound,
  ambientVolume,
  soundEffectsEnabled,
  onThemeChange,
  onFontSizeChange,
  onAmbientSoundChange,
  onAmbientVolumeChange,
  onSoundEffectsToggle,
  onOpenTOC,
  onClose,
  onPrevPage,
  onNextPage,
  canGoPrev,
  canGoNext,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const themeConfig = READING_THEMES[theme];
  const [showSettingsHint, setShowSettingsHint] = useState(false);

  // Calculate overall progress
  const progressPercent = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
  
  // Get current ambient sound info
  const currentSoundInfo = AMBIENT_SOUNDS.find(s => s.id === ambientSound);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed bottom-0 left-0 right-0 z-40"
    >
      {/* Glass effect background */}
      <div 
        className="absolute inset-0 backdrop-blur-xl"
        style={{
          background: `linear-gradient(to top, ${themeConfig.pageBackground}f0, ${themeConfig.pageBackground}d0)`,
          borderTop: `1px solid ${themeConfig.accentColor}30`,
        }}
      />

      {/* Progress bar */}
      <div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `${themeConfig.textColor}10` }}
      >
        <motion.div
          className="h-full"
          style={{ background: themeConfig.accentColor }}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="relative px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Left section - Navigation */}
          <div className="flex items-center gap-2">
            {/* Table of Contents */}
            <button
              onClick={onOpenTOC}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:scale-105"
              style={{
                background: `${themeConfig.accentColor}15`,
                color: themeConfig.textColor,
              }}
              title="Table of Contents"
            >
              <List className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Contents</span>
            </button>

            {/* Chapter nav buttons */}
            <button
              onClick={onPrevPage}
              disabled={!canGoPrev}
              className="p-2.5 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
              style={{
                background: `${themeConfig.textColor}10`,
                color: themeConfig.textColor,
              }}
              title="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <button
              onClick={onNextPage}
              disabled={!canGoNext}
              className="p-2.5 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
              style={{
                background: `${themeConfig.textColor}10`,
                color: themeConfig.textColor,
              }}
              title="Next page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Center section - Current position */}
          <div 
            className="flex flex-col items-center"
            style={{ color: themeConfig.textColor }}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 opacity-60" />
              <span className="text-sm font-medium">
                Chapter {currentChapter + 1}
                <span className="opacity-60 mx-1">·</span>
                <span className="hidden sm:inline">{chapterTitle}</span>
              </span>
            </div>
            <div 
              className="text-xs mt-1"
              style={{ color: `${themeConfig.textColor}70` }}
            >
              Page {currentPage} of {totalPages}
              <span className="mx-2">•</span>
              {Math.round(progressPercent)}% complete
            </div>
          </div>

          {/* Right section - Settings */}
          <div className="flex items-center gap-2">
            {/* Ambient sound indicator */}
            {ambientSound && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{
                  background: `${themeConfig.accentColor}20`,
                  color: themeConfig.accentColor,
                }}
              >
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {currentSoundInfo?.icon}
                </motion.span>
                <span className="text-xs font-medium">{currentSoundInfo?.name}</span>
              </motion.div>
            )}

            {/* Sound toggle (quick access) */}
            <button
              onClick={onSoundEffectsToggle}
              className="p-2.5 rounded-xl transition-all hover:scale-105"
              style={{
                background: soundEffectsEnabled 
                  ? `${themeConfig.accentColor}20` 
                  : `${themeConfig.textColor}10`,
                color: soundEffectsEnabled 
                  ? themeConfig.accentColor 
                  : themeConfig.textColor,
              }}
              title={soundEffectsEnabled ? 'Sound effects on' : 'Sound effects off'}
            >
              {soundEffectsEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>

            {/* Theme indicator */}
            <button
              onClick={() => onThemeChange(
                theme === 'day' ? 'night' : 
                theme === 'night' ? 'sepia' : 
                theme === 'sepia' ? 'focus' : 'day'
              )}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all hover:scale-105"
              style={{
                background: `${themeConfig.textColor}10`,
                color: themeConfig.textColor,
              }}
              title="Change theme"
            >
              <span className="text-lg">{themeConfig.icon}</span>
              <span className="text-sm font-medium hidden sm:inline">{themeConfig.name}</span>
            </button>

            {/* Fullscreen toggle */}
            <button
              onClick={onToggleFullscreen}
              className="p-2.5 rounded-xl transition-all hover:scale-105"
              style={{
                background: `${themeConfig.textColor}10`,
                color: themeConfig.textColor,
              }}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl transition-all hover:scale-105"
              style={{
                background: `${themeConfig.accentColor}20`,
                color: themeConfig.accentColor,
              }}
              title="Close reader"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Minimal floating controls for cleaner reading
export const MinimalControls: React.FC<{
  theme: ReadingTheme;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}> = ({ theme, onPrev, onNext, canPrev, canNext }) => {
  const themeConfig = READING_THEMES[theme];

  return (
    <>
      {/* Left navigation zone */}
      <motion.button
        onClick={onPrev}
        disabled={!canPrev}
        className="fixed left-4 top-1/2 -translate-y-1/2 p-4 rounded-full opacity-0 hover:opacity-100 transition-opacity disabled:hidden z-30"
        style={{
          background: `${themeConfig.pageBackground}e0`,
          color: themeConfig.accentColor,
          boxShadow: `0 4px 20px ${themeConfig.shadowColor}`,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronLeft className="w-6 h-6" />
      </motion.button>

      {/* Right navigation zone */}
      <motion.button
        onClick={onNext}
        disabled={!canNext}
        className="fixed right-4 top-1/2 -translate-y-1/2 p-4 rounded-full opacity-0 hover:opacity-100 transition-opacity disabled:hidden z-30"
        style={{
          background: `${themeConfig.pageBackground}e0`,
          color: themeConfig.accentColor,
          boxShadow: `0 4px 20px ${themeConfig.shadowColor}`,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronRight className="w-6 h-6" />
      </motion.button>
    </>
  );
};

export default ReadingControls;
