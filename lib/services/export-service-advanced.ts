// Advanced Export Service with PDF, DOCX, and EPUB support
// Professional formatting with perfect page numbers and TOC
import React from 'react';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  PageBreak, 
  Footer, 
  Header,
  PageNumber, 
  NumberFormat,
  ImageRun,
  TableOfContents,
  StyleLevel,
  SectionType,
  convertInchesToTwip,
  Tab,
  TabStopType,
  TabStopPosition,
  ExternalHyperlink,
  Bookmark,
  InternalHyperlink
} from 'docx';
import { pdf } from '@react-pdf/renderer';
import PDFDocumentReactPDF from './pdf-document';
import { registerFonts } from './pdf-fonts';
import { PDFServicePDFKit } from './pdf-service-pdfkit';
import { PDFHTMLService } from './pdf-html-service';
import { Reference, BibliographyConfig, ChapterReferences } from '@/lib/types/bibliography';
import { CitationService } from './citation-service';
import epub, { Options as EPubOptions, Chapter as EPubChapter } from 'epub-gen-memory';
import { PublishingSettings, DEFAULT_PUBLISHING_SETTINGS, TRIM_SIZES } from '@/lib/types/publishing';
import { BookLayoutType } from '@/lib/types/book-layouts';
import { 
  getFontFamily, 
  formatChapterNumber, 
  getSceneBreakSymbol, 
  getChapterOrnament,
  generateEPUBStyles,
  getTrimSizeDimensions,
  inchesToPoints
} from '@/lib/utils/publishing-styles';
import { sanitizeForExport } from '@/lib/utils/text-sanitizer';
import { isNovel } from '@/lib/utils/book-type';

interface BookExport {
  title: string;
  author: string;
  coverUrl?: string; // URL to front cover image
  backCoverUrl?: string; // URL to back cover image
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
  publishingSettings?: PublishingSettings; // Publishing settings for formatting
  layoutType?: BookLayoutType; // Layout template for PDF export
}

interface OutlineExport {
  title: string;
  author: string;
  description?: string;
  chapters: Array<{
    number: number;
    title: string;
    summary: string;
    wordCount: number;
  }>;
  themes?: string[];
  characters?: Array<{ name: string; role: string }>;
}

export class ExportServiceAdvanced {
  /**
   * Convert font ID to DOCX-compatible font name
   */
  private static getDOCXFontName(fontId: string): string {
    const fontMap: Record<string, string> = {
      'garamond': 'Garamond',
      'georgia': 'Georgia',
      'times-new-roman': 'Times New Roman',
      'palatino': 'Palatino Linotype',
      'baskerville': 'Baskerville',
      'caslon': 'Adobe Caslon Pro',
      'minion': 'Minion Pro',
      'sabon': 'Sabon',
      'bembo': 'Bembo',
      'libre-baskerville': 'Libre Baskerville',
      'merriweather': 'Merriweather',
      'source-serif': 'Source Serif Pro',
      'lora': 'Lora',
      'helvetica': 'Helvetica',
      'arial': 'Arial',
      'open-sans': 'Open Sans',
      'roboto': 'Roboto',
      'lato': 'Lato',
      'montserrat': 'Montserrat',
      'playfair': 'Playfair Display',
      'cormorant': 'Cormorant Garamond',
      'cinzel': 'Cinzel',
      'philosopher': 'Philosopher',
      'spectral': 'Spectral',
    };
    return fontMap[fontId] || 'Georgia';
  }

