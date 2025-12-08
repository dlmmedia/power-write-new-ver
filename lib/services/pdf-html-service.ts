// HTML-to-PDF Export Service using Puppeteer
// Generates professional book PDFs with CSS Paged Media

import puppeteer, { Browser, Page, PDFOptions } from 'puppeteer';
import { BookLayoutType, BOOK_LAYOUTS, LayoutConfig } from '@/lib/types/book-layouts';
import { generatePagedMediaCSS } from '@/lib/utils/css-paged-media';
import { PublishingSettings, DEFAULT_PUBLISHING_SETTINGS, TRIM_SIZES } from '@/lib/types/publishing';

// Use flexible types to accept various bibliography formats
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bibliography?: any; // Accept any bibliography format - we'll extract what we need
  publishingSettings?: PublishingSettings;
  layoutType?: BookLayoutType;
}

export class PDFHTMLService {
  private static browser: Browser | null = null;

  /**
   * Get or create a browser instance
   */
  private static async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.connected) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--font-render-hinting=none',
        ],
      });
    }
    return this.browser;
  }

  /**
   * Close the browser instance
   */
  static async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Generate PDF from book data using HTML/CSS
   */
  static async generateBookPDF(book: BookExport): Promise<Buffer> {
    console.log(`[PDF-HTML] Generating PDF for: ${book.title}`);
    console.log(`[PDF-HTML] Layout: ${book.layoutType || 'novel-classic'}`);
    console.log(`[PDF-HTML] Chapters: ${book.chapters?.length || 0}`);

    const browser = await this.getBrowser();
    let page: Page | null = null;

    try {
      page = await browser.newPage();

      // Get layout configuration
      const layoutType = book.layoutType || 'novel-classic';
      const layout = BOOK_LAYOUTS[layoutType] || BOOK_LAYOUTS['novel-classic'];

      // Generate HTML content
      const html = this.generateBookHTML(book, layout);

      // Set content with proper encoding
      await page.setContent(html, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 60000,
      });

      // Wait for fonts to load
      await page.evaluateHandle('document.fonts.ready');
      
      // Small delay for rendering
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get page dimensions from layout
      const pageDimensions = this.getPageDimensions(layout, book.publishingSettings);

      // Generate PDF
      const pdfOptions: PDFOptions = {
        format: undefined, // We'll use width/height instead
        width: pageDimensions.width,
        height: pageDimensions.height,
        printBackground: true,
        displayHeaderFooter: false, // We handle this in CSS
        preferCSSPageSize: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        timeout: 120000,
      };

      const pdfBuffer = await page.pdf(pdfOptions);

      console.log(`[PDF-HTML] PDF generated successfully. Size: ${pdfBuffer.length} bytes`);

      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('[PDF-HTML] Error generating PDF:', error);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Get page dimensions from layout or publishing settings
   */
  private static getPageDimensions(
    layout: LayoutConfig,
    publishingSettings?: PublishingSettings
  ): { width: string; height: string } {
    // Priority: publishing settings > layout config
    if (publishingSettings?.trimSize) {
      const trimSize = TRIM_SIZES.find(t => t.id === publishingSettings.trimSize);
      if (trimSize) {
        const isLandscape = publishingSettings.orientation === 'landscape';
        return {
          width: `${isLandscape ? trimSize.height : trimSize.width}in`,
          height: `${isLandscape ? trimSize.width : trimSize.height}in`,
        };
      }
    }

    // Parse from layout page size
    const pageSize = layout.page.size;
    if (pageSize === 'letter') {
      return { width: '8.5in', height: '11in' };
    }
    if (pageSize === 'A4') {
      return { width: '210mm', height: '297mm' };
    }

    const parts = pageSize.split(' ');
    return {
      width: parts[0],
      height: parts[1] || parts[0],
    };
  }

  /**
   * Generate complete HTML document for the book
   */
  private static generateBookHTML(book: BookExport, layout: LayoutConfig): string {
    const metadata = {
      title: book.title,
      author: book.author,
      chapters: book.chapters.map(c => ({ number: c.number, title: c.title })),
    };

    // Generate CSS
    const css = generatePagedMediaCSS(layout, metadata, {
      customCSS: book.publishingSettings?.customCSS,
    });

    // Generate HTML sections
    const frontMatter = this.generateFrontMatter(book, layout);
    const mainContent = this.generateMainContent(book, layout);
    const backMatter = this.generateBackMatter(book, layout);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(book.title)}</title>
  <style>
    ${css}
  </style>
</head>
<body>
  <!-- Front Matter -->
  <div class="front-matter">
    ${frontMatter}
  </div>

  <!-- Main Content -->
  <main class="book-content">
    ${mainContent}
  </main>

  <!-- Back Matter -->
  <div class="back-matter">
    ${backMatter}
  </div>
</body>
</html>`;
  }

  /**
   * Generate front matter HTML
   */
  private static generateFrontMatter(book: BookExport, layout: LayoutConfig): string {
    const currentYear = new Date().getFullYear();
    let html = '';

    // Half-title page (optional, elegant)
    html += `
    <section class="half-title-page break-after">
      <div style="padding-top: 40%;">
        <h1 class="book-title" style="font-size: 1.8em;">${this.escapeHtml(book.title)}</h1>
      </div>
    </section>`;

    // Title page
    html += `
    <section class="title-page break-after">
      <h1 class="book-title">${this.escapeHtml(book.title)}</h1>
      <p class="book-author">${this.escapeHtml(book.author)}</p>
      ${book.genre ? `<p class="book-genre">${this.escapeHtml(book.genre)}</p>` : ''}
      ${book.description ? `
      <div class="book-description" style="margin-top: 3em; font-style: italic; max-width: 80%; margin-left: auto; margin-right: auto;">
        ${this.escapeHtml(book.description)}
      </div>` : ''}
    </section>`;

    // Copyright page
    html += `
    <section class="copyright-page break-after">
      <p><strong>${this.escapeHtml(book.title)}</strong></p>
      <p>by ${this.escapeHtml(book.author)}</p>
      <br>
      <p>Copyright © ${currentYear} ${this.escapeHtml(book.author)}</p>
      <p>All rights reserved.</p>
      <br>
      <p style="font-size: 0.8em; color: #666;">
        No part of this publication may be reproduced, stored in a retrieval system,
        or transmitted in any form or by any means, electronic, mechanical, photocopying,
        recording, or otherwise, without the prior written permission of the copyright holder.
      </p>
      <br>
      <p style="font-size: 0.9em;">Published by Dynamic Labs Media</p>
      <p style="font-size: 0.8em; color: #888;">dlmworld.com</p>
      <br>
      <p style="font-size: 0.75em; font-style: italic; color: #aaa;">Created with PowerWrite</p>
    </section>`;

    // Table of Contents
    html += `
    <section class="toc-page break-after">
      <h1 class="toc-title">Contents</h1>
      <nav class="toc">
        ${book.chapters.map((chapter, index) => `
        <div class="toc-entry">
          <span class="toc-chapter-label">Chapter ${chapter.number}</span>
          <span class="toc-chapter-title">${this.escapeHtml(chapter.title)}</span>
          <span class="toc-leader"></span>
          <span class="toc-page-number">${index + 1}</span>
        </div>
        `).join('')}
        ${book.bibliography?.config.enabled && book.bibliography.references.length > 0 ? `
        <div class="toc-entry" style="margin-top: 1em;">
          <span class="toc-chapter-label"></span>
          <span class="toc-chapter-title">Bibliography</span>
          <span class="toc-leader"></span>
          <span class="toc-page-number">${book.chapters.length + 1}</span>
        </div>
        ` : ''}
      </nav>
    </section>`;

    return html;
  }

  /**
   * Generate main content (chapters) HTML
   */
  private static generateMainContent(book: BookExport, layout: LayoutConfig): string {
    return book.chapters.map((chapter, index) => {
      const content = this.processChapterContent(chapter.content, chapter, layout);
      
      // Determine chapter number display
      let chapterNumberDisplay = '';
      if (layout.chapter.numberStyle !== 'hidden') {
        switch (layout.chapter.numberStyle) {
          case 'roman':
            chapterNumberDisplay = this.toRoman(chapter.number);
            break;
          case 'word':
            chapterNumberDisplay = this.toWord(chapter.number);
            break;
          default:
            chapterNumberDisplay = String(chapter.number);
        }
      }

      return `
      <article class="chapter" id="chapter-${chapter.number}">
        <header class="chapter-header">
          ${layout.chapter.numberStyle !== 'hidden' ? `
          <span class="chapter-number-label">Chapter</span>
          <span class="chapter-number">${chapterNumberDisplay}</span>
          ` : ''}
          ${layout.chapter.ornament ? `
          <div class="chapter-ornament"></div>
          ` : ''}
          <h1 class="chapter-title">${this.escapeHtml(chapter.title)}</h1>
        </header>
        <div class="chapter-content">
          ${content}
        </div>
      </article>`;
    }).join('\n');
  }

  /**
   * Process chapter content - convert to HTML with proper formatting
   */
  private static processChapterContent(
    content: string,
    chapter: { number: number; title: string },
    layout: LayoutConfig
  ): string {
    // Remove duplicate chapter titles from content
    let cleaned = this.sanitizeChapterContent(content, chapter);

    // Split into paragraphs
    const paragraphs = cleaned.split(/\n\n+/).filter(p => p.trim());

    return paragraphs.map((para, index) => {
      const trimmed = para.trim();

      // Check for scene breaks
      if (this.isSceneBreak(trimmed)) {
        return `<div class="scene-break"></div>`;
      }

      // First paragraph gets special treatment for drop caps
      if (index === 0 && layout.typography.dropCap) {
        return `<p class="drop-cap">${this.escapeHtml(trimmed)}</p>`;
      }

      // Check for blockquotes (lines starting with >)
      if (trimmed.startsWith('>')) {
        const quoteContent = trimmed.replace(/^>\s*/gm, '');
        return `<blockquote><p>${this.escapeHtml(quoteContent)}</p></blockquote>`;
      }

      return `<p>${this.escapeHtml(trimmed)}</p>`;
    }).join('\n');
  }

  /**
   * Generate back matter HTML
   */
  private static generateBackMatter(book: BookExport, layout: LayoutConfig): string {
    let html = '';

    // Bibliography
    if (book.bibliography?.config?.enabled && book.bibliography.references?.length > 0) {
      const refs = book.bibliography.references;
      const config = book.bibliography.config;
      html += `
      <section class="bibliography break-before">
        <h1 style="text-align: center; margin-bottom: 2em;">Bibliography</h1>
        <div class="bibliography-entries">
          ${refs.map((ref: unknown, index: number) => `
          <p class="bibliography-entry">
            ${config.numberingStyle === 'numeric' ? `${index + 1}. ` : ''}
            ${this.formatReference(ref)}
          </p>
          `).join('\n')}
        </div>
        <p style="text-align: center; margin-top: 2em; font-style: italic; font-size: 0.85em; color: #888;">
          References formatted in ${config.citationStyle || 'APA'} style.
        </p>
      </section>`;
    }

    // About the Author (placeholder)
    html += `
    <section class="about-author break-before">
      <h1 style="font-size: 1.5em; margin-bottom: 1em;">About the Author</h1>
      <p style="text-indent: 0;">
        ${this.escapeHtml(book.author)} is the author of ${this.escapeHtml(book.title)}.
      </p>
    </section>`;

    return html;
  }

  /**
   * Format a reference entry - accepts any format
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static formatReference(ref: any): string {
    const parts: string[] = [];

    // Handle authors (various formats)
    if (ref.authors && Array.isArray(ref.authors) && ref.authors.length > 0) {
      const authorNames = ref.authors.map((author: unknown) => {
        if (typeof author === 'string') {
          return author;
        }
        if (typeof author === 'object' && author !== null) {
          const a = author as { firstName?: string; lastName?: string; organization?: string };
          if (a.organization) return a.organization;
          return [a.firstName, a.lastName].filter(Boolean).join(' ');
        }
        return '';
      }).filter(Boolean);
      if (authorNames.length > 0) {
        parts.push(authorNames.join(', '));
      }
    }

    // Handle year (number or string)
    if (ref.year) {
      parts.push(`(${ref.year})`);
    }

    // Title
    if (ref.title) {
      parts.push(`<em>${this.escapeHtml(String(ref.title))}</em>`);
    }

    // Publisher
    if (ref.publisher) {
      parts.push(String(ref.publisher));
    }

    // URL
    if (ref.url) {
      parts.push(`<a href="${ref.url}">${ref.url}</a>`);
    }

    return parts.join('. ') + '.';
  }

  /**
   * Sanitize chapter content - remove duplicate titles
   */
  private static sanitizeChapterContent(
    content: string,
    chapter: { number: number; title: string }
  ): string {
    let cleaned = content.trim();

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

    return cleaned.replace(/\n{3,}/g, '\n\n');
  }

  /**
   * Check if text is a scene break
   */
  private static isSceneBreak(text: string): boolean {
    const trimmed = text.trim();
    return trimmed === '***' || 
           trimmed === '* * *' || 
           trimmed === '---' || 
           trimmed === '- - -' || 
           trimmed === '❧' ||
           trimmed === '• • •' ||
           (trimmed.length <= 5 && /^[*\-•]+$/.test(trimmed.replace(/\s/g, '')));
  }

  /**
   * Escape HTML special characters
   */
  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Convert number to Roman numerals
   */
  private static toRoman(num: number): string {
    const romanNumerals: [number, string][] = [
      [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
      [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
      [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
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
   * Convert number to word
   */
  private static toWord(num: number): string {
    const words = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
      'Eighteen', 'Nineteen', 'Twenty', 'Twenty-One', 'Twenty-Two', 'Twenty-Three',
      'Twenty-Four', 'Twenty-Five', 'Twenty-Six', 'Twenty-Seven', 'Twenty-Eight',
      'Twenty-Nine', 'Thirty'
    ];
    return num <= 30 ? words[num] : String(num);
  }

  /**
   * Generate a preview HTML (without PDF conversion)
   */
  static generatePreviewHTML(book: BookExport): string {
    const layoutType = book.layoutType || 'novel-classic';
    const layout = BOOK_LAYOUTS[layoutType] || BOOK_LAYOUTS['novel-classic'];
    return this.generateBookHTML(book, layout);
  }
}

