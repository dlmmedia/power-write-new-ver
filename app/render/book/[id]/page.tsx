'use client';

/**
 * Headless Book Render Page
 * 
 * This page is designed for Puppeteer to capture frames for video export.
 * It renders the Book3D component without UI controls, optimized for screenshot capture.
 * 
 * Query Parameters:
 * - chapter: Chapter index (0-based)
 * - page: Page index within chapter (0-based, should be even for spread view)
 * - theme: Reading theme (day, night, sepia, focus)
 * - fontSize: Font size (xs, sm, base, lg, xl, xxl)
 * - flipFrame: If provided, renders a flip animation frame (0 to ~15)
 * - flipDirection: 'forward' or 'backward' for flip animation
 * - wordIndex: Index of the currently spoken word (for audio-synced text highlighting)
 * - ready: Set to 'true' by client when ready for capture
 */

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Book3D } from '@/components/library/reader/Book3D';
import { paginateBook, getSpreadPages } from '@/components/library/reader/PageContent';
import {
  ReadingTheme,
  FontSize,
  READING_THEMES,
  Chapter,
  TextChunk,
} from '@/components/library/reader/types';

// Build an array of character positions where each word starts (for audio sync)
function buildWordStartCharIndices(text: string): number[] {
  const indices: number[] = [];
  const re = /[\p{L}\p{N}'']+/gu;
  for (const match of text.matchAll(re)) {
    if (typeof match.index === 'number') indices.push(match.index);
  }
  return indices;
}

// Video frame dimensions (16:9 aspect ratio for video)
const FRAME_WIDTH = 1920;
const FRAME_HEIGHT = 1080;

interface BookData {
  id: number;
  title: string;
  author: string;
  coverUrl?: string;
  chapters: Chapter[];
}

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div 
      className="flex items-center justify-center"
      style={{ 
        width: FRAME_WIDTH, 
        height: FRAME_HEIGHT,
        backgroundColor: '#1a1a1a',
        color: '#fff',
      }}
    >
      <div className="text-2xl">Loading...</div>
    </div>
  );
}

