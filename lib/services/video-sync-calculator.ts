/**
 * Video Sync Calculator Service
 * 
 * Calculates page timing from AudioTimestamp data for video export.
 * This extracts the sync logic from ImmersiveReader to determine when
 * each page should be displayed based on audio timestamps.
 */

import { paginateContent } from '@/lib/utils/pagination';
import type { FontSize, TextChunk, PaginatedContent } from '@/lib/utils/pagination';

// AudioTimestamp type (same as in reader types)
export interface AudioTimestamp {
  word: string;
  start: number;
  end: number;
}

// Frame generation settings - MUST match frame-renderer.ts
const HIGHLIGHT_FRAME_INTERVAL = 0.5; // Capture a frame every 0.5 seconds for word sync
const FLIP_FRAME_COUNT = 15; // Number of frames for page flip animation

// Types for video frame generation
export interface PageTiming {
  pageIndex: number;        // Page index within chapter (0-based)
  startTime: number;        // When this page should start (seconds)
  endTime: number;          // When this page should end (seconds)
  duration: number;         // Duration in seconds
  startWordIndex: number;   // First word on this page
  endWordIndex: number;     // Last word on this page
  startCharIndex: number;   // First character on this page
  endCharIndex: number;     // Last character on this page
  isFlipFrame?: boolean;    // If true, this is a page flip transition frame
}

export interface ChapterTiming {
  chapterIndex: number;
  chapterTitle: string;
  totalPages: number;
  audioDuration: number;    // Total chapter audio duration in seconds
  pages: PageTiming[];
  flipTransitions: FlipTransition[];
}

export interface FlipTransition {
  fromPage: number;
  toPage: number;
  startTime: number;        // When flip animation starts
  endTime: number;          // When flip animation ends
  duration: number;         // Flip animation duration (e.g., 0.6 seconds)
}

export interface VideoManifest {
  bookId: number;
  bookTitle: string;
  author: string;
  totalDuration: number;    // Total video duration in seconds
  totalFrames: number;      // Total number of frames to render
  chapters: ChapterTiming[];
  fontSize: FontSize;
  theme: string;
}

// --- Word/character mapping helpers (ported from ImmersiveReader) ---

/**
 * Build an array of character positions where each word starts
 */
export function buildWordStartCharIndices(text: string): number[] {
  const indices: number[] = [];
  const re = /[\p{L}\p{N}'']+/gu;
  for (const match of text.matchAll(re)) {
    if (typeof match.index === 'number') indices.push(match.index);
  }
  return indices;
}

/**
 * Binary search to find the word index at a given character position
 */
function upperBound(arr: number[], target: number): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function wordIndexAtCharPos(wordStarts: number[], charPos: number): number {
  if (wordStarts.length === 0) return 0;
  const idx = upperBound(wordStarts, charPos) - 1;
  return Math.max(0, Math.min(idx, wordStarts.length - 1));
}

/**
 * Find word index from audio time using binary search
 */
export function findWordIndexByTime(timestamps: AudioTimestamp[], time: number): number {
  if (timestamps.length === 0) return -1;

  let lo = 0;
  let hi = timestamps.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const t = timestamps[mid];
    if (time < t.start) hi = mid - 1;
    else if (time > t.end) lo = mid + 1;
    else return mid;
  }

  // Not inside any exact word span - pick the last word that started before time
  let l = 0;
  let r = timestamps.length;
  while (l < r) {
    const m = (l + r) >> 1;
    if (timestamps[m].start <= time) l = m + 1;
    else r = m;
  }
  const idx = l - 1;
  return idx >= 0 ? idx : -1;
}

/**
 * Get the audio time when a word starts
 */
function getWordStartTime(timestamps: AudioTimestamp[], wordIndex: number): number {
  if (wordIndex < 0 || wordIndex >= timestamps.length) return 0;
  return timestamps[wordIndex].start;
}

/**
 * Get the audio time when a word ends
 */
