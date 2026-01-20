'use client';

import React from 'react';
import { Chapter, FontSize, PaginatedContent, FONT_SIZE_CONFIG, TextChunk } from './types';

// Larger page dimensions for the enhanced 3D book
const PAGE_WIDTH = 440; // Increased from 320
const PAGE_HEIGHT = 580; // Increased from 480

// Utility to split text content into pages
export function paginateContent(
  content: string,
  fontSize: FontSize,
  pageHeight: number = PAGE_HEIGHT,
  pageWidth: number = PAGE_WIDTH
): PaginatedContent {
  const config = FONT_SIZE_CONFIG[fontSize];

  // Improved character width estimates for better pagination
  const avgCharWidth: Record<FontSize, number> = {
    xs: 7,
    sm: 7.5,
    base: 8.5,
    lg: 10,
    xl: 11.5,
    xxl: 13,
  };

  const lineHeight: Record<FontSize, number> = {
    xs: 22,
    sm: 24,
    base: 28,
    lg: 34,
    xl: 42,
    xxl: 50,
  };

  const charsPerLine = Math.floor(pageWidth / avgCharWidth[fontSize]);
  const linesPerPage = Math.floor(pageHeight / lineHeight[fontSize]);

  // Split content into paragraphs
  // Track global index
  let globalIndex = 0;
  const paragraphs = content
    .split(/\n\n+/)
    .map(p => {
      const start = content.indexOf(p, globalIndex);
      // If we can't find the exact paragraph (shouldn't happen with split), fallback
      const actualStart = start !== -1 ? start : globalIndex;
      globalIndex = actualStart + p.length;
      return {
        text: p.trim(),
        start: actualStart,
        end: actualStart + p.length
      };
    })
    .filter(p => p.text.length > 0);

  const pages: TextChunk[][] = [];
  let currentPage: TextChunk[] = [];
  let currentLineCount = 0;

  for (const paragraph of paragraphs) {
    // Estimate lines this paragraph will take (including spacing)
    const estimatedLines = Math.ceil(paragraph.text.length / charsPerLine) + 1;

    if (currentLineCount + estimatedLines > linesPerPage) {
      // Start new page if paragraph doesn't fit
      if (currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [];
        currentLineCount = 0;
      }
    }

    // Handle very long paragraphs that need to be split
    if (estimatedLines > linesPerPage) {
      // Split paragraph into chunks that fit on a page
      const words = paragraph.text.split(' ');
      let chunk = '';
      let chunkLines = 0;
      let currentChunkStart = paragraph.start;

      for (const word of words) {
        const testChunk = chunk + (chunk ? ' ' : '') + word;
        const testLines = Math.ceil(testChunk.length / charsPerLine);

        if (testLines > linesPerPage - currentLineCount) {
          if (chunk) {
            currentPage.push({
              text: chunk,
              startCharIndex: currentChunkStart,
              endCharIndex: currentChunkStart + chunk.length,
              isParagraphStart: currentChunkStart === paragraph.start
            });
            pages.push(currentPage);
            currentPage = [];
            currentLineCount = 0;
            
            // Advance start index by chunk length + space (approximate)
            currentChunkStart += chunk.length + 1; 
          }
          chunk = word;
          chunkLines = Math.ceil(word.length / charsPerLine);
        } else {
          chunk = testChunk;
          chunkLines = testLines;
        }
      }

      if (chunk) {
        currentPage.push({
          text: chunk,
          startCharIndex: currentChunkStart,
          endCharIndex: currentChunkStart + chunk.length,
          isParagraphStart: currentChunkStart === paragraph.start
        });
        currentLineCount += chunkLines + 1;
      }
    } else {
      currentPage.push({
        text: paragraph.text,
        startCharIndex: paragraph.start,
        endCharIndex: paragraph.end,
        isParagraphStart: true
      });
      currentLineCount += estimatedLines;
    }
  }

  // Don't forget the last page
  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  // Ensure we have at least one page (even if empty)
  if (pages.length === 0) {
    pages.push([]);
  }

  return {
    pages,
    totalPages: pages.length,
  };
}

// Paginate all chapters and return structured data
export function paginateBook(
  chapters: Chapter[],
  fontSize: FontSize
): {
  chapterPages: PaginatedContent[];
  totalBookPages: number;
  chapterStartPages: number[];
} {
  const chapterPages: PaginatedContent[] = [];
  const chapterStartPages: number[] = [];
  let totalBookPages = 0;

  for (const chapter of chapters) {
    chapterStartPages.push(totalBookPages);
    const paginated = paginateContent(chapter.content, fontSize);
    chapterPages.push(paginated);
    totalBookPages += paginated.totalPages;
  }

  return { chapterPages, totalBookPages, chapterStartPages };
}

