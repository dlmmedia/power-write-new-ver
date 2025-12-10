// Professional PDF Generation Service using PDFKit
// Production-ready book formatting with publishing industry standards
// Supports all trim sizes, typography options, and publishing settings

import PDFDocument from 'pdfkit';
import { 
  PublishingSettings, 
  DEFAULT_PUBLISHING_SETTINGS,
  TRIM_SIZES 
} from '@/lib/types/publishing';
import { Reference, BibliographyConfig } from '@/lib/types/bibliography';
import { CitationService } from './citation-service';
import { sanitizeForExport } from '@/lib/utils/text-sanitizer';
import { isNovel } from '@/lib/utils/book-type';

// =============================================
// PROFESSIONAL BOOK FORMATTING CONSTANTS
// =============================================

// Standard book trim sizes in inches (width x height)
const TRIM_SIZE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  // Mass Market & Pocket
  'mass-market': { width: 4.25, height: 6.87 },
  'pocket': { width: 4.37, height: 7 },
  
  // Trade Paperback (most common)
  'trade-5x8': { width: 5, height: 8 },
  'trade-5.25x8': { width: 5.25, height: 8 },
  'trade-5.5x8.5': { width: 5.5, height: 8.5 },
  'digest': { width: 5.5, height: 8.25 },
  
  // Standard Non-Fiction (6x9 is the most popular)
  'us-trade-6x9': { width: 6, height: 9 },
  'royal-6.14x9.21': { width: 6.14, height: 9.21 },
  
  // Large Format
  'us-letter': { width: 8.5, height: 11 },
  'a4': { width: 8.27, height: 11.69 },
  'a5': { width: 5.83, height: 8.27 },
  
  // Children's Books
  'children-square-8.5': { width: 8.5, height: 8.5 },
  'children-landscape-11x8.5': { width: 11, height: 8.5 },
  'children-portrait-8.5x11': { width: 8.5, height: 11 },
  'middle-grade': { width: 5.25, height: 7.5 },
  
  // Hardcover
  'hardcover-6x9': { width: 6, height: 9 },
  'hardcover-6.5x9.5': { width: 6.5, height: 9.5 },
  'hardcover-7x10': { width: 7, height: 10 },
  
  // Coffee Table / Art Books
  'coffee-table-11x8.5': { width: 11, height: 8.5 },
  'coffee-table-12x12': { width: 12, height: 12 },
  'photo-10x8': { width: 10, height: 8 },
  
  // Young Adult
  'ya-5.5x8.25': { width: 5.5, height: 8.25 },
};

// Professional margin presets (in inches) based on publishing standards
// Inside margin (gutter) should be larger to account for binding
const MARGIN_PRESETS: Record<string, { top: number; bottom: number; inside: number; outside: number }> = {
  'tight': { top: 0.5, bottom: 0.5, inside: 0.625, outside: 0.5 },
  'normal': { top: 0.75, bottom: 0.75, inside: 0.875, outside: 0.75 },
  'comfortable': { top: 1, bottom: 1, inside: 1, outside: 0.75 },
  'wide': { top: 1, bottom: 1, inside: 1.125, outside: 0.875 },
  'academic': { top: 1, bottom: 1, inside: 1.5, outside: 1 },
};

// =============================================
// TYPES & INTERFACES
// =============================================

interface BookExport {
  title: string;
  author: string;
  coverUrl?: string;
  backCoverUrl?: string;
  chapters: Array<{
    number: number;
    title: string;
    content: string;
  }>;
  description?: string;
  genre?: string;
  bibliography?: {
    config: BibliographyConfig;
    references: Reference[];
  };
  publishingSettings?: PublishingSettings;
}