function getWordEndTime(timestamps: AudioTimestamp[], wordIndex: number): number {
  if (wordIndex < 0 || wordIndex >= timestamps.length) {
    return timestamps.length > 0 ? timestamps[timestamps.length - 1].end : 0;
  }
  return timestamps[wordIndex].end;
}

/**
 * Calculate which page a character position falls on
 */
function findPageForCharPos(pages: TextChunk[][], charPos: number): number {
  for (let i = 0; i < pages.length; i++) {
    const chunks = pages[i];
    if (chunks.length === 0) continue;
    
    const firstChunk = chunks[0];
    const lastChunk = chunks[chunks.length - 1];
    
    if (charPos >= firstChunk.startCharIndex && charPos <= lastChunk.endCharIndex) {
      return i;
    }
  }
  return pages.length > 0 ? pages.length - 1 : 0;
}

/**
 * Calculate page timing for a single chapter
 */
export function calculateChapterTiming(
  chapterIndex: number,
  chapterTitle: string,
  chapterContent: string,
  audioTimestamps: AudioTimestamp[],
  audioDuration: number,
  fontSize: FontSize = 'base',
  flipDuration: number = 0.6 // Page flip animation duration in seconds
): ChapterTiming {
  // Paginate the chapter content
  const paginatedContent = paginateContent(chapterContent, fontSize);
  const pages = paginatedContent.pages;
  const totalPages = paginatedContent.totalPages;
  
  // Build word-to-character mapping
  const wordStarts = buildWordStartCharIndices(chapterContent);
  
  // If no timestamps, create basic timing based on even distribution
  if (!audioTimestamps || audioTimestamps.length === 0) {
    const pageTimings: PageTiming[] = [];
    const timePerPage = audioDuration / Math.max(1, totalPages);
    
    for (let i = 0; i < totalPages; i++) {
      const chunks = pages[i] || [];
      const firstChunk = chunks[0];
      const lastChunk = chunks[chunks.length - 1];
      
      pageTimings.push({
        pageIndex: i,
        startTime: i * timePerPage,
        endTime: (i + 1) * timePerPage,
        duration: timePerPage,
        startWordIndex: 0,
        endWordIndex: 0,
        startCharIndex: firstChunk?.startCharIndex || 0,
        endCharIndex: lastChunk?.endCharIndex || 0,
      });
    }
    
    return {
      chapterIndex,
      chapterTitle,
      totalPages,
      audioDuration,
      pages: pageTimings,
      flipTransitions: generateFlipTransitions(pageTimings, flipDuration),
    };
  }
  
  // Calculate timing for each page based on audio timestamps
  const pageTimings: PageTiming[] = [];
  
  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const chunks = pages[pageIdx] || [];
    if (chunks.length === 0) continue;
    
    const firstChunk = chunks[0];
    const lastChunk = chunks[chunks.length - 1];
    
    // Find which word indices correspond to this page's character range
    const startCharIndex = firstChunk.startCharIndex;
    const endCharIndex = lastChunk.endCharIndex;
    
    const startWordIndex = wordIndexAtCharPos(wordStarts, startCharIndex);
    const endWordIndex = wordIndexAtCharPos(wordStarts, endCharIndex);
    
    // Get audio times for these word indices
    const startTime = getWordStartTime(audioTimestamps, startWordIndex);
    const endTime = getWordEndTime(audioTimestamps, endWordIndex);
    
    pageTimings.push({
      pageIndex: pageIdx,
      startTime,
      endTime,
      duration: Math.max(0.1, endTime - startTime), // Minimum 0.1 second per page
      startWordIndex,
      endWordIndex,
      startCharIndex,
      endCharIndex,
    });
  }
  
  // Ensure continuous timing (no gaps)
  normalizePageTimings(pageTimings, audioDuration);
  
  return {
    chapterIndex,
    chapterTitle,
    totalPages,
    audioDuration,
    pages: pageTimings,
    flipTransitions: generateFlipTransitions(pageTimings, flipDuration),
  };
}

/**
 * Normalize page timings to ensure continuous coverage with no gaps
 */
