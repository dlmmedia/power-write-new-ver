'use client';

import { useState, useEffect } from 'react';
import { Check, Loader2, AlertCircle, Cloud, RefreshCw } from 'lucide-react';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface SaveStatusProps {
  state: SaveState;
  lastSaved?: Date | null;
  errorMessage?: string;
  onRetry?: () => void;
  className?: string;
  showTimestamp?: boolean;
}

export function SaveStatus({ 
  state, 
  lastSaved, 
  errorMessage,
  onRetry,
  className = '',
  showTimestamp = true
}: SaveStatusProps) {
  const [showSaved, setShowSaved] = useState(false);

  // Show "Saved" briefly after save completes
  useEffect(() => {
    if (state === 'saved') {
      setShowSaved(true);
      const timer = setTimeout(() => {
        setShowSaved(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Idle state - show last saved time if available
  if (state === 'idle' && !showSaved) {
    if (!lastSaved) return null;
    return (
      <div className={`flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 ${className}`}>
        <Cloud className="w-3.5 h-3.5" />
        {showTimestamp && <span>Saved {formatTimeAgo(lastSaved)}</span>}
      </div>
    );
  }

  // Saving state
  if (state === 'saving') {
    return (
      <div className={`flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 ${className}`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  // Just saved state
  if (state === 'saved' || showSaved) {
    return (
      <div className={`flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 animate-in fade-in duration-200 ${className}`}>
        <Check className="w-3.5 h-3.5" />
        <span>Saved</span>
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div className={`flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 ${className}`}>
        <AlertCircle className="w-3.5 h-3.5" />
        <span>{errorMessage || 'Save failed'}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-1 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
            title="Retry save"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  return null;
}

// Auto-save status indicator with animation
interface AutoSaveIndicatorProps {
  isSaving: boolean;
  hasChanges: boolean;
  lastSaved?: Date | null;
  error?: string | null;
  onRetry?: () => void;
}

export function AutoSaveIndicator({
  isSaving,
  hasChanges,
  lastSaved,
  error,
  onRetry
}: AutoSaveIndicatorProps) {
  let state: SaveState = 'idle';
  if (error) state = 'error';
  else if (isSaving) state = 'saving';
  else if (hasChanges) state = 'idle';
  else if (lastSaved) state = 'saved';

  return (
    <div className="flex items-center gap-2">
      <SaveStatus 
        state={state} 
        lastSaved={lastSaved} 
        errorMessage={error || undefined}
        onRetry={onRetry}
      />
      {hasChanges && !isSaving && !error && (
        <span className="text-xs text-yellow-600 dark:text-yellow-400">
          • Unsaved changes
        </span>
      )}
    </div>
  );
}

// Compact save button with status
interface SaveButtonProps {
  onClick: () => void;
  state: SaveState;
  disabled?: boolean;
  className?: string;
}

export function SaveButton({ onClick, state, disabled, className = '' }: SaveButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || state === 'saving'}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
        ${state === 'saving' 
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 cursor-wait'
          : state === 'error'
            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
            : state === 'saved'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
              : 'bg-yellow-500 hover:bg-yellow-600 text-black'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {state === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
      {state === 'saved' && <Check className="w-4 h-4" />}
      {state === 'error' && <AlertCircle className="w-4 h-4" />}
      {state === 'idle' && <Cloud className="w-4 h-4" />}
      <span>
        {state === 'saving' ? 'Saving...' : state === 'saved' ? 'Saved' : state === 'error' ? 'Retry Save' : 'Save'}
      </span>
    </button>
  );
}
