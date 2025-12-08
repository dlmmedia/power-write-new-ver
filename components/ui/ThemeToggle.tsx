'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-black"
      style={{
        backgroundColor: isDark ? '#1f2937' : '#fcd34d',
      }}
      aria-label="Toggle theme"
    >
      <span className="sr-only">Toggle theme</span>
      
      {/* Sun Icon */}
      <span
        className={`absolute left-2 transition-opacity duration-300 ${
          isDark ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <Sun className="h-4 w-4 text-yellow-600" />
      </span>

      {/* Moon Icon */}
      <span
        className={`absolute right-2 transition-opacity duration-300 ${
          isDark ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Moon className="h-4 w-4 text-yellow-400" />
      </span>

      {/* Toggle Circle */}
      <motion.span
        className="inline-block h-6 w-6 rounded-full bg-white shadow-lg"
        animate={{
          x: isDark ? 32 : 4,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

// Compact version for header
export function ThemeToggleCompact() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 overflow-hidden group"
      aria-label="Toggle theme"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative w-5 h-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={theme}
            initial={{ y: -20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {isDark ? (
              <Moon className="h-4 w-4 text-blue-400" />
            ) : (
              <Sun className="h-4 w-4 text-orange-500" />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 w-12 text-left">
        {isDark ? 'Dark' : 'Light'}
      </span>
      
      {/* Subtle background glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200/50 dark:via-gray-600/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
    </motion.button>
  );
}
