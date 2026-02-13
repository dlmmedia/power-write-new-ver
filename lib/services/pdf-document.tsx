// Professional PDF Document Component using React-PDF
// Production-ready layout with perfect page numbering and premium typography
// Implements accurate TOC page numbers and professional formatting
// Now uses PublishingSettings for full customization
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Link,
} from '@react-pdf/renderer';
import { FontFamilies } from './pdf-fonts';
import { Reference, BibliographyConfig, ChapterReferences } from '@/lib/types/bibliography';
import { CitationService } from './citation-service';
import { 
  PublishingSettings, 
  DEFAULT_PUBLISHING_SETTINGS, 
  TRIM_SIZES 
} from '@/lib/types/publishing';
import { 
  formatChapterNumber, 
  getSceneBreakSymbol, 
  getChapterOrnament,
  getTrimSizeDimensions,
  inchesToPoints 
} from '@/lib/utils/publishing-styles';
import { sanitizeForExport } from '@/lib/utils/text-sanitizer';
import { isNovel } from '@/lib/utils/book-type';

// Use Google Fonts with built-in fallback
const BODY_FONT = FontFamilies.primary;      // EBGaramond - elegant book serif
const HEADING_FONT = FontFamilies.primary;   // EBGaramond for consistency
const SANS_FONT = FontFamilies.sansSerif;    // Helvetica for labels

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
    chapterReferences?: ChapterReferences[];
  };
  publishingSettings?: PublishingSettings;
}

interface PDFDocumentProps {
  book: BookExport;
}

// Default constants for page estimation (used before settings are loaded)
const DEFAULT_CHARS_PER_PAGE = 2800;

// Default page dimensions (6x9 inches in points)
const DEFAULT_PAGE_WIDTH = 432; // 6 inches * 72 points
const DEFAULT_PAGE_HEIGHT = 648; // 9 inches * 72 points
const DEFAULT_MARGIN = 72; // 1 inch margin

// Safe number helper - returns default if value is invalid
const safeNumber = (value: number | undefined | null, defaultValue: number): number => {
  if (value === undefined || value === null || !isFinite(value) || isNaN(value)) {
    return defaultValue;
  }
  return value;
};

// Helper to get page dimensions from settings with safety checks
const getPageDimensions = (settings: PublishingSettings) => {
  // Get trim size with fallback to default 6x9
  const trimSize = settings?.trimSize 
    ? getTrimSizeDimensions(settings.trimSize) 
    : { width: 6, height: 9 };
  
  const rawWidth = inchesToPoints(safeNumber(trimSize.width, 6));
  const rawHeight = inchesToPoints(safeNumber(trimSize.height, 9));
  
  // Ensure valid dimensions
  const width = safeNumber(rawWidth, DEFAULT_PAGE_WIDTH);
  const height = safeNumber(rawHeight, DEFAULT_PAGE_HEIGHT);
  
  // Check orientation with fallback to portrait
  const isLandscape = settings?.orientation === 'landscape';
  
  // Get margins with fallback values
  const margins = settings?.margins || {};
  
  return {
    PAGE_WIDTH: isLandscape ? height : width,
    PAGE_HEIGHT: isLandscape ? width : height,
    MARGIN_TOP: safeNumber(inchesToPoints(safeNumber(margins.top, 1)), DEFAULT_MARGIN),
    MARGIN_BOTTOM: safeNumber(inchesToPoints(safeNumber(margins.bottom, 1)), DEFAULT_MARGIN),
    MARGIN_LEFT: safeNumber(inchesToPoints(safeNumber(margins.inside, 0.875)), DEFAULT_MARGIN),
    MARGIN_RIGHT: safeNumber(inchesToPoints(safeNumber(margins.outside, 0.625)), DEFAULT_MARGIN),
  };
};

// Helper to calculate content area
const getContentHeight = (settings: PublishingSettings) => {
  const dims = getPageDimensions(settings);
  return dims.PAGE_HEIGHT - dims.MARGIN_TOP - dims.MARGIN_BOTTOM - 80;
};

// Calculate chars per page based on font size
const getCharsPerPage = (settings: PublishingSettings) => {
  // Approximate: smaller fonts = more chars per page
  const baseFontSize = 11;
  const bodyFontSize = safeNumber(settings?.typography?.bodyFontSize, 11);
  const ratio = baseFontSize / bodyFontSize;
  return Math.round(2800 * ratio);
};

