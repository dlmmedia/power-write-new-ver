/**
 * Pagination Utilities
 * 
 * Shared pagination logic that can be used on both client and server.
 * This is extracted from components/library/reader/PageContent.tsx to allow server-side usage.
 */

// Types (duplicated here to avoid importing from client components)
export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | 'xxl';

export interface TextChunk {
  text: string;
  startCharIndex: number;
  endCharIndex: number;
  isParagraphStart?: boolean;
}

export interface PaginatedContent {
  pages: TextChunk[][];
  totalPages: number;
}

export interface ChapterData {
  content: string;
}

// Font size configuration
export const FONT_SIZE_CONFIG: Record<FontSize, { 
  className: string; 
  lineHeight: string;
  linesPerPage: number;
}> = {
  xs: { className: 'text-sm', lineHeight: 'leading-relaxed', linesPerPage: 30 },
  sm: { className: 'text-base', lineHeight: 'leading-relaxed', linesPerPage: 28 },
  base: { className: 'text-lg', lineHeight: 'leading-relaxed', linesPerPage: 24 },
  lg: { className: 'text-xl', lineHeight: 'leading-loose', linesPerPage: 20 },
  xl: { className: 'text-2xl', lineHeight: 'leading-loose', linesPerPage: 16 },
  xxl: { className: 'text-3xl', lineHeight: 'leading-snug', linesPerPage: 13 },
};

// Page dimensions for the enhanced 3D book
const PAGE_WIDTH = 440;
const PAGE_HEIGHT = 580;

/**
 * Split text content into pages
 */
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

/**
 * Paginate all chapters and return structured data
 */
export function paginateBook(
  chapters: ChapterData[],
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

/**
 * Get pages for a two-page spread
 */
export function getSpreadPages(
  chapterPages: PaginatedContent[],
  currentChapter: number,
  currentPage: number
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