// Hook to manage pagination with dynamic resizing (memoized for performance)
export function usePagination(chapters: Chapter[], fontSize: FontSize) {
  // Use useMemo for instant calculation without useEffect delay
  const pagination = React.useMemo(() => {
    return paginateBook(chapters, fontSize);
  }, [chapters, fontSize]);

  return pagination;
}

// Get pages for a two-page spread
export function getSpreadPages(
  chapterPages: PaginatedContent[],
  currentChapter: number,
  currentPage: number // 0-indexed page within chapter
): {
  leftPage: TextChunk[];
  rightPage: TextChunk[];
  leftPageNumber: number;
  rightPageNumber: number;
  totalPagesInChapter: number;
} {
  const chapter = chapterPages[currentChapter];

  if (!chapter) {
    return {
      leftPage: [],
      rightPage: [],
      leftPageNumber: 0,
      rightPageNumber: 0,
      totalPagesInChapter: 0,
    };
  }

  // For two-page spread, we show even page on left, odd on right
  // currentPage is the left page index (always even)
  const leftPageIndex = currentPage;
  const rightPageIndex = currentPage + 1;

  const leftPage = chapter.pages[leftPageIndex] || [];
  const rightPage = chapter.pages[rightPageIndex] || [];

  return {
    leftPage,
    rightPage,
    leftPageNumber: leftPageIndex + 1, // 1-indexed for display
    rightPageNumber: rightPageIndex + 1,
    totalPagesInChapter: chapter.totalPages,
  };
}

// Component to render page content
interface PageContentProps {
  content: TextChunk[];
  fontSize: FontSize;
  textColor: string;
  showChapterHeader?: boolean;
  chapterTitle?: string;
  accentColor?: string;
  audioTimestamps?: { word: string; start: number; end: number }[] | null;
  currentAudioTime?: number;
  isAudioPlaying?: boolean;
}

export const PageContent: React.FC<PageContentProps> = ({
  content,
  fontSize,
  textColor,
  showChapterHeader = false,
  chapterTitle = '',
  accentColor = '#d97706',
  audioTimestamps,
  currentAudioTime = 0,
  isAudioPlaying = false
}) => {
  const fontConfig = FONT_SIZE_CONFIG[fontSize];

  // Helper to check if a word matches current timestamp
  // We use a heuristic since we don't have perfect character mapping from backend
  const renderInteractiveText = (chunk: TextChunk) => {
    if (!isAudioPlaying || !audioTimestamps) return chunk.text;
    
    // Find valid timestamps for current time window
    // We look for a word that starts <= now and ends >= now
    const activeTimestamp = audioTimestamps.find(
      t => currentAudioTime >= t.start && currentAudioTime <= t.end
    );
    
    if (!activeTimestamp) return chunk.text;
    
    // Clean words for comparison
    const activeWordClean = activeTimestamp.word.trim().toLowerCase().replace(/[^\w]/g, "");
    if (!activeWordClean) return chunk.text;

    // Split paragraph into words while preserving delimiters/spaces
    const parts = chunk.text.split(/(\s+)/);
    
    // We need to find which occurrence of the word is the active one
    // This is hard without global indices. 
    // Simplified approach: Highlight ALL occurrences of the word in the current view? No, confusing.
    // Better approach: Since we don't have char indices in timestamps yet (future improvement),
    // we highlight if the word matches. 
    // Ideally we would sync the "current word index" from audio player state.
    
    return parts.map((part, i) => {
      const partClean = part.trim().toLowerCase().replace(/[^\w]/g, "");
      
      // Strict matching for now
      const isMatch = partClean === activeWordClean;
      
      if (isMatch) {
        return (
          <span 
            key={i} 
            className="bg-yellow-300 dark:bg-yellow-600/60 text-black dark:text-white rounded px-0.5 shadow-sm transition-all duration-75"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="h-full flex flex-col">
      {showChapterHeader && chapterTitle && (
        <div
          className="text-center mb-8 pb-5 border-b"
          style={{ borderColor: `${accentColor}30` }}
        >
          <span
            className="text-sm uppercase tracking-[0.25em] font-medium"
            style={{ color: accentColor }}
          >
            {chapterTitle}
          </span>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {content.map((chunk, index) => (
          <p
            key={index}
            className={`mb-5 text-justify ${fontConfig.className} ${fontConfig.lineHeight}`}
            style={{
              color: textColor,
              fontFamily: '"EB Garamond", "Crimson Pro", Georgia, serif',
              textIndent: chunk.isParagraphStart ? '2.5em' : '0',
              hyphens: 'auto',
              WebkitHyphens: 'auto',
              wordBreak: 'break-word',
              letterSpacing: '0.01em',
            }}
          >
            {renderInteractiveText(chunk)}
          </p>
        ))}
      </div>
    </div>
  );
};

export default PageContent;