// Standard page sizes mapping
const STANDARD_PAGE_SIZES: Record<string, string> = {
  'us-trade-6x9': 'LETTER',        // Close match
  'us-digest-5.5x8.5': 'A5',       // Close match
  'us-letter-8.5x11': 'LETTER',
  'mass-market-4.25x6.87': 'A6',   // Close match
  'royal-6.14x9.21': 'A5',         // Close match
  'a4': 'A4',
  'a5': 'A5',
  'b5': 'B5',
  'custom': 'LETTER',              // Default fallback
};

// Type for react-pdf PageSize
type PageSizeType = 'A4' | 'A5' | 'A6' | 'B5' | 'LETTER' | 'LEGAL' | [number, number] | { width: number; height: number };

// Get page size in format react-pdf accepts
const getPageSizeArray = (settings: PublishingSettings): PageSizeType => {
  const trimSize = settings?.trimSize || 'us-trade-6x9';
  const dims = getPageDimensions(settings);
  
  // Validate dimensions are reasonable (between 100-2000 points)
  const width = Math.round(dims.PAGE_WIDTH);
  const height = Math.round(dims.PAGE_HEIGHT);
  
  console.log('Page size calculation:', { width, height, trimSize });
  
  // If dimensions are invalid, fall back to A4
  if (!isFinite(width) || !isFinite(height) || width < 100 || width > 2000 || height < 100 || height > 2000) {
    console.warn('Invalid page dimensions, falling back to A4:', { width, height });
    return 'A4';
  }
  
  // Try to use a standard page size first (better PDF compatibility)
  const standardSize = STANDARD_PAGE_SIZES[trimSize] as PageSizeType | undefined;
  if (standardSize && trimSize !== 'custom') {
    console.log('Using standard page size:', standardSize);
    return standardSize;
  }
  
  // For custom sizes, use object format
  console.log('Using custom page size:', { width, height });
  return { width, height };
};

// Professional publishing-quality color palette
const colors = {
  primary: '#1a1a1a',        // Rich black for main text
  secondary: '#3d3d3d',      // Dark gray for secondary text
  accent: '#2c2c2c',         // Darker accent
  muted: '#666666',          // Muted gray for subtle elements
  light: '#888888',          // Light gray for decorative elements
  divider: '#cccccc',        // Very light for divider lines
  pageNum: '#555555',        // Page number color
  background: '#ffffff',      // Clean white background
};