interface PageDimensions {
  width: number;      // Page width in points
  height: number;     // Page height in points
  marginTop: number;
  marginBottom: number;
  marginInside: number;
  marginOutside: number;
  contentWidth: number;
  contentHeight: number;
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Convert inches to points (72 points per inch - PDF standard)
 */
function inchesToPoints(inches: number): number {
  return inches * 72;
}

/**
 * Safe number helper - ensures valid finite numbers within bounds
 */
function safeNum(value: number | undefined | null, defaultValue: number, min?: number, max?: number): number {
  if (value === undefined || value === null || !isFinite(value) || isNaN(value)) {
    return defaultValue;
  }
  let result = value;
  if (min !== undefined) result = Math.max(min, result);
  if (max !== undefined) result = Math.min(max, result);
  return result;
}

/**
 * Get trim size dimensions from ID, with fallback to 6x9
 */
function getTrimSizeDimensions(trimSizeId: string): { width: number; height: number } {
  // Check our local map first
  if (TRIM_SIZE_DIMENSIONS[trimSizeId]) {
    return TRIM_SIZE_DIMENSIONS[trimSizeId];
  }
  
  // Check the TRIM_SIZES array from publishing types
  const size = TRIM_SIZES.find(s => s.id === trimSizeId);
  if (size) {
    return { width: size.width, height: size.height };
  }
  
  // Default to 6x9 (most common trade paperback size)
  return { width: 6, height: 9 };
}

/**
 * Calculate page dimensions from publishing settings
 */
function calculatePageDimensions(settings?: PublishingSettings): PageDimensions {
  // Use default settings if none provided
  const s = settings || DEFAULT_PUBLISHING_SETTINGS;
  
  // Get trim size
  const trimSizeId = s.trimSize || 'us-trade-6x9';
  const trimSize = getTrimSizeDimensions(trimSizeId);
  
  // Handle orientation
  const isLandscape = s.orientation === 'landscape';
  const width = inchesToPoints(isLandscape ? trimSize.height : trimSize.width);
  const height = inchesToPoints(isLandscape ? trimSize.width : trimSize.height);
  
  // Get margins - use preset if available, otherwise use individual values
  const marginPreset = s.marginPreset || 'normal';
  const defaultMargins = MARGIN_PRESETS[marginPreset] || MARGIN_PRESETS['normal'];
  
  const margins = s.margins || {};
  const marginTop = inchesToPoints(safeNum(margins.top, defaultMargins.top, 0.25, 2));
  const marginBottom = inchesToPoints(safeNum(margins.bottom, defaultMargins.bottom, 0.25, 2));
  const marginInside = inchesToPoints(safeNum(margins.inside, defaultMargins.inside, 0.5, 2));
  const marginOutside = inchesToPoints(safeNum(margins.outside, defaultMargins.outside, 0.25, 1.5));
  
  return {
    width,
    height,
    marginTop,
    marginBottom,
    marginInside,
    marginOutside,
    contentWidth: width - marginInside - marginOutside,
    contentHeight: height - marginTop - marginBottom,
  };
}

/**
 * Convert number to Roman numerals (lowercase for front matter)
 */
function toRoman(num: number): string {
  if (num <= 0 || num > 3999) return String(num);
  
  const romanNumerals: [number, string][] = [
    [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'],
    [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'],
    [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']
  ];
  
  let result = '';
  for (const [value, numeral] of romanNumerals) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}

/**
 * Format chapter number based on style setting
 */
function formatChapterNumber(num: number, style: string): string {
  switch (style) {
    case 'roman':
      return toRoman(num).toUpperCase();
    case 'word':
      const words = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 
        'Eighteen', 'Nineteen', 'Twenty', 'Twenty-One', 'Twenty-Two', 'Twenty-Three',
        'Twenty-Four', 'Twenty-Five', 'Twenty-Six', 'Twenty-Seven', 'Twenty-Eight',
        'Twenty-Nine', 'Thirty'];
      return num <= 30 ? words[num] : String(num);
    case 'ordinal':
      const ordinals = ['', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 
        'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth'];
      return num <= 12 ? ordinals[num] : String(num) + (num % 10 === 1 && num !== 11 ? 'st' : 
                                                         num % 10 === 2 && num !== 12 ? 'nd' :
                                                         num % 10 === 3 && num !== 13 ? 'rd' : 'th');
    default:
      return String(num);
  }
}

/**
 * Get scene break symbol from settings
 */
function getSceneBreakSymbol(settings?: PublishingSettings): string {
  const style = settings?.chapters?.sceneBreakStyle || 'asterisks';
  switch (style) {
    case 'blank-line': return '';
    case 'asterisks': return '* * *';
    case 'ornament': return '❦';
    case 'number': return '§';
    case 'custom': return settings?.chapters?.sceneBreakSymbol || '* * *';
    default: return '* * *';
  }
}

/**
 * Sanitize chapter content - remove duplicate titles and AI artifacts
 * Uses centralized sanitizer for consistency across all exports
 */
function sanitizeChapterContent(chapter: { number: number; title: string; content: string }): string {
  // First, apply the centralized sanitizer to remove AI artifacts
  let cleaned = sanitizeForExport(chapter.content.trim());
  
  // Remove duplicate chapter titles from content
  const escapedTitle = chapter.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`^Chapter\\s+${chapter.number}[:\\s-]+${escapedTitle}[\\s\\.,:;!?]*\\n*`, 'im'),
    new RegExp(`^Chapter\\s+${chapter.number}\\s*[-–—]\\s*${escapedTitle}[\\s\\.,:;!?]*\\n*`, 'im'),
    new RegExp(`^Chapter\\s+${chapter.number}[:\\s-]*\\n*`, 'im'),
    new RegExp(`^${escapedTitle}\\s*\\n+`, 'im'),
  ];
  
  for (const pattern of patterns) {
    cleaned = cleaned.replace(pattern, '').trim();
  }
  
  // Normalize multiple newlines to double newlines (paragraph breaks)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  return cleaned;
}

/**
 * Check if text is a scene break marker
 */
function isSceneBreak(text: string): boolean {
  const trimmed = text.trim();
  return trimmed === '***' || 
         trimmed === '* * *' || 
         trimmed === '---' || 
         trimmed === '- - -' ||
         trimmed === '###' ||
         trimmed === '# # #' ||
         (trimmed.length <= 7 && /^[*\-#\s]+$/.test(trimmed));
}

// =============================================
// MAIN PDF SERVICE CLASS
// =============================================

export class PDFServicePDFKit {
  
  /**
   * Generate a professional book PDF using PDFKit
   * Follows publishing industry standards for layout and typography
   */
  static async generateBookPDF(book: BookExport): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        console.log('Starting PDFKit book generation:', book.title);
        
        // Get page dimensions from settings
        const dims = calculatePageDimensions(book.publishingSettings);
        const settings = book.publishingSettings || DEFAULT_PUBLISHING_SETTINGS;
        
        console.log('Page dimensions:', {
          size: `${(dims.width / 72).toFixed(2)}" x ${(dims.height / 72).toFixed(2)}"`,
          margins: {
            top: `${(dims.marginTop / 72).toFixed(2)}"`,
            bottom: `${(dims.marginBottom / 72).toFixed(2)}"`,
            inside: `${(dims.marginInside / 72).toFixed(2)}"`,
            outside: `${(dims.marginOutside / 72).toFixed(2)}"`
          }
        });
        
        // Typography settings with safe defaults
        const typography = settings.typography || DEFAULT_PUBLISHING_SETTINGS.typography;
        const bodyFontSize = safeNum(typography.bodyFontSize, 11, 8, 16);
        const lineHeight = safeNum(typography.bodyLineHeight, 1.5, 1.2, 2.0);
        const chapterTitleSize = safeNum(typography.chapterTitleSize, 18, 14, 36);
        const paragraphIndent = safeNum(typography.paragraphIndent, 0.3, 0, 1) * 72; // Convert to points
        
        // Chapter settings
        const chapterSettings = settings.chapters || DEFAULT_PUBLISHING_SETTINGS.chapters;
        const headerFooterSettings = settings.headerFooter || DEFAULT_PUBLISHING_SETTINGS.headerFooter;
        
        // Determine if this book should show "A Novel By" label
        const bookType = settings?.bookType;
        const showNovelLabel = isNovel(book.genre, bookType);
        
        // Create the PDF document
        const doc = new PDFDocument({
          size: [dims.width, dims.height],
          margins: {
            top: dims.marginTop,
            bottom: dims.marginBottom,
            left: dims.marginInside,
            right: dims.marginOutside,
          },
          info: {
            Title: book.title,
            Author: book.author,
            Creator: 'PowerWrite by Dynamic Labs Media',
            Producer: 'PDFKit',
            Subject: book.genre || 'Book',
          },
          autoFirstPage: false,
          bufferPages: true,
        });
        
        // Collect PDF chunks
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => {
          const result = Buffer.concat(chunks);
          console.log('PDF generated successfully. Size:', result.length, 'bytes');
          resolve(result);
        });
        doc.on('error', reject);
        
        // Page tracking
        let currentPageNum = 0;
        let contentStartPage = 0;
        
        // Helper to add a new page
        const addPage = (isContent: boolean = false): void => {
          doc.addPage();
          currentPageNum++;
          if (isContent && contentStartPage === 0) {
            contentStartPage = currentPageNum;
          }
        };
        
        // Helper to add page number
        const addPageNumber = (pageNum: number, style: 'arabic' | 'roman' = 'arabic', position: 'center' | 'outside' = 'center'): void => {
          const numStr = style === 'roman' ? toRoman(pageNum) : String(pageNum);
          const fontSize = safeNum(headerFooterSettings.footerFontSize, 10, 8, 12);
          
          doc.font('Times-Roman')
             .fontSize(fontSize)
             .fillColor('#555555');
          
          const y = dims.height - dims.marginBottom + 20;
          
          if (position === 'center') {
            doc.text(numStr, 0, y, {
              width: dims.width,
              align: 'center',
            });
          } else {
            // Outside margin - alternates based on odd/even
            const isOdd = currentPageNum % 2 === 1;
            doc.text(numStr, 0, y, {
              width: dims.width - (isOdd ? dims.marginOutside : dims.marginInside),
              align: isOdd ? 'right' : 'left',
            });
          }
        };
        
        // =============================================
        // COVER PAGE
        // =============================================
        addPage();
        
        // Dark background for cover
        doc.rect(0, 0, dims.width, dims.height).fill('#1a1a1a');
        
        // Cover layout
        const coverCenterY = dims.height / 2 - 60;
        
        // Title
        doc.font('Times-Bold')
           .fontSize(Math.min(36, dims.width / 12))
           .fillColor('#ffffff')
           .text(book.title, dims.marginInside, coverCenterY, {
             width: dims.contentWidth,
             align: 'center',
             lineGap: 8,
           });
        
        // Genre subtitle (if present)
        if (book.genre) {
          doc.font('Times-Roman')
             .fontSize(11)
             .fillColor('#888888')
             .text(book.genre.toUpperCase(), dims.marginInside, coverCenterY + 60, {
               width: dims.contentWidth,
               align: 'center',
               characterSpacing: 3,
             });
        }
        
        // Decorative divider
        const dividerY = coverCenterY + (book.genre ? 90 : 60);
        doc.strokeColor('#444444')
           .lineWidth(0.5)
           .moveTo(dims.width / 2 - 30, dividerY)
           .lineTo(dims.width / 2 + 30, dividerY)
           .stroke();
        
        // Author name
        doc.font('Times-Roman')
           .fontSize(16)
           .fillColor('#ffffff')
           .text(book.author, dims.marginInside, dividerY + 25, {
             width: dims.contentWidth,
             align: 'center',
           });
        
        // =============================================
        // TITLE PAGE
        // =============================================
        addPage();
        
        const titleY = dims.height * 0.35;
        
        doc.font('Times-Bold')
           .fontSize(Math.min(28, dims.width / 14))
           .fillColor('#1a1a1a')
           .text(book.title, dims.marginInside, titleY, {
             width: dims.contentWidth,
             align: 'center',
             lineGap: 6,
           });
        
        // Decorative line under title
        const titleDivY = titleY + 50;
        doc.strokeColor('#1a1a1a')
           .lineWidth(1.5)
           .moveTo(dims.width / 2 - 40, titleDivY)
           .lineTo(dims.width / 2 + 40, titleDivY)
           .stroke();
        
        // Author label - only show "A Novel By" for novels
        if (showNovelLabel) {
          doc.font('Times-Roman')
             .fontSize(9)
             .fillColor('#666666')
             .text('A  N O V E L  B Y', dims.marginInside, titleDivY + 25, {
               width: dims.contentWidth,
               align: 'center',
             });
          
          // Author name
          doc.font('Times-Italic')
             .fontSize(16)
             .fillColor('#333333')
             .text(book.author, dims.marginInside, titleDivY + 48, {
               width: dims.contentWidth,
               align: 'center',
             });
        } else {
          // Just show "by Author Name" for non-novels
          doc.font('Times-Italic')
             .fontSize(16)
             .fillColor('#333333')
             .text(`by ${book.author}`, dims.marginInside, titleDivY + 35, {
               width: dims.contentWidth,
               align: 'center',
             });
        }
        
        // Description (if present)
        if (book.description) {
          doc.font('Times-Roman')
             .fontSize(10)
             .fillColor('#555555')
             .text(book.description, dims.marginInside + 30, titleDivY + 100, {
               width: dims.contentWidth - 60,
               align: 'center',
               lineGap: 4,
             });
        }
        
        // Page number (roman numeral i)
        addPageNumber(1, 'roman', 'center');
        
        // =============================================
        // COPYRIGHT PAGE
        // =============================================
        addPage();
        
        const currentYear = new Date().getFullYear();
        const copyrightY = dims.height * 0.4;
        
        doc.font('Times-Bold')
           .fontSize(11)
           .fillColor('#1a1a1a')
           .text(book.title, dims.marginInside, copyrightY, {
             width: dims.contentWidth,
             align: 'center',
           });
        
        doc.font('Times-Italic')
           .fontSize(10)
           .fillColor('#444444')
           .text(`by ${book.author}`, dims.marginInside, copyrightY + 18, {
             width: dims.contentWidth,
             align: 'center',
           });
        
        // Copyright notice
        doc.font('Times-Roman')
           .fontSize(9)
           .fillColor('#555555')
           .text(`Copyright © ${currentYear} ${book.author}`, dims.marginInside, copyrightY + 50, {
             width: dims.contentWidth,
             align: 'center',
           })
           .text('All rights reserved.', dims.marginInside, copyrightY + 65, {
             width: dims.contentWidth,
             align: 'center',
           });
        
        // Legal text
        doc.font('Times-Roman')
           .fontSize(8)
           .fillColor('#666666')
           .text(
             'No part of this publication may be reproduced, stored in a retrieval system, ' +
             'or transmitted in any form or by any means—electronic, mechanical, photocopying, ' +
             'recording, or otherwise—without the prior written permission of the copyright holder.',
             dims.marginInside + 20,
             copyrightY + 95,
             {
               width: dims.contentWidth - 40,
               align: 'center',
               lineGap: 3,
             }
           );
        
        // Publisher info
        doc.font('Times-Bold')
           .fontSize(8)
           .fillColor('#555555')
           .text('PUBLISHED BY', dims.marginInside, copyrightY + 160, {
             width: dims.contentWidth,
             align: 'center',
             characterSpacing: 1,
           });
        
        doc.font('Times-Roman')
           .fontSize(9)
           .fillColor('#666666')
           .text('Dynamic Labs Media', dims.marginInside, copyrightY + 175, {
             width: dims.contentWidth,
             align: 'center',
           })
           .text('dlmworld.com', dims.marginInside, copyrightY + 188, {
             width: dims.contentWidth,
             align: 'center',
           });
        
        // PowerWrite credit
        doc.font('Times-Italic')
           .fontSize(8)
           .fillColor('#888888')
           .text('Created with PowerWrite', dims.marginInside, copyrightY + 220, {
             width: dims.contentWidth,
             align: 'center',
           });
        
        // Page number (roman numeral ii)
        addPageNumber(2, 'roman', 'center');
        
        // =============================================
        // TABLE OF CONTENTS
        // =============================================
        addPage();
        
        // TOC Header
        doc.font('Times-Bold')
           .fontSize(18)
           .fillColor('#1a1a1a')
           .text('C O N T E N T S', dims.marginInside, dims.marginTop + 30, {
             width: dims.contentWidth,
             align: 'center',
             characterSpacing: 2,
           });
        
        // Decorative line
        doc.strokeColor('#1a1a1a')
           .lineWidth(0.75)
           .moveTo(dims.width / 2 - 25, dims.marginTop + 60)
           .lineTo(dims.width / 2 + 25, dims.marginTop + 60)
           .stroke();
        
        // Calculate estimated page numbers for TOC
        // Approximation: average 300 words per page for trade paperback
        const wordsPerPage = Math.round(2000 / bodyFontSize * (dims.contentWidth / 300));
        let estimatedPage = 1;
        const chapterStartPages: number[] = [];
        
        book.chapters.forEach((chapter) => {
          chapterStartPages.push(estimatedPage);
          const wordCount = sanitizeChapterContent(chapter).split(/\s+/).length;
          const pages = Math.max(1, Math.ceil(wordCount / wordsPerPage));
          estimatedPage += pages;
        });
        
        // TOC entries
        let tocY = dims.marginTop + 90;
        const tocEntrySpacing = 22;
        
        book.chapters.forEach((chapter, index) => {
          const pageNum = chapterStartPages[index];
          const chapterLabel = `Chapter ${chapter.number}`;
          
          doc.font('Times-Roman')
             .fontSize(11)
             .fillColor('#1a1a1a');
          
          // Chapter label
          const labelWidth = doc.widthOfString(chapterLabel);
          doc.text(chapterLabel, dims.marginInside, tocY);
          
          // Chapter title
          doc.font('Times-Italic')
             .text(chapter.title, dims.marginInside + labelWidth + 15, tocY);
          
          // Page number (right-aligned)
          doc.font('Times-Roman')
             .text(String(pageNum), 0, tocY, {
               width: dims.width - dims.marginOutside,
               align: 'right',
             });
          
          // Dot leaders
          const titleEndX = dims.marginInside + labelWidth + 15 + doc.widthOfString(chapter.title);
          const pageNumStartX = dims.width - dims.marginOutside - doc.widthOfString(String(pageNum)) - 10;
          const dotsWidth = pageNumStartX - titleEndX - 20;
          
          if (dotsWidth > 30) {
            const numDots = Math.floor(dotsWidth / 4);
            const dotsStr = '.'.repeat(Math.max(5, numDots));
            doc.font('Times-Roman')
               .fontSize(10)
               .fillColor('#999999')
               .text(dotsStr, titleEndX + 10, tocY + 1, {
                 width: dotsWidth,
               });
          }
          
          tocY += tocEntrySpacing;
        });
        
        // Page number (roman numeral iii)
        addPageNumber(3, 'roman', 'center');
        
        // =============================================
        // CHAPTERS
        // =============================================
        const sceneBreakSymbol = getSceneBreakSymbol(settings);
        const chapterDropFromTop = safeNum(chapterSettings.chapterDropFromTop, 1.5, 0.5, 4) * 72;
        const numberStyle = chapterSettings.chapterNumberStyle || 'numeric';
        const titleCase = chapterSettings.chapterTitleCase || 'title-case';
        const showChapterNumber = chapterSettings.showChapterNumber !== false;
        const firstParagraphIndent = typography.firstParagraphIndent !== false;
        
        book.chapters.forEach((chapter, chapterIndex) => {
          // Start new page for each chapter
          addPage(true);
          
          // Calculate content page number
          const contentPageNum = currentPageNum - contentStartPage + 1;
          
          // Chapter header with drop from top
          let y = dims.marginTop + chapterDropFromTop;
          
          // Chapter number label
          if (showChapterNumber) {
            doc.font('Times-Roman')
               .fontSize(9)
               .fillColor('#666666')
               .text((chapterSettings.chapterNumberLabel || 'CHAPTER').toUpperCase(), dims.marginInside, y, {
                 width: dims.contentWidth,
                 align: 'center',
                 characterSpacing: 2,
               });
            
            y += 18;
            
            // Chapter number
            const chapterNumDisplay = formatChapterNumber(chapter.number, numberStyle);
            doc.font('Times-Bold')
               .fontSize(Math.min(chapterTitleSize * 1.2, 28))
               .fillColor('#1a1a1a')
               .text(chapterNumDisplay, dims.marginInside, y, {
                 width: dims.contentWidth,
                 align: 'center',
               });
            
            y += 30;
          }
          
          // Decorative divider
          doc.strokeColor('#888888')
             .lineWidth(0.5)
             .moveTo(dims.width / 2 - 20, y)
             .lineTo(dims.width / 2 + 20, y)
             .stroke();
          
          y += 15;
          
          // Chapter title
          let displayTitle = chapter.title;
          if (titleCase === 'uppercase') displayTitle = chapter.title.toUpperCase();
          else if (titleCase === 'lowercase') displayTitle = chapter.title.toLowerCase();
          
          const titlePosition = chapterSettings.chapterTitlePosition || 'centered';
          
          doc.font('Times-Italic')
             .fontSize(chapterTitleSize)
             .fillColor('#333333')
             .text(displayTitle, dims.marginInside, y, {
               width: dims.contentWidth,
               align: titlePosition === 'left' ? 'left' : titlePosition === 'right' ? 'right' : 'center',
             });
          
          y += chapterTitleSize + 35;
          
          // Chapter content
          const sanitizedContent = sanitizeChapterContent(chapter);
          const paragraphs = sanitizedContent.split(/\n\n+/).filter(p => p.trim());
          
          // Text options for body paragraphs
          const bodyAlign = typography.bodyAlignment || 'justify';
          const lineGap = (lineHeight - 1) * bodyFontSize;
          
          paragraphs.forEach((para, paraIndex) => {
            const trimmedPara = para.trim();
            
            // Skip empty paragraphs
            if (!trimmedPara) return;
            
            // Check if we need a new page
            if (y > dims.height - dims.marginBottom - bodyFontSize * 3) {
              // Add page number before new page
              if (headerFooterSettings.footerEnabled) {
                const showPageNum = headerFooterSettings.firstPageNumberVisible || 
                                   currentPageNum > contentStartPage + chapterIndex;
                if (showPageNum) {
                  addPageNumber(currentPageNum - contentStartPage + 1, 'arabic', 'center');
                }
              }
              
              addPage(true);
              y = dims.marginTop;
              
              // Running header on continuation pages
              if (headerFooterSettings.headerEnabled) {
                doc.font('Times-Italic')
                   .fontSize(8)
                   .fillColor('#888888')
                   .text(book.title.toUpperCase(), dims.marginInside, dims.marginTop - 20, {
                     width: dims.contentWidth / 2 - 10,
                   });
                
                doc.text(`Chapter ${chapter.number}`, dims.width / 2 + 10, dims.marginTop - 20, {
                  width: dims.contentWidth / 2 - 10,
                  align: 'right',
                });
                
                y = dims.marginTop + 10;
              }
            }
            
            // Handle scene breaks
            if (isSceneBreak(trimmedPara)) {
              if (sceneBreakSymbol) {
                doc.font('Times-Roman')
                   .fontSize(11)
                   .fillColor('#888888')
                   .text(sceneBreakSymbol, dims.marginInside, y + 12, {
                     width: dims.contentWidth,
                     align: 'center',
                     characterSpacing: 6,
                   });
              }
              y += 40;
              return;
            }
            
            // Regular paragraph
            doc.font('Times-Roman')
               .fontSize(bodyFontSize)
               .fillColor('#1a1a1a');
            
            // Calculate indent
            const useIndent = paraIndex > 0 || firstParagraphIndent;
            const indent = useIndent ? paragraphIndent : 0;
            
            // Render paragraph
            const textHeight = doc.heightOfString(trimmedPara, {
              width: dims.contentWidth - indent,
              align: bodyAlign as 'left' | 'center' | 'right' | 'justify',
              lineGap: lineGap,
            });
            
            // Check if paragraph fits on current page
            if (y + textHeight > dims.height - dims.marginBottom - 20) {
              // Add page number before new page
              if (headerFooterSettings.footerEnabled) {
                addPageNumber(currentPageNum - contentStartPage + 1, 'arabic', 'center');
              }
              
              addPage(true);
              y = dims.marginTop;
              
              // Running header
              if (headerFooterSettings.headerEnabled) {
                doc.font('Times-Italic')
                   .fontSize(8)
                   .fillColor('#888888')
                   .text(book.title.toUpperCase(), dims.marginInside, dims.marginTop - 20, {
                     width: dims.contentWidth / 2 - 10,
                   });
                
                doc.text(`Chapter ${chapter.number}`, dims.width / 2 + 10, dims.marginTop - 20, {
                  width: dims.contentWidth / 2 - 10,
                  align: 'right',
                });
                
                y = dims.marginTop + 10;
              }
            }
            
            doc.text(trimmedPara, dims.marginInside + indent, y, {
              width: dims.contentWidth - indent,
              align: bodyAlign as 'left' | 'center' | 'right' | 'justify',
              lineGap: lineGap,
            });
            
            y += textHeight + bodyFontSize * 0.3;
          });
          
          // Add page number at end of chapter
          if (headerFooterSettings.footerEnabled) {
            const showPageNum = headerFooterSettings.firstPageNumberVisible || chapterIndex > 0;
            if (showPageNum) {
              addPageNumber(currentPageNum - contentStartPage + 1, 'arabic', 'center');
            }
          }
        });
        
        // =============================================
        // BIBLIOGRAPHY (if enabled)
        // =============================================
        if (book.bibliography?.config?.enabled && book.bibliography.references.length > 0) {
          addPage(true);
          
          // Bibliography header
          doc.font('Times-Bold')
             .fontSize(18)
             .fillColor('#1a1a1a')
             .text('B I B L I O G R A P H Y', dims.marginInside, dims.marginTop + 30, {
               width: dims.contentWidth,
               align: 'center',
               characterSpacing: 2,
             });
          
          doc.strokeColor('#1a1a1a')
             .lineWidth(0.75)
             .moveTo(dims.width / 2 - 30, dims.marginTop + 60)
             .lineTo(dims.width / 2 + 30, dims.marginTop + 60)
             .stroke();
          
          let bibY = dims.marginTop + 90;
          const config = book.bibliography.config;
          
          // Sort references
          const sortedRefs = CitationService.sortReferences(
            book.bibliography.references,
            config.sortBy,
            config.sortDirection
          );
          
          sortedRefs.forEach((ref, index) => {
            // Check for new page
            if (bibY > dims.height - dims.marginBottom - 60) {
              addPage(true);
              bibY = dims.marginTop;
            }
            
            // Format reference
            let formatted = CitationService.formatReference(ref, config.citationStyle, index + 1);
            // Remove HTML tags
            formatted = formatted
              .replace(/<em>/g, '')
              .replace(/<\/em>/g, '')
              .replace(/<[^>]*>/g, '')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>');
            
            // Add numbering if configured
            if (config.numberingStyle === 'numeric') {
              formatted = `${index + 1}. ${formatted}`;
            }
            
            // Hanging indent
            const hangingIndent = 20;
            
            doc.font('Times-Roman')
               .fontSize(10)
               .fillColor('#1a1a1a');
            
            const refHeight = doc.heightOfString(formatted, {
              width: dims.contentWidth - hangingIndent,
              align: 'left',
              lineGap: 2,
            });
            
            doc.text(formatted, dims.marginInside + hangingIndent, bibY, {
              width: dims.contentWidth - hangingIndent,
              align: 'left',
              lineGap: 2,
              indent: -hangingIndent,
            });
            
            bibY += refHeight + 10;
          });
          
          // Style note
          doc.font('Times-Italic')
             .fontSize(9)
             .fillColor('#888888')
             .text(`References formatted in ${config.citationStyle} style.`, dims.marginInside, bibY + 20, {
               width: dims.contentWidth,
               align: 'center',
             });
          
          // Page number
          if (headerFooterSettings.footerEnabled) {
            addPageNumber(currentPageNum - contentStartPage + 1, 'arabic', 'center');
          }
        }
        
        // =============================================
        // BACK COVER (if provided)
        // =============================================
        if (book.backCoverUrl) {
          addPage();
          doc.rect(0, 0, dims.width, dims.height).fill('#1a1a1a');
        }
        
        // Finalize PDF
        doc.end();
        
      } catch (error) {
        console.error('PDFKit generation error:', error);
        reject(error);
      }
    });
  }
}
