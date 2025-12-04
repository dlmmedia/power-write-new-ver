// Advanced Export Service with PDF and DOCX support
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
import PDFDocument from './pdf-document';
import { registerFonts } from './pdf-fonts';
import { Reference, BibliographyConfig, ChapterReferences } from '@/lib/types/bibliography';
import { CitationService } from './citation-service';

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
   */
  private static sanitizeChapterContent(chapter: { number: number; title: string; content: string }): string {
    let cleaned = chapter.content.trim();
    
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
   */
  static async exportBookAsDOCX(book: BookExport): Promise<Buffer> {
    // Professional font sizes (in half-points, so 24 = 12pt)
    const FONTS = {
      // Serif fonts for body and titles
      title: 'Georgia',
      heading: 'Georgia',
      body: 'Georgia',
      // Sans-serif for labels and metadata
      label: 'Calibri',
      toc: 'Calibri',
    };
    
    const SIZES = {
      bookTitle: 72,        // 36pt - Main book title
      chapterNumber: 48,    // 24pt - Chapter numbers
      chapterTitle: 36,     // 18pt - Chapter titles
      sectionTitle: 32,     // 16pt - Section headings
      body: 24,             // 12pt - Body text
      bodyLarge: 26,        // 13pt - First paragraph
      small: 20,            // 10pt - Small text
      tiny: 18,             // 9pt - Copyright, labels
      pageNum: 20,          // 10pt - Page numbers
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
    frontMatterChildren.push(
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
      new Paragraph({
        children: [
          new TextRun({ text: 'A BOOK BY', font: FONTS.label, size: SIZES.tiny, color: COLORS.muted }),
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
      }),
      ...(book.description ? [
        new Paragraph({
          children: [
            new TextRun({ text: book.description, font: FONTS.body, size: SIZES.small, color: COLORS.muted }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 400 },
        }),
      ] : []),
      new Paragraph({ children: [new PageBreak()] })
    );

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

    // Front matter section configuration
    const frontMatterSection = {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN },
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1.25),
            right: convertInchesToTwip(1.25),
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

      // Chapter number
      mainContentChildren.push(
        new Paragraph({ text: '', spacing: { before: 1500 } }),
        new Paragraph({
          children: [
            new TextRun({ text: 'CHAPTER', font: FONTS.label, size: 20, color: COLORS.muted }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: String(chapter.number), font: FONTS.heading, size: 60, color: COLORS.primary }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '━━━', font: FONTS.label, size: 24, color: COLORS.accent }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: chapter.title, font: FONTS.heading, size: SIZES.chapterTitle, italics: true, color: COLORS.secondary }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 800 },
        })
      );

      // Chapter content
      paragraphs.forEach((para, paraIndex) => {
        const trimmedPara = para.trim();

        // Handle scene breaks
        if (isSceneBreak(trimmedPara)) {
          mainContentChildren.push(
            new Paragraph({
              children: [
                new TextRun({ text: '* * *', font: FONTS.body, size: 24, color: COLORS.muted }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 400, after: 400 },
            })
          );
          return;
        }

        // First paragraph - no indent, slightly larger
        if (paraIndex === 0) {
          mainContentChildren.push(
            new Paragraph({
              children: [
                new TextRun({ text: trimmedPara, font: FONTS.body, size: SIZES.bodyLarge, color: COLORS.primary }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 280, line: 360 }, // 1.5 line spacing
            })
          );
        } else {
          // Regular paragraphs with first-line indent
          mainContentChildren.push(
            new Paragraph({
              children: [
                new TextRun({ text: trimmedPara, font: FONTS.body, size: SIZES.body, color: COLORS.primary }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 240, line: 360 },
              indent: { firstLine: convertInchesToTwip(0.4) },
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

    // Main content section configuration
    const mainContentSection = {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1.25),
            left: convertInchesToTwip(1.25),
            right: convertInchesToTwip(1.25),
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
   * Export book as PDF with professional formatting using React-PDF
   */
  static async exportBookAsPDF(book: BookExport): Promise<Buffer> {
    try {
      console.log(`Generating professional PDF for: ${book.title}`);
      console.log(`PDF has ${book.chapters?.length || 0} chapters`);
      
      // Ensure fonts are registered
      try {
        registerFonts();
        console.log('Fonts registered successfully');
      } catch (fontError) {
        console.warn('Font registration failed, continuing with defaults:', fontError);
      }
      
      // Create the PDF document component using React.createElement
      console.log('Creating PDF document component...');
      const doc = React.createElement(PDFDocument, { book });
      
      // Generate PDF blob
      console.log('Generating PDF blob...');
      const pdfBlob = await pdf(doc as any).toBlob();
      
      // Convert blob to buffer
      console.log('Converting to buffer...');
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      console.log(`PDF generated successfully. Size: ${buffer.length} bytes`);
      
      return buffer;
    } catch (error) {
      console.error('PDF generation error:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
      }
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
}