// Premium publishing-quality styles with professional typography
// Using Google Fonts (EBGaramond) with built-in fallbacks (Times-Roman, Helvetica)
const styles = StyleSheet.create({
  // =============================================
  // COVER PAGE - Full bleed, dramatic presence
  // =============================================
  coverPage: {
    padding: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  coverTextContainer: {
    padding: 72,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  coverTitle: {
    fontFamily: BODY_FONT,
    fontWeight: 700,
    fontSize: 48,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 1,
  },
  coverSubtitle: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontStyle: 'italic',
    fontSize: 14,
    color: '#bbbbbb',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  coverAuthor: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 3,
  },
  coverDivider: {
    width: 60,
    height: 1,
    backgroundColor: '#555555',
    marginVertical: 30,
  },

  // =============================================
  // TITLE PAGE - Elegant and centered
  // =============================================
  titlePage: {
    padding: 72,
    paddingBottom: 72,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  titleContainer: {
    alignItems: 'center',
    width: '100%',
  },
  titleMain: {
    fontFamily: BODY_FONT,
    fontWeight: 700,
    fontSize: 38,
    textAlign: 'center',
    marginBottom: 12,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  titleDivider: {
    width: 80,
    height: 2,
    backgroundColor: colors.primary,
    marginVertical: 24,
  },
  titleAuthorLabel: {
    fontFamily: SANS_FONT,
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 6,
    color: colors.muted,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  titleAuthor: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontStyle: 'italic',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 48,
    color: colors.secondary,
  },
  titleDescription: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 1.8,
    marginTop: 32,
    paddingHorizontal: 48,
    color: colors.secondary,
  },
  titleGenre: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontStyle: 'italic',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 16,
    color: colors.muted,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },

  // =============================================
  // COPYRIGHT PAGE - Legal but elegant
  // =============================================
  copyrightPage: {
    padding: 72,
    paddingTop: 180,
    paddingBottom: 100,
    fontSize: 9,
    lineHeight: 1.6,
    backgroundColor: colors.background,
  },
  copyrightTitle: {
    fontFamily: BODY_FONT,
    fontWeight: 700,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
    color: colors.primary,
  },
  copyrightAuthorLine: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontStyle: 'italic',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 28,
    color: colors.secondary,
  },
  copyrightNotice: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontSize: 9,
    textAlign: 'center',
    marginBottom: 8,
    color: colors.secondary,
  },
  copyrightDivider: {
    width: 40,
    height: 1,
    backgroundColor: colors.divider,
    alignSelf: 'center',
    marginVertical: 20,
  },
  copyrightBody: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontSize: 8,
    textAlign: 'center',
    lineHeight: 1.7,
    marginBottom: 12,
    color: colors.muted,
    paddingHorizontal: 32,
  },
  publisherSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  publisherTitle: {
    fontFamily: SANS_FONT,
    fontWeight: 700,
    fontSize: 8,
    marginBottom: 8,
    color: colors.secondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  publisherInfo: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontSize: 8,
    textAlign: 'center',
    marginBottom: 4,
    color: colors.muted,
  },
  poweredBy: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontStyle: 'italic',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 32,
    color: colors.light,
  },

  // =============================================
  // TABLE OF CONTENTS - Simple text-based layout
  // =============================================
  tocPage: {
    padding: 72,
    paddingBottom: 100,
    backgroundColor: colors.background,
  },
  tocHeader: {
    marginBottom: 50,
    alignItems: 'center',
  },
  tocTitle: {
    fontFamily: SANS_FONT,
    fontWeight: 700,
    fontSize: 24,
    textAlign: 'center',
    color: colors.primary,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  tocDivider: {
    width: 50,
    height: 1,
    backgroundColor: colors.primary,
    marginTop: 20,
  },
  tocEntry: {
    marginBottom: 18,
    paddingHorizontal: 10,
  },
  tocEntryText: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontSize: 11,
    color: colors.primary,
    lineHeight: 1.6,
  },

  // =============================================
  // CHAPTER PAGES - The heart of the book
  // =============================================
  chapterOpeningPage: {
    padding: 72,
    paddingTop: 120,
    paddingBottom: 100,
    fontFamily: BODY_FONT,
    fontSize: 11,
    lineHeight: 1.7,
    color: colors.primary,
    backgroundColor: colors.background,
  },
  chapterHeader: {
    marginBottom: 48,
    alignItems: 'center',
  },
  chapterNumberLabel: {
    fontFamily: SANS_FONT,
    fontSize: 9,
    textAlign: 'center',
    color: colors.muted,
    letterSpacing: 5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  chapterNumber: {
    fontFamily: BODY_FONT,
    fontWeight: 700,
    fontSize: 32,
    textAlign: 'center',
    color: colors.primary,
    marginBottom: 14,
  },
  chapterTitleDivider: {
    width: 36,
    height: 1,
    backgroundColor: colors.muted,
    marginBottom: 16,
  },
  chapterTitle: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontStyle: 'italic',
    fontSize: 18,
    textAlign: 'center',
    color: colors.secondary,
    letterSpacing: 0.5,
    paddingHorizontal: 20,
  },

  // Paragraph styles
  paragraphContainer: {
    marginTop: 0,
  },
  firstParagraph: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontSize: 11,
    textAlign: 'justify',
    lineHeight: 1.8,
    marginBottom: 14,
    textIndent: 0,
    color: colors.primary,
  },
  paragraph: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontSize: 11,
    textAlign: 'justify',
    lineHeight: 1.8,
    marginBottom: 12,
    textIndent: 28,
    color: colors.primary,
  },
  
  // Scene break - using simple asterisks
  sceneBreak: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontSize: 12,
    textAlign: 'center',
    color: colors.muted,
    marginVertical: 24,
    letterSpacing: 6,
  },

  // =============================================
  // PAGE NUMBERS - Fixed at bottom right
  // =============================================
  pageNumberContainer: {
    position: 'absolute',
    bottom: 36,
    right: 72,
    left: 72,
  },
  pageNumberText: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontSize: 10,
    color: colors.pageNum,
    textAlign: 'right',
  },
  
  // Front matter page number (roman numerals) - bottom right
  frontMatterPageNumText: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontStyle: 'italic',
    fontSize: 10,
    color: colors.muted,
    textAlign: 'right',
  },
  
  // Running header for continuation pages
  runningHeader: {
    position: 'absolute',
    top: 40,
    left: 72,
    right: 72,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  runningHeaderLeft: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontStyle: 'italic',
    fontSize: 8,
    color: colors.light,
    letterSpacing: 1,
  },
  runningHeaderRight: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontStyle: 'italic',
    fontSize: 8,
    color: colors.light,
    letterSpacing: 1,
  },

  // =============================================
  // BIBLIOGRAPHY STYLES
  // =============================================
  bibliographyPage: {
    padding: 72,
    paddingBottom: 100,
    backgroundColor: colors.background,
  },
  bibliographyHeader: {
    marginBottom: 40,
    alignItems: 'center',
  },
  bibliographyTitle: {
    fontFamily: SANS_FONT,
    fontWeight: 700,
    fontSize: 24,
    textAlign: 'center',
    color: colors.primary,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  bibliographyDivider: {
    width: 60,
    height: 2,
    backgroundColor: colors.primary,
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  bibliographyTypeHeading: {
    fontFamily: BODY_FONT,
    fontWeight: 700,
    fontSize: 14,
    color: colors.primary,
    marginTop: 20,
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  referenceEntry: {
    marginBottom: 10,
    paddingLeft: 24,
    textIndent: -24, // Hanging indent
  },
  referenceText: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontSize: 10,
    color: colors.primary,
    lineHeight: 1.6,
    textAlign: 'justify',
  },
  referenceTextItalic: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontStyle: 'italic',
    fontSize: 10,
    color: colors.primary,
    lineHeight: 1.6,
  },
  bibliographyNote: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontStyle: 'italic',
    fontSize: 9,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 30,
  },
});

