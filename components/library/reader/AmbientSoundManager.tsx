'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, X, Flame, CloudRain, BookOpen } from 'lucide-react';
import { AmbientSoundType, AMBIENT_SOUNDS, PAGE_TURN_SOUND, READING_THEMES, ReadingTheme } from './types';

interface AmbientSoundManagerProps {
  currentSound: AmbientSoundType;
  volume: number;
  isEnabled: boolean;
  soundEffectsEnabled: boolean;
  theme: ReadingTheme;
  onSoundChange: (sound: AmbientSoundType) => void;
  onVolumeChange: (volume: number) => void;
  onToggle: () => void;
  onSoundEffectsToggle: () => void;
  isOpen: boolean;
  onClose: () => void;
}

// Hook to manage ambient audio playback
export function useAmbientAudio(
  currentSound: AmbientSoundType,
  volume: number,
  isEnabled: boolean
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!currentSound || !isEnabled) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    const soundConfig = AMBIENT_SOUNDS.find(s => s.id === currentSound);
    if (!soundConfig) return;

    // Create or update audio element
    if (!audioRef.current || audioRef.current.src !== soundConfig.file) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      setIsLoading(true);
      const audio = new Audio(soundConfig.file);
      audio.loop = true;
      audio.volume = volume;
      
      audio.addEventListener('canplay', () => {
        setIsLoading(false);
        audio.play().catch(console.error);
      });
      
      audio.addEventListener('error', () => {
        setIsLoading(false);
        console.error('Failed to load ambient sound:', soundConfig.file);
      });

      audioRef.current = audio;
    } else {
      audioRef.current.volume = volume;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [currentSound, isEnabled]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  return { isLoading };
}

// Hook to play page turn sound effect
export function usePageTurnSound(enabled: boolean, volume: number = 0.5) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playPageTurn = useCallback(() => {
    if (!enabled) return;

    try {
      // Create a new audio instance each time for overlapping sounds
      const audio = new Audio(PAGE_TURN_SOUND);
      audio.volume = volume;
      audio.play().catch(() => {
        // Silently fail if audio can't play (e.g., no user interaction yet)
      });
    } catch (error) {
      console.error('Failed to play page turn sound:', error);
    }
  }, [enabled, volume]);

  return { playPageTurn };
}

// Sound icon based on type
const SoundIcon: React.FC<{ type: AmbientSoundType; className?: string }> = ({ type, className }) => {
  switch (type) {
    case 'fireplace':
      return <Flame className={className} />;
    case 'rain':
      return <CloudRain className={className} />;
    case 'library':
      return <BookOpen className={className} />;
    default:
      return <Volume2 className={className} />;
  }
};

export const AmbientSoundManager: React.FC<AmbientSoundManagerProps> = ({
  currentSound,
  volume,
  isEnabled,
  soundEffectsEnabled,
  theme,
  onSoundChange,
  onVolumeChange,
  onToggle,
  onSoundEffectsToggle,
  isOpen,
  onClose,
}) => {
  const themeConfig = READING_THEMES[theme];
  const { isLoading } = useAmbientAudio(currentSound, volume, isEnabled);

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
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[380px] max-w-[90vw] rounded-2xl overflow-hidden"
            style={{
              background: themeConfig.pageBackground,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: `${themeConfig.accentColor}30` }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${themeConfig.accentColor}20` }}
                >
                  <Volume2 className="w-5 h-5" style={{ color: themeConfig.accentColor }} />
                </div>
                <div>
                  <h3 
                    className="font-semibold"
                    style={{ color: themeConfig.textColor }}
                  >
                    Sound Settings
                  </h3>
                  <p 
                    className="text-xs"
                    style={{ color: `${themeConfig.textColor}80` }}
                  >
                    Ambient sounds & effects
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors hover:bg-black/10"
                style={{ color: themeConfig.textColor }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Page Turn Sound Effects */}
              <div 
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: `${themeConfig.textColor}08` }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📄</span>
                  <div>
                    <p 
                      className="font-medium text-sm"
                      style={{ color: themeConfig.textColor }}
                    >
                      Page Turn Sound
                    </p>
                    <p 
                      className="text-xs"
                      style={{ color: `${themeConfig.textColor}70` }}
                    >
                      Play sound when flipping pages
                    </p>
                  </div>
                </div>
                <button
                  onClick={onSoundEffectsToggle}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    soundEffectsEnabled ? '' : 'opacity-50'
                  }`}
                  style={{ 
                    background: soundEffectsEnabled 
                      ? themeConfig.accentColor 
                      : `${themeConfig.textColor}30`,
                  }}
                >
                  <motion.div
                    className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm"
                    animate={{ left: soundEffectsEnabled ? '26px' : '4px' }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  />
                </button>
              </div>

              {/* Ambient Sound Selection */}
              <div>
                <label 
                  className="block text-sm font-medium mb-3"
                  style={{ color: `${themeConfig.textColor}cc` }}
                >
                  Ambient Sound
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {AMBIENT_SOUNDS.map((sound) => (
                    <button
                      key={sound.id}
                      onClick={() => {
                        if (currentSound === sound.id && isEnabled) {
                          onToggle(); // Turn off if clicking current sound
                        } else {
                          onSoundChange(sound.id);
                          if (!isEnabled) onToggle();
                        }
                      }}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        currentSound === sound.id && isEnabled
                          ? 'border-current'
                          : 'border-transparent hover:border-current/30'
                      }`}
                      style={{
                        background: currentSound === sound.id && isEnabled
                          ? `${themeConfig.accentColor}15`
                          : `${themeConfig.textColor}05`,
                        color: themeConfig.accentColor,
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
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: themeConfig.accentColor }}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume Control */}
              {isEnabled && currentSound && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label 
                    className="block text-sm font-medium mb-3"
                    style={{ color: `${themeConfig.textColor}cc` }}
                  >
                    Volume
                  </label>
                  <div className="flex items-center gap-4">
                    <VolumeX 
                      className="w-5 h-5 flex-shrink-0"
                      style={{ color: `${themeConfig.textColor}60` }}
                    />
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
                    <Volume2 
                      className="w-5 h-5 flex-shrink-0"
                      style={{ color: themeConfig.accentColor }}
                    />
                  </div>
                  <p 
                    className="text-xs text-center mt-2"
                    style={{ color: `${themeConfig.textColor}60` }}
                  >
                    {Math.round(volume * 100)}%
                  </p>
                </motion.div>
              )}

              {/* Turn Off Button */}
              {isEnabled && currentSound && (
                <button
                  onClick={onToggle}
                  className="w-full py-3 rounded-xl border transition-colors"
                  style={{
                    borderColor: `${themeConfig.textColor}20`,
                    color: themeConfig.textColor,
                  }}
                >
                  Turn Off Ambient Sound
                </button>
              )}

              {/* Loading indicator */}
              {isLoading && (
                <div 
                  className="text-center text-sm py-2"
                  style={{ color: `${themeConfig.textColor}60` }}
                >
                  Loading sound...
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AmbientSoundManager;