// Main content component that uses useSearchParams
function RenderBookContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const bookId = params.id as string;
  
  // Parse query parameters
  const chapterIndex = parseInt(searchParams.get('chapter') || '0', 10);
  const pageIndex = parseInt(searchParams.get('page') || '0', 10);
  const theme = (searchParams.get('theme') || 'day') as ReadingTheme;
  const fontSize = (searchParams.get('fontSize') || 'base') as FontSize;
  const flipFrame = searchParams.get('flipFrame');
  const flipDirection = (searchParams.get('flipDirection') || 'forward') as 'forward' | 'backward';
  // Audio sync parameters for text highlighting
  const wordIndexParam = searchParams.get('wordIndex');
  const currentWordIndex = wordIndexParam !== null ? parseInt(wordIndexParam, 10) : -1;
  const isAudioPlaying = currentWordIndex >= 0; // Highlight is active when wordIndex is provided
  
  // State
  const [book, setBook] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Fetch book data with retry logic
  useEffect(() => {
    async function fetchBook() {
      const maxRetries = 3;
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[RenderBook] Fetching book ${bookId} (attempt ${attempt}/${maxRetries})...`);
          
          // Use absolute URL if available (for Puppeteer headless context)
          const apiUrl = typeof window !== 'undefined' && window.location.origin 
            ? `${window.location.origin}/api/books/${bookId}`
            : `/api/books/${bookId}`;
          
          const response = await fetch(apiUrl, {
            cache: 'no-store',
            headers: {
              'Accept': 'application/json',
            },
          });
          
          if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error(`[RenderBook] API error ${response.status}: ${errorText}`);
            throw new Error(`API returned ${response.status}: ${errorText}`);
          }
          
          const responseData = await response.json();
          console.log(`[RenderBook] Book data received:`, responseData.book ? 'has book' : 'no book');
          
          // API returns { success: true, book: { ... } }
          const data = responseData.book || responseData;
          
          // Transform chapters to match expected format
          const chapters: Chapter[] = (data.chapters || []).map((ch: any) => ({
            id: ch.id,
            number: ch.chapterNumber || ch.number,
            title: ch.title,
            content: ch.content,
            wordCount: ch.wordCount || 0,
            status: 'completed' as const,
            audioUrl: ch.audioUrl,
            audioDuration: ch.audioDuration,
            audioTimestamps: ch.audioTimestamps,
          }));
          
          setBook({
            id: data.id,
            title: data.title,
            author: data.author || 'Unknown Author',
            coverUrl: data.coverUrl,
            chapters,
          });
          setLoading(false);
          return; // Success, exit the retry loop
          
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.error(`[RenderBook] Attempt ${attempt} failed:`, lastError.message);
          
          if (attempt < maxRetries) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 500 * attempt));
          }
        }
      }
      
      // All retries failed
      console.error('[RenderBook] All fetch attempts failed:', lastError?.message);
      setError(lastError?.message || 'Failed to fetch book after multiple attempts');
      setLoading(false);
    }
    
    fetchBook();
  }, [bookId]);
  
  // Paginate book content
  const { chapterPages } = useMemo(() => {
    if (!book?.chapters) return { chapterPages: [], totalBookPages: 0, chapterStartPages: [] };
    return paginateBook(book.chapters, fontSize);
  }, [book?.chapters, fontSize]);
  
  // Get current spread pages
  const { leftPage, rightPage, leftPageNumber, rightPageNumber, totalPagesInChapter } = useMemo(() => {
    return getSpreadPages(chapterPages, chapterIndex, pageIndex);
  }, [chapterPages, chapterIndex, pageIndex]);
  
  // Get next spread for flip animation
  const nextSpread = useMemo(() => {
    if (flipFrame === null) return null;
    const nextPageIndex = flipDirection === 'forward' ? pageIndex + 2 : pageIndex - 2;
    if (nextPageIndex < 0 || nextPageIndex >= totalPagesInChapter) return null;
    return getSpreadPages(chapterPages, chapterIndex, nextPageIndex);
  }, [chapterPages, chapterIndex, pageIndex, flipFrame, flipDirection, totalPagesInChapter]);
  
  // Build word start indices for current chapter (for audio sync highlighting)
  const chapterWordStarts = useMemo(() => {
    const currentChapter = book?.chapters[chapterIndex];
    if (!currentChapter?.content) return [];
    return buildWordStartCharIndices(currentChapter.content);
  }, [book?.chapters, chapterIndex]);
  
  // Calculate flip animation state
  const isFlipping = flipFrame !== null;
  const flipProgress = flipFrame !== null ? parseInt(flipFrame, 10) / 15 : 0; // 0 to 1
  
  // Prepare flip content
  const flipFrontContent = useMemo(() => {
    if (!isFlipping) return undefined;
    return flipDirection === 'forward' ? rightPage : leftPage;
  }, [isFlipping, flipDirection, rightPage, leftPage]);
  
  const flipBackContent = useMemo(() => {
    if (!isFlipping || !nextSpread) return undefined;
    return flipDirection === 'forward' ? nextSpread.leftPage : nextSpread.rightPage;
  }, [isFlipping, flipDirection, nextSpread]);
  
  // Signal ready state after render
  useEffect(() => {
    if (!loading && !error && book) {
      // Give React a moment to complete rendering
      const timer = setTimeout(() => {
        setIsReady(true);
        // Set a global flag that Puppeteer can check
        (window as any).__RENDER_READY__ = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, error, book]);
  
  // Get theme config
  const themeConfig = READING_THEMES[theme];
  
  // Render loading state
  if (loading) {
    return (
      <div 
        className="flex items-center justify-center"
        style={{ 
          width: FRAME_WIDTH, 
          height: FRAME_HEIGHT,
          backgroundColor: '#1a1a1a',
          color: '#fff',
        }}
      >
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }
  
  // Render error state
  if (error || !book) {
    return (
      <div 
        className="flex items-center justify-center flex-col gap-4"
        style={{ 
          width: FRAME_WIDTH, 
          height: FRAME_HEIGHT,
          backgroundColor: '#1a1a1a',
          color: '#ff4444',
        }}
      >
        <div className="text-2xl">Error Loading Book</div>
        <div className="text-lg opacity-80 max-w-lg text-center px-8">
          {error || 'Book not found'}
        </div>
        <div className="text-sm opacity-60">Book ID: {bookId}</div>
      </div>
    );
  }
  
  const currentChapter = book.chapters[chapterIndex];
  
  return (
    <div 
      id="render-container"
      data-ready={isReady}
      className="relative overflow-hidden"
      style={{ 
        width: FRAME_WIDTH, 
        height: FRAME_HEIGHT,
        background: `linear-gradient(135deg, ${themeConfig.background.split(' ').join(', ')})`,
      }}
    >
      {/* Centered book container */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ padding: '60px' }}
      >
        <div 
          className="relative"
          style={{
            // Scale the book to fit the 1920x1080 frame with comfortable margins
            // Book3D dimensions: ~1020px wide (500+20+500) x 680px tall
            // At 1.35x scale: 1377px x 918px - fits well in 1920x1080 with margins
            transform: 'scale(1.35)',
            transformOrigin: 'center center',
          }}
        >
          <Book3D
            leftPageContent={leftPage}
            rightPageContent={rightPage}
            leftPageNumber={leftPageNumber}
            rightPageNumber={rightPageNumber}
            totalPages={totalPagesInChapter}
            chapterTitle={currentChapter?.title || ''}
            theme={theme}
            fontSize={fontSize}
            isFlipping={isFlipping}
            flipDirection={flipDirection}
            flipFrontContent={flipFrontContent}
            flipBackContent={flipBackContent}
            onFlipComplete={() => {}}
            onPageClick={() => {}}
            // Audio sync for text highlighting in video
            chapterWordStarts={chapterWordStarts}
            currentWordIndex={currentWordIndex}
            isAudioPlaying={isAudioPlaying}
          />
        </div>
      </div>
      
      {/* Chapter title overlay (top) */}
      <div 
        className="absolute top-0 left-0 right-0 flex justify-center pt-4"
        style={{ 
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)',
          paddingBottom: '40px',
        }}
      >
        <div 
          className="text-center"
          style={{ color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
        >
          <div className="text-lg font-medium opacity-80">{book.title}</div>
          <div className="text-sm opacity-60">{book.author}</div>
        </div>
      </div>
      
      {/* Page numbers overlay (bottom) */}
      <div 
        className="absolute bottom-0 left-0 right-0 flex justify-center pb-4"
        style={{ 
          background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)',
          paddingTop: '40px',
        }}
      >
        <div 
          className="text-center"
          style={{ color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
        >
          <div className="text-base opacity-80">
            {currentChapter?.title} - Pages {leftPageNumber}-{rightPageNumber} of {totalPagesInChapter}
          </div>
        </div>
      </div>
    </div>
  );
}

// Default export wraps content in Suspense for useSearchParams
export default function RenderBookPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RenderBookContent />
    </Suspense>
  );
}