// Helper to sanitize chapter content (remove duplicate titles and AI artifacts)
// Uses centralized sanitizer for consistency across all exports
const sanitizeChapterContent = (chapter: { number: number; title: string; content: string }): string => {
  // First, apply the centralized sanitizer to remove AI artifacts
  let cleaned = sanitizeForExport(chapter.content.trim());
  
  const escapedTitle = chapter.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  const patterns = [
    new RegExp(`^Chapter\\s+${chapter.number}[:\\s-]+${escapedTitle}[\\s\\.,:;!?]*`, 'im'),
    new RegExp(`^Chapter\\s+${chapter.number}\\s*[-–—]\\s*${escapedTitle}[\\s\\.,:;!?]*`, 'im'),
    new RegExp(`^Chapter\\s+${chapter.number}\\s+${escapedTitle}[\\s\\.,:;!?]*`, 'im'),
    new RegExp(`^Chapter\\s+${chapter.number}[:\\s-]*[\\s\\.,:;!?]*`, 'im'),
    new RegExp(`^${escapedTitle}[\\s\\.,:;!?]*`, 'im'),
  ];
  
  for (const pattern of patterns) {
    cleaned = cleaned.replace(pattern, '').trim();
  }
  
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  return cleaned;
};

// Helper to detect scene breaks in text
const isSceneBreak = (text: string): boolean => {
  const trimmed = text.trim();
  return trimmed === '***' || 
         trimmed === '* * *' || 
         trimmed === '---' || 
         trimmed === '- - -' ||
         (trimmed.length <= 5 && /^[*\-]+$/.test(trimmed.replace(/\s/g, '')));
};

// Convert number to Roman numerals (lowercase)
const toRoman = (num: number): string => {
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
};

// Calculate estimated page count for a chapter based on content length
// This provides accurate TOC page numbers
const estimateChapterPages = (content: string, charsPerPage: number = DEFAULT_CHARS_PER_PAGE): number => {
  // Count characters excluding whitespace-only sections
  const sanitized = sanitizeChapterContent({ number: 0, title: '', content });
  const charCount = sanitized.length;
  
  // Account for chapter header (takes about 1/4 page)
  const headerSpace = charsPerPage * 0.25;
  const effectiveChars = charCount + headerSpace;
  
  // Calculate pages, minimum 1 page per chapter
  return Math.max(1, Math.ceil(effectiveChars / charsPerPage));
};

// Calculate cumulative page numbers for all chapters
const calculateChapterPageNumbers = (
  chapters: Array<{ number: number; title: string; content: string }>,
  charsPerPage: number = DEFAULT_CHARS_PER_PAGE
): number[] => {
  const pageNumbers: number[] = [];
  let currentPage = 1; // Start at page 1 (after front matter)
  
  chapters.forEach((chapter, index) => {
    pageNumbers.push(currentPage);
    currentPage += estimateChapterPages(chapter.content, charsPerPage);
  });
  
  return pageNumbers;
};