function normalizePageTimings(pageTimings: PageTiming[], totalDuration: number): void {
  if (pageTimings.length === 0) return;
  
  // Ensure first page starts at 0
  pageTimings[0].startTime = 0;
  
  // Ensure each page ends when the next begins
  for (let i = 0; i < pageTimings.length - 1; i++) {
    const current = pageTimings[i];
    const next = pageTimings[i + 1];
    
    // Adjust if there's a gap or overlap
    if (current.endTime !== next.startTime) {
      // Split the difference to smooth transitions
      const midpoint = (current.endTime + next.startTime) / 2;
      current.endTime = midpoint;
      next.startTime = midpoint;
    }
    
    current.duration = current.endTime - current.startTime;
  }
  
  // Ensure last page ends at total duration
  const lastPage = pageTimings[pageTimings.length - 1];
  lastPage.endTime = totalDuration;
  lastPage.duration = lastPage.endTime - lastPage.startTime;
}

/**
 * Generate flip transition timing between pages
 */
function generateFlipTransitions(
  pageTimings: PageTiming[],
  flipDuration: number
): FlipTransition[] {
  const transitions: FlipTransition[] = [];
  
  // For book view, we flip every 2 pages (left+right spread)
  for (let i = 0; i < pageTimings.length - 2; i += 2) {
    const currentSpreadEnd = pageTimings[i + 1]?.endTime || pageTimings[i].endTime;
    
    transitions.push({
      fromPage: i,
      toPage: i + 2,
      startTime: currentSpreadEnd - flipDuration / 2,
      endTime: currentSpreadEnd + flipDuration / 2,
      duration: flipDuration,
    });
  }
  
  return transitions;
}

/**
 * Calculate timing for an entire book
 */
export function calculateBookTiming(
  bookId: number,
  bookTitle: string,
  author: string,
  chapters: Array<{
    index: number;
    title: string;
    content: string;
    audioTimestamps: AudioTimestamp[] | null;
    audioDuration: number;
  }>,
  fontSize: FontSize = 'base',
  theme: string = 'day',
  flipDuration: number = 0.6
): VideoManifest {
  let totalDuration = 0;
  let totalFrames = 0;
  const chapterTimings: ChapterTiming[] = [];
  
  for (const chapter of chapters) {
    const timing = calculateChapterTiming(
      chapter.index,
      chapter.title,
      chapter.content,
      chapter.audioTimestamps || [],
      chapter.audioDuration,
      fontSize,
      flipDuration
    );
    
    // Adjust timing to be relative to total video time
    const chapterOffset = totalDuration;
    for (const page of timing.pages) {
      page.startTime += chapterOffset;
      page.endTime += chapterOffset;
    }
    for (const flip of timing.flipTransitions) {
      flip.startTime += chapterOffset;
      flip.endTime += chapterOffset;
    }
    
    totalDuration += timing.audioDuration;
    
    // Calculate frames: static pages + flip animation frames
    // When audio timestamps exist, multiple frames per page for word highlighting
    const hasAudioTimestamps = chapter.audioTimestamps && chapter.audioTimestamps.length > 0;
    let staticFrames = 0;
    
    if (hasAudioTimestamps) {
      // Calculate frames based on page duration (matching frame-renderer.ts logic)
      for (let i = 0; i < timing.pages.length; i += 2) {
        const currentPage = timing.pages[i];
        const nextSpreadPage = timing.pages[i + 2];
        
        // Calculate page spread duration
        const pageEndTime = nextSpreadPage?.startTime 
          ?? timing.pages[timing.pages.length - 1]?.endTime 
          ?? currentPage.endTime;
        const pageDuration = pageEndTime - currentPage.startTime;
        
        // Match frame-renderer.ts calculation: Math.max(1, Math.ceil(pageDuration / HIGHLIGHT_FRAME_INTERVAL))
        staticFrames += Math.max(1, Math.ceil(pageDuration / HIGHLIGHT_FRAME_INTERVAL));
      }
    } else {
      // No audio timestamps: 1 frame per page spread
      staticFrames = Math.ceil(timing.totalPages / 2);
    }
    
    // Flip animations: FLIP_FRAME_COUNT frames per flip
    const flipFrames = timing.flipTransitions.length * FLIP_FRAME_COUNT;
    totalFrames += staticFrames + flipFrames;
    
    chapterTimings.push(timing);
  }
  
  return {
    bookId,
    bookTitle,
    author,
    totalDuration,
    totalFrames,
    chapters: chapterTimings,
    fontSize,
    theme,
  };
}

