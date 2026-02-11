'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';

const themeConfig = {
  dark: {
    icon: Moon,
    color: 'text-blue-400',
    bgColor: '#1f2937',
    label: 'Dark mode',
    nextLabel: 'Switch to light mode',
  },
  light: {
    icon: Sun,
    color: 'text-orange-500',
    bgColor: '#fcd34d',
    label: 'Light mode',
    nextLabel: 'Switch to system mode',
  },
  system: {
    icon: Monitor,
    color: 'text-teal-500',
    bgColor: '#99f6e4',
    label: 'System mode (accessibility)',
    nextLabel: 'Switch to dark mode',
  },
} as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const config = themeConfig[theme];

  return (
    <div
      className="inline-flex h-9 items-center rounded-full p-1 transition-colors border border-gray-200 dark:border-gray-700 system:border-[var(--border)]"
      style={{ backgroundColor: 'var(--surface)' }}
      role="radiogroup"
      aria-label="Theme selection"
    >
      {(['light', 'dark', 'system'] as const).map((mode) => {
        const modeConfig = themeConfig[mode];
        const Icon = modeConfig.icon;
        const isActive = theme === mode;

        return (
          <button
            key={mode}
            role="radio"
            aria-checked={isActive}
            aria-label={modeConfig.label}
            onClick={() => setTheme(mode)}
            className={`relative flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${
              isActive
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}

// Compact version for header - icon only, cycles through modes
export function ThemeToggleCompact() {
  const { theme, toggleTheme } = useTheme();
  const config = themeConfig[theme];
  const Icon = config.icon;

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
      style={{
        backgroundColor: theme === 'system' ? 'var(--surface)' : undefined,
        borderColor: theme === 'system' ? 'var(--border)' : undefined,
      }}
      aria-label={config.nextLabel}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative w-4 h-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={theme}
            initial={{ y: -10, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 10, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Icon className={`h-4 w-4 ${config.color}`} />
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.button>
  );
}