const PDFDocument: React.FC<PDFDocumentProps> = ({ book }) => {
  const currentYear = new Date().getFullYear();
  
  // Get publishing settings (use defaults if not provided)
  const settings = book.publishingSettings || DEFAULT_PUBLISHING_SETTINGS;
  
  // Get page dimensions from settings
  const pageDims = getPageDimensions(settings);
  
  // DEBUG: Log page dimensions to verify they're valid
  console.log('PDF Page Dimensions:', pageDims);
  console.log('Trim size setting:', settings?.trimSize);
  console.log('Margins setting:', settings?.margins);
  
  // Page size as [width, height] array for react-pdf
  // Temporarily using A4 to debug the issue
  const pageSize = getPageSizeArray(settings);
  console.log('Computed page size:', pageSize);
  
  // Safe access to typography settings with defaults
  const typography = settings?.typography || {};
  const chapters = settings?.chapters || {};
  const headerFooter = settings?.headerFooter || {};
  
  // Get formatting values from settings with safety checks
  const bodyFontSize = safeNumber(typography.bodyFontSize, 11);
  const lineHeight = safeNumber(typography.bodyLineHeight, 1.7);
  const chapterTitleSize = safeNumber(typography.chapterTitleSize, 18);
  const paragraphIndentValue = safeNumber(typography.paragraphIndent, 0.3);
  const paragraphIndent = typography.paragraphIndentUnit === 'inches' 
    ? inchesToPoints(paragraphIndentValue)
    : paragraphIndentValue * bodyFontSize; // em conversion
  
  // Get scene break and ornament symbols with safety
  const sceneBreakSymbol = settings ? getSceneBreakSymbol(settings) : '* * *';
  const chapterOrnament = settings ? getChapterOrnament(settings) : '';
  
  // Front matter pages: cover (1) + title (1) + copyright (1) + TOC (1) = 4 pages
  // These don't get Arabic page numbers
  const FRONT_MATTER_PAGES = 4;
  
  // Pre-calculate chars per page and page numbers for Table of Contents
  const charsPerPage = getCharsPerPage(settings);
  const chapterPageNumbers = calculateChapterPageNumbers(book.chapters, charsPerPage);

  // Determine if this book should show "A Novel By" label
  const bookType = settings?.bookType;
  const showNovelLabel = isNovel(book.genre, bookType);

  return (
    <Document
      title={book.title}
      author={book.author}
      creator="PowerWrite by Dynamic Labs Media"
      producer="React-PDF"
      subject={book.genre || 'Book'}
    >
      {/* ========================================== */}
      {/* COVER PAGE - No page number */}
      {/* ========================================== */}
      <Page size={pageSize} style={styles.coverPage}>
        {book.coverUrl ? (
          <Image src={book.coverUrl} style={styles.coverImage} />
        ) : (
          <View style={styles.coverTextContainer}>
            <Text style={styles.coverTitle}>{book.title}</Text>
            {book.genre && (
              <Text style={styles.coverSubtitle}>{book.genre}</Text>
            )}
            <View style={styles.coverDivider} />
            <Text style={styles.coverAuthor}>{book.author}</Text>
          </View>
        )}
      </Page>

      {/* ========================================== */}
      {/* TITLE PAGE - Roman numeral i */}
      {/* ========================================== */}
      <Page size={pageSize} style={styles.titlePage}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleMain}>{book.title}</Text>
          <View style={styles.titleDivider} />
          {showNovelLabel ? (
            <>
              <Text style={styles.titleAuthorLabel}>A Novel By</Text>
              <Text style={styles.titleAuthor}>{book.author}</Text>
            </>
          ) : (
            <Text style={styles.titleAuthor}>by {book.author}</Text>
          )}
          {book.description && (
            <Text style={styles.titleDescription}>{book.description}</Text>
          )}
          {book.genre && (
            <Text style={styles.titleGenre}>{book.genre}</Text>
          )}
        </View>
        {/* No page number on title page - front matter */}
      </Page>

      {/* ========================================== */}
      {/* COPYRIGHT PAGE */}
      {/* ========================================== */}
      <Page size={pageSize} style={styles.copyrightPage}>
        <Text style={styles.copyrightTitle}>{book.title}</Text>
        <Text style={styles.copyrightAuthorLine}>by {book.author}</Text>
        
        <Text style={styles.copyrightNotice}>
          Copyright {currentYear} {book.author}
        </Text>
        <Text style={styles.copyrightNotice}>
          All rights reserved.
        </Text>
        
        <View style={styles.copyrightDivider} />
        
        <Text style={styles.copyrightBody}>
          No part of this publication may be reproduced, stored in a retrieval system, 
          or transmitted in any form or by any means - electronic, mechanical, photocopying, 
          recording, or otherwise - without the prior written permission of the copyright holder.
        </Text>
        
        <View style={styles.publisherSection}>
          <Text style={styles.publisherTitle}>Published By</Text>
          <Text style={styles.publisherInfo}>Dynamic Labs Media</Text>
          <Text style={styles.publisherInfo}>dlmworld.com</Text>
        </View>
        
        <Text style={styles.poweredBy}>
          Created with PowerWrite
        </Text>
        {/* No page number on copyright page - front matter */}
      </Page>

      {/* ========================================== */}
      {/* TABLE OF CONTENTS - Simple reliable layout */}
      {/* ========================================== */}
      <Page size={pageSize} style={styles.tocPage} wrap>
        <View style={styles.tocHeader}>
          <Text style={styles.tocTitle}>Contents</Text>
          <View style={styles.tocDivider} />
        </View>
        
        {book.chapters.map((chapter, index) => {
          // Create formatted TOC line with dots
          const chapterLabel = `Chapter ${chapter.number}`;
          const title = chapter.title;
          const pageNum = chapterPageNumbers[index];
          const totalChars = 70; // Total width in characters
          const textPart = `${chapterLabel}   ${title}`;
          const dotsNeeded = Math.max(5, totalChars - textPart.length - String(pageNum).length - 2);
          const dots = ' ' + '.'.repeat(dotsNeeded) + ' ';
          
          return (
            <View key={chapter.number} style={styles.tocEntry} wrap={false}>
              <Text style={styles.tocEntryText}>
                {chapterLabel}{'   '}{title}{dots}{pageNum}
              </Text>
            </View>
          );
        })}
        
        {/* Bibliography entry in TOC if enabled */}
        {book.bibliography?.config.enabled && book.bibliography.references.length > 0 && (() => {
          const title = 'Bibliography';
          const pageNum = chapterPageNumbers.length > 0 
            ? chapterPageNumbers[chapterPageNumbers.length - 1] + estimateChapterPages(book.chapters[book.chapters.length - 1]?.content || '', charsPerPage)
            : 1;
          const totalChars = 70;
          const textPart = title;
          const dotsNeeded = Math.max(5, totalChars - textPart.length - String(pageNum).length - 2);
          const dots = ' ' + '.'.repeat(dotsNeeded) + ' ';
          
          return (
            <View style={styles.tocEntry} wrap={false}>
              <Text style={styles.tocEntryText}>
                {'              '}{title}{dots}{pageNum}
              </Text>
            </View>
          );
        })()}
        {/* No page number on TOC page - front matter */}
      </Page>

      {/* ========================================== */}
      {/* CHAPTERS - Arabic numerals starting at 1 */}
      {/* Uses publishing settings for formatting */}
      {/* ========================================== */}
      {book.chapters.map((chapter, chapterIndex) => {
        const sanitizedContent = sanitizeChapterContent(chapter);
        const paragraphs = sanitizedContent.split(/\n\n+/).filter(p => p.trim());
        
        // Format chapter number based on settings with safe defaults
        const numberStyle = chapters.chapterNumberStyle || 'numeric';
        const chapterNumberDisplay = formatChapterNumber(chapter.number, numberStyle as 'numeric' | 'roman' | 'word' | 'ordinal');
        
        // Apply title case transformation with safe default
        let displayTitle = chapter.title;
        const titleCase = chapters.chapterTitleCase || 'title-case';
        if (titleCase === 'uppercase') {
          displayTitle = chapter.title.toUpperCase();
        } else if (titleCase === 'lowercase') {
          displayTitle = chapter.title.toLowerCase();
        }
        
        // Dynamic page style based on settings with safe defaults
        const chapterDropTop = safeNumber(chapters.chapterDropFromTop, 1.5);
        const chapterPageStyle = {
          padding: pageDims.MARGIN_LEFT,
          paddingTop: inchesToPoints(chapterDropTop),
          paddingBottom: pageDims.MARGIN_BOTTOM,
          fontFamily: BODY_FONT,
          fontSize: bodyFontSize,
          lineHeight: lineHeight,
          color: colors.primary,
          backgroundColor: colors.background,
        };
        
        // Dynamic paragraph style with safe defaults
        const bodyAlign = typography.bodyAlignment || 'justify';
        const dynamicParagraphStyle = {
          fontFamily: BODY_FONT,
          fontWeight: 400 as const,
          fontSize: bodyFontSize,
          textAlign: bodyAlign === 'justify' ? 'justify' as const : 
                     bodyAlign === 'center' ? 'center' as const :
                     bodyAlign === 'right' ? 'right' as const : 'left' as const,
          lineHeight: lineHeight,
          marginBottom: 12,
          textIndent: safeNumber(paragraphIndent, 0),
          color: colors.primary,
        };

        return (
          <Page 
            key={chapter.number} 
            size={pageSize}
            style={chapterPageStyle}
            wrap
          >
            {/* Running header - shows book title and chapter on continuation pages */}
            {headerFooter.headerEnabled && (
              <View style={styles.runningHeader} fixed>
                <Text
                  style={styles.runningHeaderLeft}
                  render={({ pageNumber }) => {
                    const chapterStartPage = FRONT_MATTER_PAGES + chapterIndex + 1;
                    const isFirstPage = pageNumber === chapterStartPage;
                    // Suppress headers on chapter opening pages
                    if (isFirstPage) return '';
                    return headerFooter.headerLeftContent === 'title' ? book.title.toUpperCase() :
                           headerFooter.headerLeftContent === 'author' ? book.author.toUpperCase() :
                           headerFooter.headerLeftContent === 'chapter' ? (chapter.title || `Chapter ${chapter.number}`) : '';
                  }}
                />
                <Text
                  style={styles.runningHeaderRight}
                  render={({ pageNumber }) => {
                    const chapterStartPage = FRONT_MATTER_PAGES + chapterIndex + 1;
                    const isFirstPage = pageNumber === chapterStartPage;
                    // Suppress headers on chapter opening pages
                    if (isFirstPage) return '';
                    return headerFooter.headerRightContent === 'title' ? book.title.toUpperCase() :
                           headerFooter.headerRightContent === 'author' ? book.author.toUpperCase() :
                           headerFooter.headerRightContent === 'chapter' ? (chapter.title || `Chapter ${chapter.number}`) : '';
                  }}
                />
              </View>
            )}
            
            {/* Chapter header - based on settings */}
            <View style={styles.chapterHeader} wrap={false}>
              {chapters.showChapterNumber !== false && chapters.chapterNumberPosition !== 'hidden' && (
                <>
                  <Text style={styles.chapterNumberLabel}>{chapters.chapterNumberLabel || 'Chapter'}</Text>
                  <Text style={{...styles.chapterNumber, fontSize: safeNumber(chapterTitleSize * 1.3, 24)}}>{chapterNumberDisplay}</Text>
                </>
              )}
              
              {/* Ornament between number and title */}
              {chapterOrnament && chapters.chapterOrnamentPosition === 'between-number-title' && (
                <Text style={styles.sceneBreak}>{chapterOrnament}</Text>
              )}
              
              <View style={styles.chapterTitleDivider} />
              <Text style={{
                ...styles.chapterTitle, 
                fontSize: safeNumber(chapterTitleSize, 18),
                textAlign: chapters.chapterTitlePosition === 'left' ? 'left' : 
                          chapters.chapterTitlePosition === 'right' ? 'right' : 'center',
              }}>{displayTitle}</Text>
              
              {/* Ornament below title */}
              {chapterOrnament && chapters.chapterOrnamentPosition === 'below-title' && (
                <Text style={{...styles.sceneBreak, marginTop: 10}}>{chapterOrnament}</Text>
              )}
            </View>
            
            {/* Chapter content with dynamic styling */}
            <View style={styles.paragraphContainer}>
              {paragraphs.map((para, paraIndex) => {
                const trimmedPara = para.trim();
                
                // Handle scene breaks - using symbol from settings
                if (isSceneBreak(trimmedPara)) {
                  return (
                    <Text key={paraIndex} style={styles.sceneBreak}>
                      {sceneBreakSymbol || '* * *'}
                    </Text>
                  );
                }
                
                // First paragraph - indent based on settings
                if (paraIndex === 0) {
                  return (
                    <Text key={paraIndex} style={{
                      ...dynamicParagraphStyle,
                      textIndent: settings.typography.firstParagraphIndent ? paragraphIndent : 0,
                    }}>
                      {trimmedPara}
                    </Text>
                  );
                }
                
                // Regular paragraphs with indent from settings
                return (
                  <Text key={paraIndex} style={dynamicParagraphStyle}>
                    {trimmedPara}
                  </Text>
                );
              })}
            </View>
            
            {/* Page number - position based on settings */}
            {headerFooter.footerEnabled && (
              <View style={styles.pageNumberContainer} fixed>
                <Text
                  style={{
                    ...styles.pageNumberText,
                    fontSize: safeNumber(headerFooter.footerFontSize, 10),
                    textAlign: headerFooter.footerCenterContent === 'page-number' ? 'center' :
                              headerFooter.footerRightContent === 'page-number' ? 'right' : 'left',
                  }}
                  render={({ pageNumber }) => {
                    const contentPageNumber = pageNumber - FRONT_MATTER_PAGES;
                    // Hide on first page of chapter if settings say so
                    if (!headerFooter.firstPageNumberVisible && 
                        pageNumber === FRONT_MATTER_PAGES + chapterIndex + 1) {
                      return '';
                    }
                    return contentPageNumber > 0 ? String(contentPageNumber) : '';
                  }}
                />
              </View>
            )}
          </Page>
        );
      })}

      {/* ========================================== */}
      {/* BIBLIOGRAPHY - Professional Reference List */}
      {/* Shown as a standalone section for bibliography, endnotes, and in-text formats */}
      {/* ========================================== */}
      {book.bibliography?.config.enabled && book.bibliography.references.length > 0 && (
        (() => {
          // Determine if we should show the end-of-book bibliography section
          // Show for: 'bibliography', 'endnote', 'in-text' (reference list at end)
          // Skip for: 'footnote' (references appear at bottom of each page)
          const location = book.bibliography.config.location || [];
          const showEndSection = location.length === 0 || 
            location.includes('bibliography') || 
            location.includes('endnote') || 
            location.includes('in-text');
          
          return showEndSection ? (
            <BibliographySection 
              bibliography={book.bibliography} 
              frontMatterPages={FRONT_MATTER_PAGES}
              totalChapters={book.chapters.length}
              pageSize={pageSize}
            />
          ) : null;
        })()
      )}

      {/* ========================================== */}
      {/* BACK COVER - Final page of the book */}
      {/* ========================================== */}
      {book.backCoverUrl && (
        <Page size={pageSize} style={styles.coverPage}>
          <Image src={book.backCoverUrl} style={styles.coverImage} />
        </Page>
      )}
    </Document>
  );
};

