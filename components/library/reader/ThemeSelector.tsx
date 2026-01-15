'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ReadingTheme, ThemeSelectorProps, READING_THEMES, FontSize, FONT_SIZE_CONFIG } from './types';

interface ExtendedThemeSelectorProps extends ThemeSelectorProps {
  currentFontSize: FontSize;
  onFontSizeChange: (size: FontSize) => void;
}

export const ThemeSelector: React.FC<ExtendedThemeSelectorProps> = ({
  currentTheme,
  onSelect,
  isOpen,
  onClose,
  currentFontSize,
  onFontSizeChange,
}) => {
  const themes = Object.entries(READING_THEMES) as [ReadingTheme, typeof READING_THEMES[ReadingTheme]][];
  const fontSizes: { size: FontSize; label: string }[] = [
    { size: 'xs', label: 'XS' },
    { size: 'sm', label: 'Small' },
    { size: 'base', label: 'Medium' },
    { size: 'lg', label: 'Large' },
    { size: 'xl', label: 'Extra Large' },
    { size: 'xxl', label: 'XXL' },
  ];

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
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[400px] max-w-[90vw] rounded-2xl overflow-hidden"
            style={{
              background: READING_THEMES[currentTheme].pageBackground,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: `${READING_THEMES[currentTheme].accentColor}30` }}
            >
              <h3 
                className="font-semibold text-lg"
                style={{ color: READING_THEMES[currentTheme].textColor }}
              >
                Reading Settings
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                style={{ color: READING_THEMES[currentTheme].textColor }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Theme Selection */}
              <div>
                <label 
                  className="block text-sm font-medium mb-3"
                  style={{ color: `${READING_THEMES[currentTheme].textColor}cc` }}
                >
                  Reading Theme
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {themes.map(([id, config]) => (
                    <button
                      key={id}
                      onClick={() => onSelect(id)}
                      className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        currentTheme === id 
                          ? 'border-current scale-105' 
                          : 'border-transparent hover:border-current/30'
                      }`}
                      style={{
                        background: config.pageBackground,
                        color: config.accentColor,
                      }}
                    >
                      <span className="text-2xl">{config.icon}</span>
                      <span 
                        className="text-xs font-medium"
                        style={{ color: config.textColor }}
                      >
                        {config.name}
                      </span>
                      {currentTheme === id && (
                        <motion.div
                          layoutId="theme-indicator"
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                          style={{ background: config.accentColor, color: config.pageBackground }}
                        >
                          ✓
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label 
                  className="block text-sm font-medium mb-3"
                  style={{ color: `${READING_THEMES[currentTheme].textColor}cc` }}
                >
                  Font Size
                </label>
                <div className="flex gap-2">
                  {fontSizes.map(({ size, label }) => (
                    <button
                      key={size}
                      onClick={() => onFontSizeChange(size)}
                      className={`flex-1 py-2.5 px-3 rounded-xl border-2 transition-all ${
                        currentFontSize === size 
                          ? 'border-current' 
                          : 'border-transparent hover:border-current/30'
                      }`}
                      style={{
                        background: currentFontSize === size 
                          ? `${READING_THEMES[currentTheme].accentColor}20` 
                          : 'transparent',
                        color: READING_THEMES[currentTheme].textColor,
                      }}
                    >
                      <span 
                        className={`block font-serif ${FONT_SIZE_CONFIG[size].className}`}
                        style={{ color: READING_THEMES[currentTheme].textColor }}
                      >
                        Aa
                      </span>
                      <span 
                        className="block text-[10px] mt-1 opacity-70"
                        style={{ color: READING_THEMES[currentTheme].textColor }}
                      >
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div 
                className="p-4 rounded-xl border"
                style={{ 
                  background: `${READING_THEMES[currentTheme].textColor}05`,
                  borderColor: `${READING_THEMES[currentTheme].accentColor}20`,
                }}
              >
                <p 
                  className={`font-serif ${FONT_SIZE_CONFIG[currentFontSize].className} ${FONT_SIZE_CONFIG[currentFontSize].lineHeight}`}
                  style={{ 
                    color: READING_THEMES[currentTheme].textColor,
                    fontFamily: '"EB Garamond", "Crimson Pro", Georgia, serif',
                  }}
                >
                  The quick brown fox jumps over the lazy dog. This is how your reading experience will look.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ThemeSelector;