  /**
   * Fetch image from URL and convert to Buffer
   */
  private static async fetchImageAsBuffer(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Error fetching image:', error);
      throw error;
    }
  }

  /**
   * Detect image type from buffer magic bytes
   */
  private static detectImageType(buffer: Buffer): 'png' | 'jpg' | 'gif' | 'bmp' {
    // Check magic bytes
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return 'png';
    }
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'jpg';
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return 'gif';
    }
    if (buffer[0] === 0x42 && buffer[1] === 0x4D) {
      return 'bmp';
    }
    // Default to png
    return 'png';
  }

  /**
   * Helper to aggressively remove duplicate chapter titles from content
   * Uses centralized sanitizer for AI artifact removal
   */
  private static sanitizeChapterContent(chapter: { number: number; title: string; content: string }): string {
    // First, apply the centralized sanitizer to remove AI artifacts
    let cleaned = sanitizeForExport(chapter.content.trim());
    
    // Escape special regex characters in title
    const escapedTitle = chapter.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Comprehensive patterns to catch all possible duplicates
    const patterns = [
      // At start: "Chapter X: Title"
      new RegExp(`^Chapter\\s+${chapter.number}[:\\s-]+${escapedTitle}[\\s\\.,:;!?]*`, 'im'),
      // At start: "Chapter X - Title"  
      new RegExp(`^Chapter\\s+${chapter.number}\\s*[-–—]\\s*${escapedTitle}[\\s\\.,:;!?]*`, 'im'),
      // At start: "Chapter X Title"
      new RegExp(`^Chapter\\s+${chapter.number}\\s+${escapedTitle}[\\s\\.,:;!?]*`, 'im'),
      // At start: Just "Chapter X:" or "Chapter X"
      new RegExp(`^Chapter\\s+${chapter.number}[:\\s-]*[\\s\\.,:;!?]*`, 'im'),
      // At start: Just the title with optional punctuation
      new RegExp(`^${escapedTitle}[\\s\\.,:;!?]*`, 'im'),
      // After newlines: Chapter title repeated
      new RegExp(`\\n+\\s*Chapter\\s+${chapter.number}[:\\s-]+${escapedTitle}[\\s\\.,:;!?]*`, 'gim'),
      new RegExp(`\\n+\\s*${escapedTitle}[\\s\\.,:;!?]*\\n`, 'gim'),
      // Standalone chapter title on its own line
      new RegExp(`^\\s*${escapedTitle}\\s*$`, 'im'),
      // Chapter number standalone
      new RegExp(`^\\s*Chapter\\s+${chapter.number}\\s*$`, 'im'),
    ];
    
    // Apply all patterns
    for (const pattern of patterns) {
      const before = cleaned;
      cleaned = cleaned.replace(pattern, '').trim();
      // If we removed something, clean up any resulting double newlines
      if (before !== cleaned) {
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
      }
    }
    
    // Split into paragraphs and check first few
    const paragraphs = cleaned.split(/\n\n+/);
    const titleLower = chapter.title.toLowerCase().trim();
    
    // Remove first paragraph if it's just the title or chapter number
    if (paragraphs.length > 0) {
      const firstParaLower = paragraphs[0].toLowerCase().trim();
      if (
        firstParaLower === titleLower ||
        firstParaLower === `chapter ${chapter.number}` ||
        firstParaLower === `chapter ${chapter.number}:` ||
        firstParaLower === `chapter ${chapter.number} - ${titleLower}` ||
        firstParaLower === `chapter ${chapter.number}: ${titleLower}`
      ) {
        paragraphs.shift();
      }
    }
    
    // Rejoin and final cleanup
    cleaned = paragraphs.join('\n\n').trim();
    
    // Remove any leading/trailing whitespace and normalize line breaks
    cleaned = cleaned.replace(/^\s+|\s+$/g, '');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned;
  }

  /**
   * Export book as DOCX with professional publishing-quality formatting
   * Features: Multiple fonts, text hierarchy, proper book structure, page numbers
   * Now uses PublishingSettings for customization
   */
  static async exportBookAsDOCX(book: BookExport): Promise<Buffer> {
    // Get publishing settings (use defaults if not provided)
    const settings = book.publishingSettings || DEFAULT_PUBLISHING_SETTINGS;
    
    // Determine if this book should show "A Novel By" label
    const bookType = settings?.bookType;
    const showNovelLabel = isNovel(book.genre, bookType);
    
    // Get trim size for page dimensions
    const trimSize = getTrimSizeDimensions(settings.trimSize);
    const pageWidthTwip = convertInchesToTwip(trimSize.width);
    const pageHeightTwip = convertInchesToTwip(trimSize.height);
    
    // Get font families based on settings
    const bodyFontName = this.getDOCXFontName(settings.typography.bodyFont);
    const headingFontName = settings.typography.headingFont === 'inherit' 
      ? bodyFontName 
      : this.getDOCXFontName(settings.typography.headingFont);
    
    // Professional font sizes (in half-points, so 24 = 12pt)
    const FONTS = {
      // Use settings-based fonts
      title: headingFontName,
      heading: headingFontName,
      body: bodyFontName,
      // Sans-serif for labels and metadata
      label: 'Calibri',
      toc: 'Calibri',
    };
    
    // Calculate sizes based on settings (convert pt to half-points)
    const bodySize = settings.typography.bodyFontSize * 2;
    const chapterTitleSize = settings.typography.chapterTitleSize * 2;
    
    const SIZES = {
      bookTitle: 72,        // 36pt - Main book title
      chapterNumber: Math.round(chapterTitleSize * 1.3),    // Based on chapter title
      chapterTitle: chapterTitleSize,     // From settings
      sectionTitle: Math.round(settings.typography.sectionHeadingSize * 2),
      body: bodySize,             // From settings
      bodyLarge: bodySize + 2,        // Slightly larger first paragraph
      small: 20,            // 10pt - Small text
      tiny: 18,             // 9pt - Copyright, labels
      pageNum: settings.headerFooter.footerFontSize * 2,
    };

    const COLORS = {
      primary: '1a1a1a',    // Rich black
      secondary: '444444',  // Dark gray
      muted: '666666',      // Medium gray
      light: '888888',      // Light gray
      accent: '8B4513',     // Saddle brown for accents
      divider: 'CCCCCC',    // Light divider
    };

    // Fetch cover image if available
    let coverImageBuffer: Buffer | null = null;
    if (book.coverUrl) {
      try {
        console.log('Fetching cover image for DOCX:', book.coverUrl);
        coverImageBuffer = await this.fetchImageAsBuffer(book.coverUrl);
        console.log('Cover image fetched successfully for DOCX');
      } catch (error) {
        console.error('Error fetching cover image for DOCX:', error);
      }
    }

    // Helper to check if text is a scene break
    const isSceneBreak = (text: string): boolean => {
      const trimmed = text.trim();
      return trimmed === '***' || trimmed === '* * *' || trimmed === '---' || 
             trimmed === '- - -' || (trimmed.length <= 5 && /^[*\-]+$/.test(trimmed.replace(/\s/g, '')));
    };

    // =====================================================
    // SECTION 1: FRONT MATTER (Cover, Title, Copyright, TOC)
    // =====================================================
    const frontMatterChildren: Paragraph[] = [];

    // --- COVER PAGE ---
    if (coverImageBuffer) {
      frontMatterChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              type: this.detectImageType(coverImageBuffer),
              data: coverImageBuffer,
              transformation: { width: 450, height: 650 },
            }),
          ],
          spacing: { before: 100 },
        }),
        new Paragraph({ children: [new PageBreak()] })
      );
    } else {
      // Text-based cover
      frontMatterChildren.push(
        new Paragraph({ text: '', spacing: { before: 3500 } }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: book.title.toUpperCase(), 
              font: FONTS.title, 
              size: SIZES.bookTitle, 
              bold: true,
              color: COLORS.primary,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '━━━━━━━━━━━━━━━', font: FONTS.label, size: 24, color: COLORS.divider }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: book.author, font: FONTS.heading, size: 32, italics: true, color: COLORS.secondary }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        ...(book.genre ? [
          new Paragraph({
            children: [
              new TextRun({ 
                text: book.genre.toUpperCase(), 
                font: FONTS.label, 
                size: SIZES.tiny, 
                color: COLORS.muted,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
        ] : []),
        new Paragraph({ children: [new PageBreak()] })
      );
    }

    // --- TITLE PAGE ---
    // Conditionally show "A Novel By" only for novels
    const titlePageElements: Paragraph[] = [
      new Paragraph({ text: '', spacing: { before: 2500 } }),
      new Paragraph({
        children: [
          new TextRun({ 
            text: book.title, 
            font: FONTS.title, 
            size: 56, // 28pt
            color: COLORS.primary,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '━━━━━━━━━━━', font: FONTS.label, size: 20, color: COLORS.accent }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    ];
    
    // Add author label and name based on book type
    if (showNovelLabel) {
      titlePageElements.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'A NOVEL BY', font: FONTS.label, size: SIZES.tiny, color: COLORS.muted }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: book.author, font: FONTS.heading, size: 36, italics: true, color: COLORS.secondary }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
        })
      );
    } else {
      // Just show "by Author Name" for non-novels
      titlePageElements.push(
        new Paragraph({
          children: [
            new TextRun({ text: `by ${book.author}`, font: FONTS.heading, size: 36, italics: true, color: COLORS.secondary }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
        })
      );
    }
    
    // Add description and page break
    if (book.description) {
      titlePageElements.push(
        new Paragraph({
          children: [
            new TextRun({ text: book.description, font: FONTS.body, size: SIZES.small, color: COLORS.muted }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 400 },
        })
      );
    }
    titlePageElements.push(new Paragraph({ children: [new PageBreak()] }));
    
    frontMatterChildren.push(...titlePageElements);

    // --- COPYRIGHT PAGE ---
    const currentYear = new Date().getFullYear();
    frontMatterChildren.push(
      new Paragraph({ text: '', spacing: { before: 2500 } }),
      new Paragraph({
        children: [
          new TextRun({ text: book.title, font: FONTS.heading, size: 28, bold: true, color: COLORS.primary }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `by ${book.author}`, font: FONTS.body, size: 24, italics: true, color: COLORS.secondary }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Copyright © ${currentYear} ${book.author}`, font: FONTS.body, size: SIZES.small, color: COLORS.primary }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'All rights reserved.', font: FONTS.body, size: SIZES.small, color: COLORS.primary }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 500 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• • •', font: FONTS.label, size: 24, color: COLORS.divider }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 500 },
      }),
      new Paragraph({
        children: [
          new TextRun({ 
            text: 'No part of this publication may be reproduced, stored in a retrieval system, or transmitted in any form or by any means, electronic, mechanical, photocopying, recording, or otherwise, without the prior written permission of the copyright holder.', 
            font: FONTS.body, 
            size: SIZES.tiny, 
            color: COLORS.muted,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'PUBLISHED BY', font: FONTS.label, size: 16, bold: true, color: COLORS.muted }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Dynamic Labs Media', font: FONTS.body, size: SIZES.small, color: COLORS.secondary }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'dlmworld.com', font: FONTS.body, size: SIZES.tiny, color: COLORS.light }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Created with PowerWrite', font: FONTS.body, size: SIZES.tiny, italics: true, color: COLORS.light }),
        ],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ children: [new PageBreak()] })
    );

    // --- TABLE OF CONTENTS ---
    frontMatterChildren.push(
      new Paragraph({ text: '', spacing: { before: 600 } }),
      new Paragraph({
        children: [
          new TextRun({ text: 'CONTENTS', font: FONTS.label, size: 36, bold: true, color: COLORS.primary }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '━━━━━━━━━━━', font: FONTS.label, size: 20, color: COLORS.accent }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),
      // TOC entries
      ...book.chapters.map((chapter, index) => 
        new Paragraph({
          children: [
            new TextRun({ text: `CHAPTER ${chapter.number}`, font: FONTS.label, size: SIZES.small, color: COLORS.muted }),
            new TextRun({ text: '    ', font: FONTS.toc }),
            new TextRun({ text: chapter.title, font: FONTS.heading, size: 24, italics: true, color: COLORS.primary }),
            new TextRun({ text: '  ', font: FONTS.toc }),
            new TextRun({ text: '. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ', font: FONTS.toc, size: 18, color: COLORS.divider }),
            new TextRun({ text: `${index + 1}`, font: FONTS.label, size: 24, bold: true, color: COLORS.primary }),
          ],
          spacing: { after: 240 },
          indent: { left: convertInchesToTwip(0.3), right: convertInchesToTwip(0.3) },
        })
      ),
      ...(book.bibliography?.config.enabled && book.bibliography.references.length > 0 ? [
        new Paragraph({
          children: [
            new TextRun({ text: 'BIBLIOGRAPHY', font: FONTS.label, size: SIZES.small, color: COLORS.muted }),
            new TextRun({ text: '  ', font: FONTS.toc }),
            new TextRun({ text: '. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ', font: FONTS.toc, size: 18, color: COLORS.divider }),
            new TextRun({ text: `${book.chapters.length + 1}`, font: FONTS.label, size: 24, bold: true, color: COLORS.primary }),
          ],
          spacing: { before: 200, after: 240 },
          indent: { left: convertInchesToTwip(0.3), right: convertInchesToTwip(0.3) },
        }),
      ] : [])
    );

    // Front matter section configuration - uses publishing settings margins
    const frontMatterSection = {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN },
          size: {
            width: pageWidthTwip,
            height: pageHeightTwip,
            orientation: (settings.orientation === 'landscape' ? 'landscape' : 'portrait') as 'portrait' | 'landscape',
          },
          margin: {
            top: convertInchesToTwip(settings.margins.top),
            bottom: convertInchesToTwip(settings.margins.bottom),
            left: convertInchesToTwip(settings.margins.inside), // Gutter margin
            right: convertInchesToTwip(settings.margins.outside),
          },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ children: [PageNumber.CURRENT], font: FONTS.label, size: SIZES.pageNum, color: COLORS.muted }),
              ],
            }),
          ],
        }),
      },
      children: frontMatterChildren,
    };

    // =====================================================
    // SECTION 2: MAIN CONTENT (Chapters)
    // =====================================================
    const mainContentChildren: Paragraph[] = [];

    book.chapters.forEach((chapter, chapterIndex) => {
      const sanitizedContent = this.sanitizeChapterContent(chapter);
      const paragraphs = sanitizedContent.split('\n\n').filter(p => p.trim());

      // Chapter opening page
      if (chapterIndex > 0) {
        mainContentChildren.push(
          new Paragraph({ children: [new PageBreak()] })
        );
      }

      // Chapter header - using publishing settings
      const chapterDropSpace = Math.round(convertInchesToTwip(settings.chapters.chapterDropFromTop) * 0.5);
      const afterTitleSpace = Math.round(convertInchesToTwip(settings.chapters.afterChapterTitleSpace) * 0.5);
      
      // Get chapter number in the configured style
      const chapterNumberText = formatChapterNumber(chapter.number, settings.chapters.chapterNumberStyle);
      
      // Get chapter title alignment
      const titleAlignment = settings.chapters.chapterTitlePosition === 'centered' ? AlignmentType.CENTER :
                            settings.chapters.chapterTitlePosition === 'left' ? AlignmentType.LEFT :
                            AlignmentType.RIGHT;
      
      // Apply title case transformation
      let displayTitle = chapter.title;
      if (settings.chapters.chapterTitleCase === 'uppercase') {
        displayTitle = chapter.title.toUpperCase();
      } else if (settings.chapters.chapterTitleCase === 'lowercase') {
        displayTitle = chapter.title.toLowerCase();
      }
      
      // Get ornament from settings
      const ornament = getChapterOrnament(settings);
      
      // Build chapter header based on settings
      mainContentChildren.push(
        new Paragraph({ text: '', spacing: { before: chapterDropSpace } })
      );
      
      // Add chapter number if enabled
      if (settings.chapters.showChapterNumber && settings.chapters.chapterNumberPosition !== 'hidden') {
        mainContentChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: settings.chapters.chapterNumberLabel.toUpperCase(), font: FONTS.label, size: 20, color: COLORS.muted }),
            ],
            alignment: titleAlignment,
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: chapterNumberText, font: FONTS.heading, size: 60, color: COLORS.primary }),
            ],
            alignment: titleAlignment,
            spacing: { after: 200 },
          })
        );
      }
      
      // Add ornament if configured
      if (ornament && (settings.chapters.chapterOrnamentPosition === 'between-number-title' || settings.chapters.chapterOrnamentPosition === 'above-number')) {
        mainContentChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: ornament, font: FONTS.label, size: 24, color: COLORS.accent }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          })
        );
      }
      
      // Add chapter title
      mainContentChildren.push(
        new Paragraph({
          children: [
            new TextRun({ 
              text: displayTitle, 
              font: FONTS.heading, 
              size: SIZES.chapterTitle, 
              italics: settings.chapters.chapterOpeningStyle === 'decorated',
              color: COLORS.secondary 
            }),
          ],
          alignment: titleAlignment,
          spacing: { after: ornament && settings.chapters.chapterOrnamentPosition === 'below-title' ? 200 : afterTitleSpace },
        })
      );
      
      // Add ornament below title if configured
      if (ornament && settings.chapters.chapterOrnamentPosition === 'below-title') {
        mainContentChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: ornament, font: FONTS.label, size: 24, color: COLORS.accent }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: afterTitleSpace },
          })
        );
      }

      // Chapter content - apply publishing settings
      const lineSpacing = Math.round(settings.typography.bodyLineHeight * 240); // Convert to twips
      const paragraphIndent = settings.typography.paragraphIndentUnit === 'inches' 
        ? convertInchesToTwip(settings.typography.paragraphIndent)
        : settings.typography.paragraphIndent * 20; // em to twips approximation
      
      // Get alignment from settings
      const bodyAlignment = settings.typography.bodyAlignment === 'justify' ? AlignmentType.JUSTIFIED :
                           settings.typography.bodyAlignment === 'center' ? AlignmentType.CENTER :
                           settings.typography.bodyAlignment === 'right' ? AlignmentType.RIGHT :
                           AlignmentType.LEFT;
      
      // Get scene break symbol from settings
      const sceneBreakSymbol = getSceneBreakSymbol(settings);
      
      paragraphs.forEach((para, paraIndex) => {
        const trimmedPara = para.trim();

        // Handle scene breaks
        if (isSceneBreak(trimmedPara)) {
          mainContentChildren.push(
            new Paragraph({
              children: [
                new TextRun({ text: sceneBreakSymbol || '* * *', font: FONTS.body, size: 24, color: COLORS.muted }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 400, after: 400 },
            })
          );
          return;
        }

        // First paragraph - no indent (unless settings say otherwise)
        if (paraIndex === 0) {
          mainContentChildren.push(
            new Paragraph({
              children: [
                new TextRun({ text: trimmedPara, font: FONTS.body, size: SIZES.bodyLarge, color: COLORS.primary }),
              ],
              alignment: bodyAlignment,
              spacing: { after: 280, line: lineSpacing },
              indent: settings.typography.firstParagraphIndent ? { firstLine: paragraphIndent } : undefined,
            })
          );
        } else {
          // Regular paragraphs with first-line indent from settings
          mainContentChildren.push(
            new Paragraph({
              children: [
                new TextRun({ text: trimmedPara, font: FONTS.body, size: SIZES.body, color: COLORS.primary }),
              ],
              alignment: bodyAlignment,
              spacing: { after: 240, line: lineSpacing },
              indent: { firstLine: paragraphIndent },
            })
          );
        }
      });

      // End of chapter spacing
      mainContentChildren.push(
        new Paragraph({ text: '', spacing: { after: 600 } })
      );
    });

    // Add bibliography if enabled
    mainContentChildren.push(...this.generateDOCXBibliography(book));

    // Add back cover if available
    let backCoverImageBuffer: Buffer | null = null;
    if (book.backCoverUrl) {
      try {
        console.log('Fetching back cover image for DOCX:', book.backCoverUrl);
        backCoverImageBuffer = await this.fetchImageAsBuffer(book.backCoverUrl);
        console.log('Back cover image fetched successfully for DOCX');
        
        // Add back cover page
        mainContentChildren.push(
          new Paragraph({ children: [new PageBreak()] }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                type: this.detectImageType(backCoverImageBuffer),
                data: backCoverImageBuffer,
                transformation: { width: 450, height: 650 },
              }),
            ],
            spacing: { before: 100 },
          })
        );
      } catch (error) {
        console.error('Error fetching back cover image for DOCX:', error);
      }
    }

    // Main content section configuration - uses publishing settings
    const mainContentSection = {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
          size: {
            width: pageWidthTwip,
            height: pageHeightTwip,
            orientation: (settings.orientation === 'landscape' ? 'landscape' : 'portrait') as 'portrait' | 'landscape',
          },
          margin: {
            top: convertInchesToTwip(settings.margins.top),
            bottom: convertInchesToTwip(settings.margins.bottom),
            left: convertInchesToTwip(settings.margins.inside),
            right: convertInchesToTwip(settings.margins.outside),
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: book.title.toUpperCase(), font: FONTS.label, size: 16, color: COLORS.light }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ children: [PageNumber.CURRENT], font: FONTS.label, size: SIZES.pageNum, color: COLORS.primary }),
              ],
            }),
          ],
        }),
      },
      children: mainContentChildren,
    };

    // Create the document with custom styles
    const doc = new Document({
      sections: [frontMatterSection, mainContentSection],
      styles: {
        default: {
          document: {
            run: {
              font: FONTS.body,
              size: SIZES.body,
            },
            paragraph: {
              spacing: { line: 360 },
            },
          },
        },
        paragraphStyles: [
          {
            id: "Normal",
            name: "Normal",
            run: {
              font: FONTS.body,
              size: SIZES.body,
              color: COLORS.primary,
            },
            paragraph: {
              spacing: { after: 200, line: 360 },
            },
          },
          {
            id: "Title",
            name: "Title",
            basedOn: "Normal",
            next: "Normal",
            run: {
              font: FONTS.title,
              size: SIZES.bookTitle,
              bold: true,
              color: COLORS.primary,
            },
            paragraph: {
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            },
          },
          {
            id: "Heading1",
            name: "Heading 1",
            basedOn: "Normal",
            next: "Normal",
            run: {
              font: FONTS.heading,
              size: SIZES.chapterNumber,
              bold: true,
              color: COLORS.primary,
            },
            paragraph: {
              alignment: AlignmentType.CENTER,
              spacing: { before: 400, after: 200 },
            },
          },
          {
            id: "Heading2",
            name: "Heading 2",
            basedOn: "Normal",
            next: "Normal",
            run: {
              font: FONTS.heading,
              size: SIZES.chapterTitle,
              italics: true,
              color: COLORS.secondary,
            },
            paragraph: {
              alignment: AlignmentType.CENTER,
              spacing: { before: 200, after: 400 },
            },
          },
          {
            id: "Heading3",
            name: "Heading 3",
            basedOn: "Normal",
            next: "Normal",
            run: {
              font: FONTS.label,
              size: SIZES.sectionTitle,
              bold: true,
              color: COLORS.primary,
            },
            paragraph: {
              spacing: { before: 300, after: 150 },
            },
          },
        ],
      },
      creator: "PowerWrite by Dynamic Labs Media",
      title: book.title,
      description: book.description || `${book.title} by ${book.author}`,
    });

    return await Packer.toBuffer(doc);
  }

  /**
   * Generate bibliography section for DOCX
   */
  private static generateDOCXBibliography(book: BookExport): Paragraph[] {
    if (!book.bibliography?.config.enabled || !book.bibliography.references.length) {
      return [];
    }

    const { config, references } = book.bibliography;
    const paragraphs: Paragraph[] = [];

    // Page break before bibliography
    paragraphs.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );

    // Bibliography title
    paragraphs.push(
      new Paragraph({
        text: 'Bibliography',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 400 },
      })
    );

    // Decorative line
    paragraphs.push(
      new Paragraph({
        text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Sort references
    const sortedReferences = CitationService.sortReferences(
      references,
      config.sortBy,
      config.sortDirection
    );

    // Group by type if configured
    if (config.groupByType) {
      const grouped: Record<string, Reference[]> = {};
      sortedReferences.forEach(ref => {
        const type = ref.type;
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(ref);
      });

      Object.entries(grouped).forEach(([type, refs]) => {
        // Type heading
        const typeLabel = type.charAt(0).toUpperCase() + type.slice(1) + 's';
        paragraphs.push(
          new Paragraph({
            text: typeLabel,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          })
        );

        refs.forEach((ref, index) => {
          const formatted = CitationService.formatReference(ref, config.citationStyle, index + 1);
          // Remove HTML tags for DOCX
          const plainText = formatted.replace(/<[^>]*>/g, '');
          
          // Add numbering if configured
          let refText = plainText;
          if (config.numberingStyle === 'numeric') {
            refText = `${index + 1}. ${plainText}`;
          } else if (config.numberingStyle === 'alphabetic') {
            refText = `${String.fromCharCode(65 + index)}. ${plainText}`;
          }

          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: refText,
                }),
              ],
              spacing: { after: 150 },
              indent: config.hangingIndent ? { hanging: 720, left: 720 } : undefined,
            })
          );
        });
      });
    } else {
      // Single list without grouping
      sortedReferences.forEach((ref, index) => {
        const formatted = CitationService.formatReference(ref, config.citationStyle, index + 1);
        // Remove HTML tags for DOCX
        const plainText = formatted.replace(/<[^>]*>/g, '');
        
        // Add numbering if configured
        let refText = plainText;
        if (config.numberingStyle === 'numeric') {
          refText = `${index + 1}. ${plainText}`;
        } else if (config.numberingStyle === 'alphabetic') {
          refText = `${String.fromCharCode(65 + index)}. ${plainText}`;
        }

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: refText,
              }),
            ],
            spacing: { after: 150 },
            indent: config.hangingIndent ? { hanging: 720, left: 720 } : undefined,
          })
        );
      });
    }

    // Citation style note
    paragraphs.push(
      new Paragraph({
        text: '',
        spacing: { before: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `References formatted in ${config.citationStyle} style.`,
            italics: true,
            size: 20, // 10pt
          }),
        ],
        alignment: AlignmentType.CENTER,
      })
    );

    return paragraphs;
  }

  /**
   * Export book as PDF with professional formatting
   * Uses HTML/CSS Paged Media (primary) -> PDFKit -> React-PDF (fallback)
   * 
   * The HTML-based method supports advanced layouts like:
   * - Multi-column layouts (academic, dictionary)
   * - Drop caps and professional typography
   * - Running headers/footers
   * - CSS Paged Media features
   */
  static async exportBookAsPDF(book: BookExport): Promise<Buffer> {
    console.log(`Generating professional PDF for: ${book.title}`);
    console.log(`PDF has ${book.chapters?.length || 0} chapters`);
    const layoutType = book.layoutType || book.publishingSettings?.layoutType || 'novel-classic';
    console.log(`Layout type: ${layoutType}`);
    
    // Method 1: HTML/CSS Paged Media via Puppeteer (best quality, most features)
    try {
      console.log('Attempting PDF generation with HTML/CSS Paged Media (primary method)...');
      const buffer = await PDFHTMLService.generateBookPDF({
        ...book,
        layoutType,
      });
      console.log(`HTML-PDF generated successfully. Size: ${buffer.length} bytes`);
      return buffer;
    } catch (htmlError) {
      console.warn('HTML-PDF generation failed, trying PDFKit fallback:', htmlError);
    }
    
    // Method 2: PDFKit (robust, handles edge cases)
    try {
      console.log('Attempting PDF generation with PDFKit (fallback 1)...');
      const buffer = await PDFServicePDFKit.generateBookPDF(book);
      console.log(`PDFKit PDF generated successfully. Size: ${buffer.length} bytes`);
      return buffer;
    } catch (pdfkitError) {
      console.warn('PDFKit generation failed, trying React-PDF fallback:', pdfkitError);
    }
    
    // Method 3: React-PDF (last resort)
    try {
      console.log('Attempting PDF generation with React-PDF (fallback 2)...');
      
      // Ensure fonts are registered
      try {
        registerFonts();
        console.log('Fonts registered successfully');
      } catch (fontError) {
        console.warn('Font registration failed, continuing with defaults:', fontError);
      }
      
      // Sanitize publishing settings to prevent numerical issues
      const sanitizedBook = {
        ...book,
        publishingSettings: this.sanitizePublishingSettings(book.publishingSettings),
      };
      
      // Create the PDF document component using React.createElement
      console.log('Creating React-PDF document component...');
      const doc = React.createElement(PDFDocumentReactPDF, { book: sanitizedBook });
      
      // Generate PDF blob
      console.log('Generating PDF blob...');
      const pdfBlob = await pdf(doc as any).toBlob();
      
      // Convert blob to buffer
      console.log('Converting to buffer...');
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      console.log(`React-PDF generated successfully. Size: ${buffer.length} bytes`);
      
      return buffer;
    } catch (error) {
      console.error('All PDF generation methods failed:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
      }
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sanitize publishing settings to prevent numerical overflow errors
   */
  private static sanitizePublishingSettings(settings?: PublishingSettings): PublishingSettings {
    if (!settings) return DEFAULT_PUBLISHING_SETTINGS;
    
    // Helper to ensure valid number
    const safeNum = (val: number | undefined | null, def: number, min = 0, max = 1000): number => {
      if (val === undefined || val === null || !isFinite(val) || isNaN(val)) return def;
      return Math.max(min, Math.min(max, val));
    };
    
    return {
      ...DEFAULT_PUBLISHING_SETTINGS,
      ...settings,
      typography: {
        ...DEFAULT_PUBLISHING_SETTINGS.typography,
        ...settings.typography,
        bodyFontSize: safeNum(settings.typography?.bodyFontSize, 11, 6, 72),
        bodyLineHeight: safeNum(settings.typography?.bodyLineHeight, 1.5, 1, 3),
        chapterTitleSize: safeNum(settings.typography?.chapterTitleSize, 24, 12, 72),
        chapterSubtitleSize: safeNum(settings.typography?.chapterSubtitleSize, 14, 8, 48),
        sectionHeadingSize: safeNum(settings.typography?.sectionHeadingSize, 16, 10, 48),
        dropCapLines: safeNum(settings.typography?.dropCapLines, 3, 2, 6),
        paragraphIndent: safeNum(settings.typography?.paragraphIndent, 0.3, 0, 2),
      },
      margins: {
        ...DEFAULT_PUBLISHING_SETTINGS.margins,
        ...settings.margins,
        top: safeNum(settings.margins?.top, 1, 0.25, 3),
        bottom: safeNum(settings.margins?.bottom, 1, 0.25, 3),
        inside: safeNum(settings.margins?.inside, 0.875, 0.25, 3),
        outside: safeNum(settings.margins?.outside, 0.625, 0.25, 3),
        bleed: safeNum(settings.margins?.bleed, 0.125, 0, 0.5),
        headerSpace: safeNum(settings.margins?.headerSpace, 0.3, 0, 1),
        footerSpace: safeNum(settings.margins?.footerSpace, 0.3, 0, 1),
      },
      chapters: {
        ...DEFAULT_PUBLISHING_SETTINGS.chapters,
        ...settings.chapters,
        chapterDropFromTop: safeNum(settings.chapters?.chapterDropFromTop, 2, 0.5, 5),
        afterChapterTitleSpace: safeNum(settings.chapters?.afterChapterTitleSpace, 0.5, 0, 2),
      },
      headerFooter: {
        ...DEFAULT_PUBLISHING_SETTINGS.headerFooter,
        ...settings.headerFooter,
        headerFontSize: safeNum(settings.headerFooter?.headerFontSize, 9, 6, 14),
        footerFontSize: safeNum(settings.headerFooter?.footerFontSize, 10, 6, 14),
      },
    };
  }

  /**
   * Export outline as DOCX
   */
  static async exportOutlineAsDOCX(outline: OutlineExport): Promise<Buffer> {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Title
            new Paragraph({
              text: outline.title,
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `by ${outline.author}`, italics: true }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Description
            ...(outline.description ? [
              new Paragraph({
                text: 'Synopsis',
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
              }),
              new Paragraph({
                text: outline.description,
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 400 },
              }),
            ] : []),

            // Themes
            ...(outline.themes && outline.themes.length > 0 ? [
              new Paragraph({
                text: 'Themes',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 200 },
              }),
              new Paragraph({
                text: outline.themes.join(', '),
                spacing: { after: 300 },
              }),
            ] : []),

            // Characters
            ...(outline.characters && outline.characters.length > 0 ? [
              new Paragraph({
                text: 'Main Characters',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 200 },
              }),
              ...outline.characters.map(char =>
                new Paragraph({
                  text: `${char.name} - ${char.role}`,
                  bullet: { level: 0 },
                  spacing: { after: 100 },
                })
              ),
              new Paragraph({
                text: '',
                spacing: { after: 300 },
              }),
            ] : []),

            // Chapter Outline
            new Paragraph({
              text: 'Chapter Outline',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),

            ...outline.chapters.flatMap((chapter) => [
              new Paragraph({
                text: `Chapter ${chapter.number}: ${chapter.title}`,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 100 },
              }),
              new Paragraph({
                text: chapter.summary,
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Target word count: ${chapter.wordCount.toLocaleString()} words`,
                    italics: true,
                  }),
                ],
                spacing: { after: 300 },
              }),
            ]),
          ],
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }

  /**
   * Export outline as PDF
   */
  static async exportOutlineAsPDF(outline: OutlineExport): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        // Dynamic import for pdfkit to avoid Next.js issues
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const PDFDocument = require('pdfkit');
        
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 72, right: 72 },
          bufferPages: true,
          autoFirstPage: true,
          info: {
            Title: `${outline.title} - Outline`,
            Author: outline.author,
          },
        });

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err: Error) => {
          console.error('PDFKit outline error:', err);
          reject(err);
        });

        // Title
        doc.fontSize(24).font('Helvetica-Bold').text(outline.title, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(14).font('Helvetica-Oblique').text(`by ${outline.author}`, { align: 'center' });
        doc.moveDown(2);

        // Description
        if (outline.description) {
          doc.fontSize(16).font('Helvetica-Bold').text('Synopsis');
          doc.moveDown(0.5);
          doc.fontSize(11).font('Helvetica').text(outline.description, { align: 'justify' });
          doc.moveDown(1.5);
        }

        // Themes
        if (outline.themes && outline.themes.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text('Themes');
          doc.moveDown(0.5);
          doc.fontSize(11).font('Helvetica').text(outline.themes.join(', '));
          doc.moveDown(1.5);
        }

        // Characters
        if (outline.characters && outline.characters.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text('Main Characters');
          doc.moveDown(0.5);
          outline.characters.forEach(char => {
            doc.fontSize(11).font('Helvetica').text(`• ${char.name} - ${char.role}`);
          });
          doc.moveDown(1.5);
        }

        // Chapter Outline
        doc.fontSize(18).font('Helvetica-Bold').text('Chapter Outline');
        doc.moveDown(1);

        outline.chapters.forEach((chapter, index) => {
          if (index > 0 && doc.y > 650) {
            doc.addPage();
          }

          doc.fontSize(13).font('Helvetica-Bold').text(`Chapter ${chapter.number}: ${chapter.title}`);
          doc.moveDown(0.5);
          doc.fontSize(10).font('Helvetica').text(chapter.summary, { align: 'justify' });
          doc.moveDown(0.3);
          doc.fontSize(9).font('Helvetica-Oblique').text(`Target: ${chapter.wordCount.toLocaleString()} words`);
          doc.moveDown(1);
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Export book as EPUB with KDP-compliant formatting
   * Following Amazon KDP guidelines for optimal Kindle publishing
   * Now uses PublishingSettings for customization
   */
  static async exportBookAsEPUB(book: BookExport): Promise<Buffer> {
    console.log(`Generating KDP-compliant EPUB for: ${book.title}`);
    console.log(`EPUB has ${book.chapters?.length || 0} chapters`);

    // Get publishing settings
    const settings = book.publishingSettings || DEFAULT_PUBLISHING_SETTINGS;
    
    // Determine if this book should show "A Novel By" label
    const bookType = settings?.bookType;
    const showNovelLabel = isNovel(book.genre, bookType);

    try {
      // Generate CSS from publishing settings for KDP-optimized EPUB
      const kdpStyles = generateEPUBStyles(settings) + `
        /* KDP-Optimized Styles for Reflowable EPUB */
        
        /* Base body styles */
        body {
          font-family: Georgia, "Times New Roman", Times, serif;
          font-size: 1em;
          line-height: 1.5;
          text-align: left;
          margin: 0;
          padding: 0;
        }
        
        /* Paragraph formatting - KDP recommended */
        p {
          text-indent: 1.5em;
          margin: 0 0 0.5em 0;
          text-align: left;
          orphans: 2;
          widows: 2;
        }
        
        /* First paragraph after heading - no indent */
        h1 + p, h2 + p, h3 + p,
        .chapter-start p:first-of-type {
          text-indent: 0;
        }
        
        /* Chapter title - Heading 1 for KDP TOC */
        h1 {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 1.8em;
          font-weight: bold;
          text-align: center;
          margin: 2em 0 1em 0;
          padding: 0;
          page-break-before: always;
          page-break-after: avoid;
        }
        
        /* Section heading - Heading 2 */
        h2 {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 1.4em;
          font-weight: bold;
          text-align: center;
          margin: 1.5em 0 0.8em 0;
          page-break-after: avoid;
        }
        
        /* Chapter number styling */
        .chapter-number {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 0.9em;
          font-weight: normal;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          text-align: center;
          margin: 2em 0 0.3em 0;
          color: #666;
        }
        
        /* Chapter title */
        .chapter-title {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 1.6em;
          font-style: italic;
          text-align: center;
          margin: 0 0 1.5em 0;
          page-break-after: avoid;
        }
        
        /* Scene break */
        .scene-break {
          text-align: center;
          margin: 1.5em 0;
          font-size: 1.2em;
          color: #888;
        }
        
        /* Title page styles */
        .title-page {
          text-align: center;
          margin-top: 20%;
        }
        
        .book-title {
          font-size: 2.5em;
          font-weight: bold;
          margin-bottom: 0.5em;
        }
        
        .book-author {
          font-size: 1.5em;
          font-style: italic;
          margin-bottom: 1em;
        }
        
        .book-genre {
          font-size: 1em;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #666;
        }
        
        /* Copyright page */
        .copyright-page {
          text-align: center;
          font-size: 0.9em;
          margin-top: 30%;
        }
        
        .copyright-page p {
          text-indent: 0;
          margin: 0.5em 0;
        }
        
        /* TOC styles */
        .toc {
          margin: 2em 0;
        }
        
        .toc h1 {
          margin-bottom: 1.5em;
        }
        
        .toc-entry {
          text-indent: 0;
          margin: 0.7em 0;
        }
        
        .toc-entry a {
          text-decoration: none;
          color: inherit;
        }
        
        .toc-chapter-num {
          font-size: 0.85em;
          color: #666;
          margin-right: 0.5em;
        }
        
        /* Description/blurb */
        .description {
          font-style: italic;
          text-align: center;
          margin: 2em 1em;
          padding: 1em;
          border-top: 1px solid #ccc;
          border-bottom: 1px solid #ccc;
        }
        
        /* Bibliography styles */
        .bibliography {
          margin-top: 2em;
        }
        
        .bibliography h1 {
          margin-bottom: 1em;
        }
        
        .bibliography-entry {
          text-indent: -1.5em;
          margin-left: 1.5em;
          margin-bottom: 0.8em;
        }
        
        /* Images - centered, max width */
        img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 1em auto;
        }
        
        /* Cover image */
        .cover-image {
          width: 100%;
          height: auto;
          margin: 0;
          padding: 0;
        }
        
        /* Blockquote styling */
        blockquote {
          margin: 1em 2em;
          font-style: italic;
          border-left: 3px solid #ccc;
          padding-left: 1em;
        }
        
        /* Emphasis */
        em, i {
          font-style: italic;
        }
        
        strong, b {
          font-weight: bold;
        }
      `;

      // Prepare chapters for EPUB
      const epubChapters: EPubChapter[] = [];

      // 1. Title Page - conditionally show "A Novel By" only for novels
      const authorSection = showNovelLabel
        ? `<p class="book-author-label" style="font-size: 0.7em; letter-spacing: 0.15em; text-transform: uppercase; color: #666; margin-bottom: 0.3em;">A Novel By</p>
           <p class="book-author">${this.escapeHtml(book.author)}</p>`
        : `<p class="book-author">by ${this.escapeHtml(book.author)}</p>`;
      
      const titlePageContent = `
        <div class="title-page">
          <p class="book-title">${this.escapeHtml(book.title)}</p>
          ${authorSection}
          ${book.genre ? `<p class="book-genre">${this.escapeHtml(book.genre)}</p>` : ''}
          ${book.description ? `<div class="description">${this.escapeHtml(book.description)}</div>` : ''}
        </div>
      `;
      
      epubChapters.push({
        title: 'Title Page',
        content: titlePageContent,
        excludeFromToc: true,
        beforeToc: true,
      });

      // 2. Copyright Page
      const currentYear = new Date().getFullYear();
      const copyrightContent = `
        <div class="copyright-page">
          <p><strong>${this.escapeHtml(book.title)}</strong></p>
          <p>by ${this.escapeHtml(book.author)}</p>
          <br/>
          <p>Copyright © ${currentYear} ${this.escapeHtml(book.author)}</p>
          <p>All rights reserved.</p>
          <br/>
          <p>No part of this publication may be reproduced, stored in a retrieval system,
          or transmitted in any form or by any means, electronic, mechanical, photocopying,
          recording, or otherwise, without the prior written permission of the copyright holder.</p>
          <br/>
          <p>Published by Dynamic Labs Media</p>
          <p>dlmworld.com</p>
          <br/>
          <p><em>Created with PowerWrite</em></p>
        </div>
      `;
      
      epubChapters.push({
        title: 'Copyright',
        content: copyrightContent,
        excludeFromToc: true,
        beforeToc: true,
      });

      // 3. In-Book Table of Contents (required by KDP)
      let tocContent = `
        <div class="toc">
          <h1>Contents</h1>
      `;
      
      book.chapters.forEach((chapter) => {
        tocContent += `
          <p class="toc-entry">
            <a href="#chapter-${chapter.number}">
              <span class="toc-chapter-num">Chapter ${chapter.number}</span>
              ${this.escapeHtml(chapter.title)}
            </a>
          </p>
        `;
      });
      
      if (book.bibliography?.config.enabled && book.bibliography.references.length > 0) {
        tocContent += `
          <p class="toc-entry">
            <a href="#bibliography">Bibliography</a>
          </p>
        `;
      }
      
      tocContent += '</div>';
      
      epubChapters.push({
        title: 'Table of Contents',
        content: tocContent,
        excludeFromToc: true,
        beforeToc: true,
      });

      // 4. Book Chapters - using publishing settings
      const sceneBreakSymbol = getSceneBreakSymbol(settings);
      
      for (const chapter of book.chapters) {
        const sanitizedContent = this.sanitizeChapterContent(chapter);
        const paragraphs = sanitizedContent.split('\n\n').filter(p => p.trim());
        
        // Format chapter number based on settings
        const chapterNumberText = settings.chapters.showChapterNumber 
          ? `${settings.chapters.chapterNumberLabel} ${formatChapterNumber(chapter.number, settings.chapters.chapterNumberStyle)}`
          : '';
        
        // Apply title case transformation
        let displayTitle = chapter.title;
        if (settings.chapters.chapterTitleCase === 'uppercase') {
          displayTitle = chapter.title.toUpperCase();
        } else if (settings.chapters.chapterTitleCase === 'lowercase') {
          displayTitle = chapter.title.toLowerCase();
        }
        
        // Get ornament
        const ornament = getChapterOrnament(settings);
        
        let chapterHtml = `
          <div class="chapter-start" id="chapter-${chapter.number}">
        `;
        
        // Add chapter number if enabled
        if (settings.chapters.showChapterNumber && settings.chapters.chapterNumberPosition !== 'hidden') {
          chapterHtml += `<p class="chapter-number">${this.escapeHtml(chapterNumberText)}</p>`;
        }
        
        // Add ornament above title if configured
        if (ornament && settings.chapters.chapterOrnamentPosition === 'between-number-title') {
          chapterHtml += `<p class="scene-break">${ornament}</p>`;
        }
        
        chapterHtml += `<h1 class="chapter-title">${this.escapeHtml(displayTitle)}</h1>`;
        
        // Add ornament below title if configured
        if (ornament && settings.chapters.chapterOrnamentPosition === 'below-title') {
          chapterHtml += `<p class="scene-break">${ornament}</p>`;
        }
        
        paragraphs.forEach((para, index) => {
          const trimmedPara = para.trim();
          
          // Check for scene breaks
          if (this.isSceneBreak(trimmedPara)) {
            chapterHtml += `<p class="scene-break">${sceneBreakSymbol || '* * *'}</p>`;
          } else {
            // Convert plain text to HTML paragraphs
            const htmlPara = this.escapeHtml(trimmedPara);
            chapterHtml += `<p>${htmlPara}</p>`;
          }
        });
        
        chapterHtml += '</div>';
        
        epubChapters.push({
          title: settings.chapters.showChapterNumber 
            ? `${settings.chapters.chapterNumberLabel} ${chapter.number}: ${chapter.title}`
            : chapter.title,
          content: chapterHtml,
        });
      }

      // 5. Bibliography (if enabled)
      if (book.bibliography?.config.enabled && book.bibliography.references.length > 0) {
        const { config, references } = book.bibliography;
        
        let bibHtml = `
          <div class="bibliography" id="bibliography">
            <h1>Bibliography</h1>
        `;
        
        const sortedReferences = CitationService.sortReferences(
          references,
          config.sortBy,
          config.sortDirection
        );
        
        sortedReferences.forEach((ref, index) => {
          const formatted = CitationService.formatReference(ref, config.citationStyle, index + 1);
          // Remove HTML tags but preserve the text
          const plainText = formatted.replace(/<[^>]*>/g, '');
          
          let refText = plainText;
          if (config.numberingStyle === 'numeric') {
            refText = `${index + 1}. ${plainText}`;
          } else if (config.numberingStyle === 'alphabetic') {
            refText = `${String.fromCharCode(65 + index)}. ${plainText}`;
          }
          
          bibHtml += `<p class="bibliography-entry">${this.escapeHtml(refText)}</p>`;
        });
        
        bibHtml += `
            <p style="text-align: center; margin-top: 2em; font-style: italic; font-size: 0.9em;">
              References formatted in ${config.citationStyle} style.
            </p>
          </div>
        `;
        
        epubChapters.push({
          title: 'Bibliography',
          content: bibHtml,
        });
      }

      // EPUB options following KDP guidelines
      const epubOptions: EPubOptions = {
        title: book.title,
        author: book.author,
        publisher: 'Dynamic Labs Media',
        description: book.description || `${book.title} by ${book.author}`,
        lang: 'en',
        tocTitle: 'Table of Contents',
        prependChapterTitles: false, // We handle chapter titles ourselves
        css: kdpStyles,
        verbose: false,
        // Add cover if available - pass URL string
        ...(book.coverUrl && {
          cover: book.coverUrl,
        }),
      };

      // Generate EPUB buffer - content is passed as second argument
      console.log('Generating EPUB buffer...');
      const epubBuffer = await epub(epubOptions, epubChapters);
      
      console.log(`EPUB generated successfully. Size: ${epubBuffer.length} bytes`);
      
      // Check file size (KDP recommends under 15-20 MB)
      const sizeMB = epubBuffer.length / (1024 * 1024);
      if (sizeMB > 15) {
        console.warn(`EPUB file size (${sizeMB.toFixed(2)} MB) exceeds KDP recommended limit of 15 MB`);
      }
      
      return epubBuffer;
    } catch (error) {
      console.error('EPUB generation error:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
        console.error('Error message:', error.message);
      }
      throw new Error(`EPUB generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Helper: Check if text is a scene break
   */
  private static isSceneBreak(text: string): boolean {
    const trimmed = text.trim();
    return trimmed === '***' || trimmed === '* * *' || trimmed === '---' || 
           trimmed === '- - -' || (trimmed.length <= 5 && /^[*\-]+$/.test(trimmed.replace(/\s/g, '')));
  }

  /**
   * Helper: Escape HTML special characters
   */
  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