// Bibliography Section Component
const BibliographySection: React.FC<{
  bibliography: {
    config: BibliographyConfig;
    references: Reference[];
  };
  frontMatterPages: number;
  totalChapters: number;
  pageSize: PageSizeType;
}> = ({ bibliography, frontMatterPages, totalChapters, pageSize }) => {
  const { config, references } = bibliography;
  
  // Sort references
  const sortedReferences = CitationService.sortReferences(
    references,
    config.sortBy,
    config.sortDirection
  );

  // Format references for display (remove HTML tags)
  const formatRefText = (ref: Reference, index: number): string => {
    const formatted = CitationService.formatReference(ref, config.citationStyle, index + 1);
    // Remove HTML tags and decode entities
    let plainText = formatted
      .replace(/<em>/g, '')
      .replace(/<\/em>/g, '')
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
    
    // Add numbering if configured
    if (config.numberingStyle === 'numeric') {
      plainText = `${index + 1}. ${plainText}`;
    } else if (config.numberingStyle === 'alphabetic') {
      plainText = `${String.fromCharCode(65 + (index % 26))}. ${plainText}`;
    }
    
    return plainText;
  };

  // Group references by type if configured
  const groupedRefs = config.groupByType
    ? sortedReferences.reduce((acc, ref) => {
        const type = ref.type;
        if (!acc[type]) acc[type] = [];
        acc[type].push(ref);
        return acc;
      }, {} as Record<string, Reference[]>)
    : null;

  return (
    <Page size={pageSize} style={styles.bibliographyPage} wrap>
      {/* Bibliography Header */}
      <View style={styles.bibliographyHeader} wrap={false}>
        <Text style={styles.bibliographyTitle}>Bibliography</Text>
        <View style={styles.bibliographyDivider} />
      </View>

      {/* References List */}
      {groupedRefs ? (
        // Grouped by type
        Object.entries(groupedRefs).map(([type, refs]) => (
          <View key={type} wrap={false}>
            <Text style={styles.bibliographyTypeHeading}>
              {type.charAt(0).toUpperCase() + type.slice(1)}s
            </Text>
            {refs.map((ref, index) => (
              <View key={ref.id} style={styles.referenceEntry} wrap={false}>
                <Text style={styles.referenceText}>
                  {formatRefText(ref, index)}
                </Text>
              </View>
            ))}
          </View>
        ))
      ) : (
        // Single list
        sortedReferences.map((ref, index) => (
          <View key={ref.id} style={styles.referenceEntry} wrap={false}>
            <Text style={styles.referenceText}>
              {formatRefText(ref, index)}
            </Text>
          </View>
        ))
      )}

      {/* Citation style note */}
      <Text style={styles.bibliographyNote}>
        References formatted in {config.citationStyle} style.
      </Text>

      {/* Page number */}
      <View style={styles.pageNumberContainer} fixed>
        <Text
          style={styles.pageNumberText}
          render={({ pageNumber }) => {
            const contentPageNumber = pageNumber - frontMatterPages;
            return contentPageNumber > 0 ? String(contentPageNumber) : '';
          }}
        />
      </View>
    </Page>
  );
};

export default PDFDocument;
// Force recompile Fri Dec  5 20:48:11 PKT 2025
