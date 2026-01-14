'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Settings2,
  Play,
  Pause,
  Headphones,
  RefreshCw
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

// Playback rate options
const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

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
  // Audio props
  audioUrl,
  isPlaying,
  onPlayPause,
  playbackRate,
  onPlaybackRateChange,
  audioProgress,
  onSeek,
  isSyncEnabled,
  onToggleSync,
  hasAudio,
  // Timestamp sync props
  hasTimestamps,
  isGeneratingTimestamps,
  onGenerateTimestamps,
}) => {
  const themeConfig = READING_THEMES[theme];
  const [showSettingsHint, setShowSettingsHint] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Calculate overall progress
  const progressPercent = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
  
  // Get current ambient sound info
  const currentSoundInfo = AMBIENT_SOUNDS.find(s => s.id === ambientSound);

  // Format playback rate for display
  const formatRate = (rate: number) => rate === 1 ? '1x' : `${rate}x`;

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

          {/* Center section - Current position + Audio controls */}
          <div 
            className="flex flex-col items-center gap-2"
            style={{ color: themeConfig.textColor }}
          >
            {/* Audio controls - Only show if chapter has audio */}
            {hasAudio && (
              <div className="flex items-center gap-3">
                {/* Play/Pause button */}
                <motion.button
                  onClick={onPlayPause}
                  className="flex items-center justify-center w-10 h-10 rounded-full transition-all"
                  style={{
                    background: isPlaying ? themeConfig.accentColor : `${themeConfig.accentColor}20`,
                    color: isPlaying ? '#fff' : themeConfig.accentColor,
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  title={isPlaying ? 'Pause (P)' : 'Play (P)'}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </motion.button>

                {/* Audio progress bar */}
                <div className="hidden sm:flex items-center gap-2 w-32">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={audioProgress}
                    onChange={(e) => onSeek(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${themeConfig.accentColor} 0%, ${themeConfig.accentColor} ${audioProgress * 100}%, ${themeConfig.textColor}20 ${audioProgress * 100}%, ${themeConfig.textColor}20 100%)`,
                    }}
                    title="Seek"
                  />
                </div>

                {/* Playback speed */}
                <div className="relative">
                  <button
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: `${themeConfig.textColor}10`,
                      color: themeConfig.textColor,
                    }}
                    title="Playback speed"
                  >
                    {formatRate(playbackRate)}
                  </button>

                  <AnimatePresence>
                    {showSpeedMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 rounded-xl shadow-lg"
                        style={{
                          background: themeConfig.pageBackground,
                          border: `1px solid ${themeConfig.accentColor}20`,
                        }}
                      >
                        <div className="flex flex-col gap-1">
                          {PLAYBACK_RATES.map((rate) => (
                            <button
                              key={rate}
                              onClick={() => {
                                onPlaybackRateChange(rate);
                                setShowSpeedMenu(false);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                playbackRate === rate ? 'ring-1' : ''
                              }`}
                              style={{
                                background: playbackRate === rate 
                                  ? `${themeConfig.accentColor}20` 
                                  : 'transparent',
                                color: themeConfig.textColor,
                                '--tw-ring-color': themeConfig.accentColor,
                              } as React.CSSProperties}
                            >
                              {formatRate(rate)}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Sync toggle / Generate timestamps button */}
                {isGeneratingTimestamps ? (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      background: `${themeConfig.accentColor}20`,
                      color: themeConfig.accentColor,
                    }}
                  >
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Syncing...</span>
                  </div>
                ) : hasTimestamps ? (
                  <button
                    onClick={onToggleSync}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: isSyncEnabled 
                        ? `${themeConfig.accentColor}20` 
                        : `${themeConfig.textColor}10`,
                      color: isSyncEnabled 
                        ? themeConfig.accentColor 
                        : themeConfig.textColor,
                    }}
                    title={isSyncEnabled ? 'Text sync enabled - click to disable' : 'Text sync disabled - click to enable'}
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncEnabled ? 'animate-pulse' : ''}`} />
                    <span className="hidden sm:inline">Sync</span>
                  </button>
                ) : (
                  <button
                    onClick={onGenerateTimestamps}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                    style={{
                      background: `${themeConfig.accentColor}30`,
                      color: themeConfig.accentColor,
                      border: `1px dashed ${themeConfig.accentColor}50`,
                    }}
                    title="Generate timestamps to sync text with audio"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span className="hidden sm:inline">Sync Text</span>
                  </button>
                )}
              </div>
            )}

            {/* Page info */}
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 opacity-60" />
              <span className="text-sm font-medium">
                Chapter {currentChapter + 1}
                <span className="opacity-60 mx-1">·</span>
                <span className="hidden sm:inline">{chapterTitle}</span>
              </span>
            </div>
            <div 
              className="text-xs"
              style={{ color: `${themeConfig.textColor}70` }}
            >
              Page {currentPage} of {totalPages}
              <span className="mx-2">•</span>
              {Math.round(progressPercent)}% complete
              {hasAudio && (
                <>
                  <span className="mx-2">•</span>
                  <Headphones className="w-3 h-3 inline-block" /> Audio available
                </>
              )}
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
