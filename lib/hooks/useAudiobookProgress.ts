'use client';

import { useState, useEffect, useCallback } from 'react';

export interface AudiobookProgress {
  bookId: number;
  chapterIndex: number;
  chapterNumber: number;
  time: number;
  bookmarked: boolean;
  updatedAt: number;
  totalListenTime?: number;
}

interface UseAudiobookProgressOptions {
  autoSaveInterval?: number; // in milliseconds
}

const STORAGE_KEY_PREFIX = 'audiobook-progress-';
const ALL_PROGRESS_KEY = 'audiobook-all-progress';

/**
 * Hook for managing audiobook playback progress and bookmarks
 * Persists to localStorage and provides auto-save functionality
 */
export function useAudiobookProgress(
  bookId: number,
  options: UseAudiobookProgressOptions = {}
) {
  const { autoSaveInterval = 5000 } = options;
  
  const [progress, setProgress] = useState<AudiobookProgress | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load progress on mount
  useEffect(() => {
    const storageKey = `${STORAGE_KEY_PREFIX}${bookId}`;
    const savedProgress = localStorage.getItem(storageKey);
    
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress) as AudiobookProgress;
        setProgress(parsed);
      } catch (e) {
        console.error('Failed to parse audiobook progress:', e);
      }
    }
    setIsLoaded(true);
  }, [bookId]);

  // Save progress to localStorage
  const saveProgress = useCallback((newProgress: Partial<AudiobookProgress>) => {
    const storageKey = `${STORAGE_KEY_PREFIX}${bookId}`;
    
    const updatedProgress: AudiobookProgress = {
      bookId,
      chapterIndex: newProgress.chapterIndex ?? progress?.chapterIndex ?? 0,
      chapterNumber: newProgress.chapterNumber ?? progress?.chapterNumber ?? 1,
      time: newProgress.time ?? progress?.time ?? 0,
      bookmarked: newProgress.bookmarked ?? progress?.bookmarked ?? false,
      updatedAt: Date.now(),
      totalListenTime: newProgress.totalListenTime ?? progress?.totalListenTime ?? 0,
    };

    setProgress(updatedProgress);
    localStorage.setItem(storageKey, JSON.stringify(updatedProgress));

    // Also update the all-progress index for listing recent books
    updateAllProgressIndex(updatedProgress);
    
    return updatedProgress;
  }, [bookId, progress]);

  // Update position (chapter and time)
  const updatePosition = useCallback((
    chapterIndex: number,
    chapterNumber: number,
    time: number
  ) => {
    return saveProgress({ chapterIndex, chapterNumber, time });
  }, [saveProgress]);

  // Toggle bookmark
  const toggleBookmark = useCallback(() => {
    const newBookmarked = !progress?.bookmarked;
    return saveProgress({ bookmarked: newBookmarked });
  }, [progress?.bookmarked, saveProgress]);

  // Set bookmark
  const setBookmark = useCallback((bookmarked: boolean) => {
    return saveProgress({ bookmarked });
  }, [saveProgress]);

  // Clear progress
  const clearProgress = useCallback(() => {
    const storageKey = `${STORAGE_KEY_PREFIX}${bookId}`;
    localStorage.removeItem(storageKey);
    setProgress(null);
    
    // Remove from all-progress index
    removeFromAllProgressIndex(bookId);
  }, [bookId]);

  // Get all saved progress (for "Continue Listening" feature)
  const getAllProgress = useCallback((): AudiobookProgress[] => {
    try {
      const allProgress = localStorage.getItem(ALL_PROGRESS_KEY);
      if (allProgress) {
        const parsed = JSON.parse(allProgress) as Record<string, AudiobookProgress>;
        return Object.values(parsed)
          .filter(p => p.time > 0 || p.bookmarked)
          .sort((a, b) => b.updatedAt - a.updatedAt);
      }
    } catch (e) {
      console.error('Failed to get all progress:', e);
    }
    return [];
  }, []);

  // Check if there's saved progress for this book
  const hasProgress = progress !== null && (progress.time > 0 || progress.chapterIndex > 0);
  
  // Check if book is bookmarked
  const isBookmarked = progress?.bookmarked ?? false;

  return {
    progress,
    isLoaded,
    hasProgress,
    isBookmarked,
    saveProgress,
    updatePosition,
    toggleBookmark,
    setBookmark,
    clearProgress,
    getAllProgress,
  };
}

// Helper to update the all-progress index
function updateAllProgressIndex(progress: AudiobookProgress) {
  try {
    const allProgressStr = localStorage.getItem(ALL_PROGRESS_KEY);
    const allProgress: Record<string, AudiobookProgress> = allProgressStr 
      ? JSON.parse(allProgressStr) 
      : {};
    
    allProgress[progress.bookId.toString()] = progress;
    localStorage.setItem(ALL_PROGRESS_KEY, JSON.stringify(allProgress));
  } catch (e) {
    console.error('Failed to update all progress index:', e);
  }
}

// Helper to remove from all-progress index
function removeFromAllProgressIndex(bookId: number) {
  try {
    const allProgressStr = localStorage.getItem(ALL_PROGRESS_KEY);
    if (allProgressStr) {
      const allProgress: Record<string, AudiobookProgress> = JSON.parse(allProgressStr);
      delete allProgress[bookId.toString()];
      localStorage.setItem(ALL_PROGRESS_KEY, JSON.stringify(allProgress));
    }
  } catch (e) {
    console.error('Failed to remove from all progress index:', e);
  }
}

/**
 * Hook to get all audiobook progress for displaying "Continue Listening" section
 */
export function useAllAudiobookProgress() {
  const [allProgress, setAllProgress] = useState<AudiobookProgress[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const allProgressStr = localStorage.getItem(ALL_PROGRESS_KEY);
      if (allProgressStr) {
        const parsed = JSON.parse(allProgressStr) as Record<string, AudiobookProgress>;
        const progressList = Object.values(parsed)
          .filter(p => p.time > 0 || p.bookmarked)
          .sort((a, b) => b.updatedAt - a.updatedAt);
        setAllProgress(progressList);
      }
    } catch (e) {
      console.error('Failed to load all progress:', e);
    }
    setIsLoaded(true);
  }, []);

  const refreshProgress = useCallback(() => {
    try {
      const allProgressStr = localStorage.getItem(ALL_PROGRESS_KEY);
      if (allProgressStr) {
        const parsed = JSON.parse(allProgressStr) as Record<string, AudiobookProgress>;
        const progressList = Object.values(parsed)
          .filter(p => p.time > 0 || p.bookmarked)
          .sort((a, b) => b.updatedAt - a.updatedAt);
        setAllProgress(progressList);
      }
    } catch (e) {
      console.error('Failed to refresh progress:', e);
    }
  }, []);

  return {
    allProgress,
    isLoaded,
    refreshProgress,
  };
}

/**
 * Utility to format listen time
 */
export function formatListenTime(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate progress percentage for a book
 */
export function calculateBookProgress(
  currentChapterIndex: number,
  currentTime: number,
  chapters: { audioDuration?: number | null }[]
): number {
  if (chapters.length === 0) return 0;
  
  const totalDuration = chapters.reduce((acc, ch) => acc + (ch.audioDuration || 0), 0);
  if (totalDuration === 0) return 0;
  
  const completedDuration = chapters
    .slice(0, currentChapterIndex)
    .reduce((acc, ch) => acc + (ch.audioDuration || 0), 0) + currentTime;
  
  return Math.min(100, (completedDuration / totalDuration) * 100);
}












