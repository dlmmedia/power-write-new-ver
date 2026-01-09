'use client';

import React from 'react';
import { Chapter, FontSize, PaginatedContent, FONT_SIZE_CONFIG } from './types';

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
    sm: 7.5,
    base: 8.5,
    lg: 10,
    xl: 11.5,
  };

  const lineHeight: Record<FontSize, number> = {
    sm: 24,
    base: 28,
    lg: 34,
    xl: 42,
  };

  const charsPerLine = Math.floor(pageWidth / avgCharWidth[fontSize]);
  const linesPerPage = Math.floor(pageHeight / lineHeight[fontSize]);

  // Split content into paragraphs
  const paragraphs = content
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const pages: string[][] = [];
  let currentPage: string[] = [];
  let currentLineCount = 0;

  for (const paragraph of paragraphs) {
    // Estimate lines this paragraph will take (including spacing)
    const estimatedLines = Math.ceil(paragraph.length / charsPerLine) + 1;

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
      const words = paragraph.split(' ');
      let chunk = '';
      let chunkLines = 0;

      for (const word of words) {
        const testChunk = chunk + (chunk ? ' ' : '') + word;
        const testLines = Math.ceil(testChunk.length / charsPerLine);

        if (testLines > linesPerPage - currentLineCount) {
          if (chunk) {
            currentPage.push(chunk);
            pages.push(currentPage);
            currentPage = [];
            currentLineCount = 0;
          }
          chunk = word;
          chunkLines = Math.ceil(word.length / charsPerLine);
        } else {
          chunk = testChunk;
          chunkLines = testLines;
        }
      }

      if (chunk) {
        currentPage.push(chunk);
        currentLineCount += chunkLines + 1;
      }
    } else {
      currentPage.push(paragraph);
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
  leftPage: string[];
  rightPage: string[];
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
  paragraphs: string[];
  fontSize: FontSize;
  textColor: string;
  showChapterHeader?: boolean;
  chapterTitle?: string;
  accentColor?: string;
}

export const PageContent: React.FC<PageContentProps> = ({
  paragraphs,
  fontSize,
  textColor,
  showChapterHeader = false,
  chapterTitle = '',
  accentColor = '#d97706',
}) => {
  const fontConfig = FONT_SIZE_CONFIG[fontSize];

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
        {paragraphs.map((paragraph, index) => (
          <p
            key={index}
            className={`mb-5 text-justify ${fontConfig.className} ${fontConfig.lineHeight}`}
            style={{
              color: textColor,
              fontFamily: '"EB Garamond", "Crimson Pro", Georgia, serif',
              textIndent: index > 0 ? '2.5em' : '0',
              hyphens: 'auto',
              WebkitHyphens: 'auto',
              wordBreak: 'break-word',
              letterSpacing: '0.01em',
            }}
          >
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
};

export default PageContent;
