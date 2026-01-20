'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

export interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  variant?: 'default' | 'compact' | 'card';
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  subtitle,
  icon,
  badge,
  headerRight,
  children,
  defaultOpen = false,
  className,
  headerClassName,
  contentClassName,
  variant = 'default',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const variantStyles = {
    default: {
      container: 'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800',
      header: 'p-4',
      content: 'px-4 pb-5',
    },
    compact: {
      container: 'bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800',
      header: 'px-3 py-2.5',
      content: 'px-3 pb-3',
    },
    card: {
      container: 'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm',
      header: 'px-5 py-4',
      content: 'px-5 pb-5',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={clsx(styles.container, className)}>
      <div
        className={clsx(
          'w-full flex items-center justify-between gap-3 text-left transition-colors',
          'hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-t-xl',
          styles.header,
          headerClassName
        )}
      >
        {/* Clickable area for toggle - excludes headerRight to prevent nested buttons */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 min-w-0 flex-1 text-left"
          type="button"
        >
          {icon && (
            <div className="flex-shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className={clsx(
                'font-semibold text-gray-900 dark:text-white truncate',
                variant === 'compact' ? 'text-sm' : 'text-base'
              )}>
                {title}
              </h3>
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </button>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* headerRight is outside the button to allow nested interactive elements */}
          {headerRight && (
            <div onClick={(e) => e.stopPropagation()}>
              {headerRight}
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 -m-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            type="button"
            aria-label={isOpen ? 'Collapse section' : 'Expand section'}
          >
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </motion.div>
          </button>
        </div>
      </div>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={clsx(styles.content, contentClassName)}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Compact item for lists inside collapsible sections
export interface CollapsibleItemProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  header: React.ReactNode;
  className?: string;
}

export const CollapsibleItem: React.FC<CollapsibleItemProps> = ({
  children,
  defaultOpen = false,
  header,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={clsx('border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden', className)}>
      <div
        className="w-full flex items-center justify-between gap-2 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        {/* Header content - onClick on buttons inside should stopPropagation */}
        <div className="flex-1 min-w-0" onClick={(e) => {
          // Only stop propagation if clicking on an interactive element
          if ((e.target as HTMLElement).closest('button, a, input, select, textarea')) {
            e.stopPropagation();
          }
        }}>
          {header}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.15 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </div>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