/**
 * Calculate timing for a single chapter (for chapter-only export)
 */
export function calculateSingleChapterTiming(
  bookId: number,
  bookTitle: string,
  author: string,
  chapter: {
    index: number;
    title: string;
    content: string;
    audioTimestamps: AudioTimestamp[] | null;
    audioDuration: number;
  },
  fontSize: FontSize = 'base',
  theme: string = 'day',
  flipDuration: number = 0.6
): VideoManifest {
  const timing = calculateChapterTiming(
    chapter.index,
    chapter.title,
    chapter.content,
    chapter.audioTimestamps || [],
    chapter.audioDuration,
    fontSize,
    flipDuration
  );
  
  // Calculate frames - matching frame-renderer.ts logic
  const hasAudioTimestamps = chapter.audioTimestamps && chapter.audioTimestamps.length > 0;
  let staticFrames = 0;
  
  if (hasAudioTimestamps) {
    // Calculate frames based on page duration (matching frame-renderer.ts logic)
    for (let i = 0; i < timing.pages.length; i += 2) {
      const currentPage = timing.pages[i];
      const nextSpreadPage = timing.pages[i + 2];
      
      // Calculate page spread duration
      const pageEndTime = nextSpreadPage?.startTime 
        ?? timing.pages[timing.pages.length - 1]?.endTime 
        ?? currentPage.endTime;
      const pageDuration = pageEndTime - currentPage.startTime;
      
      // Match frame-renderer.ts calculation
      staticFrames += Math.max(1, Math.ceil(pageDuration / HIGHLIGHT_FRAME_INTERVAL));
    }
  } else {
    // No audio timestamps: 1 frame per page spread
    staticFrames = Math.ceil(timing.totalPages / 2);
  }
  
  // Flip animations: FLIP_FRAME_COUNT frames per flip
  const flipFrames = timing.flipTransitions.length * FLIP_FRAME_COUNT;
  
  return {
    bookId,
    bookTitle,
    author,
    totalDuration: timing.audioDuration,
    totalFrames: staticFrames + flipFrames,
    chapters: [timing],
    fontSize,
    theme,
  };
}

/**
 * Get frame timings for video encoding
 * Returns an array of timestamps where frames should be captured
 */
export function getFrameTimestamps(
  manifest: VideoManifest,
  fps: number = 24
): Array<{ time: number; type: 'static' | 'flip'; chapterIndex: number; pageIndex: number; flipFrame?: number }> {
  const frames: Array<{ time: number; type: 'static' | 'flip'; chapterIndex: number; pageIndex: number; flipFrame?: number }> = [];
  
  for (const chapter of manifest.chapters) {
    // Add static frames for each page spread
    for (let i = 0; i < chapter.pages.length; i += 2) {
      const page = chapter.pages[i];
      
      // Add static frame at the start of each spread
      frames.push({
        time: page.startTime,
        type: 'static',
        chapterIndex: chapter.chapterIndex,
        pageIndex: i,
      });
    }
    
    // Add flip animation frames
    for (const flip of chapter.flipTransitions) {
      const flipFrameCount = Math.ceil(flip.duration * fps);
      for (let f = 0; f < flipFrameCount; f++) {
        const t = flip.startTime + (f / flipFrameCount) * flip.duration;
        frames.push({
          time: t,
          type: 'flip',
          chapterIndex: chapter.chapterIndex,
          pageIndex: flip.fromPage,
          flipFrame: f,
        });
      }
    }
  }
  
  // Sort by time
  frames.sort((a, b) => a.time - b.time);
  
  return frames;
}
