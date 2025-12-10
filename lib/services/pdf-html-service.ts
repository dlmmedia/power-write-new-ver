// HTML-to-PDF Export Service using Puppeteer
// Generates professional book PDFs with CSS Paged Media
// Now fully integrates PublishingSettings for complete control over PDF output

import puppeteerCore, { Browser, Page, PDFOptions } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { BookLayoutType, BOOK_LAYOUTS, LayoutConfig } from '@/lib/types/book-layouts';
import { 
  PublishingSettings, 
  DEFAULT_PUBLISHING_SETTINGS, 
  TRIM_SIZES,
  ChapterSettings,
  HeaderFooterSettings,
  TypographySettings as TypoSettings,
} from '@/lib/types/publishing';
import { 
  getFontFamily, 
  generateGoogleFontImport, 
  getRequiredFontsForSettings,
  getGoogleFontsLinkElement,
} from '@/lib/utils/font-mapping';
import { sanitizeForExport } from '@/lib/utils/text-sanitizer';
import { isNovel } from '@/lib/utils/book-type';

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
   * Uses @sparticuz/chromium for Vercel serverless compatibility
   */
  private static async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.connected) {
      console.log('[PDF-HTML] Launching browser...');
      
      // Check if running on Vercel (serverless)
      const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;
      
      if (isVercel) {
        console.log('[PDF-HTML] Running on Vercel - using @sparticuz/chromium');
        
        // Configure chromium for serverless (disable graphics for performance)
        chromium.setGraphicsMode = false;
        
        const executablePath = await chromium.executablePath();
        console.log('[PDF-HTML] Chromium executable path:', executablePath);
        
        this.browser = await puppeteerCore.launch({
          args: chromium.args,
          defaultViewport: { width: 1920, height: 1080 },
          executablePath,
          headless: true,
        }) as Browser;
      } else {
        console.log('[PDF-HTML] Running locally - using local puppeteer');
        // For local development, try to use system Chrome or Puppeteer's bundled Chromium
        try {
          // Try puppeteer-core with default Chrome locations
          const puppeteer = await import('puppeteer');
          this.browser = await puppeteer.default.launch({
            headless: true,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-gpu',
              '--font-render-hinting=none',
            ],
          }) as unknown as Browser;
        } catch (localError) {
          console.warn('[PDF-HTML] Local puppeteer failed, trying puppeteer-core:', localError);
          // Fallback to puppeteer-core with common Chrome paths
          const possiblePaths = [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // macOS
            '/usr/bin/google-chrome', // Linux
            '/usr/bin/chromium-browser', // Linux Chromium
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Windows
          ];
          
          let execPath = '';
          for (const path of possiblePaths) {
            try {
              const fs = await import('fs');
              if (fs.existsSync(path)) {
                execPath = path;
                break;
              }
            } catch {
              continue;
            }
          }
          
          if (execPath) {
            this.browser = await puppeteerCore.launch({
              headless: true,
              executablePath: execPath,
              args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
              ],
            }) as Browser;
          } else {
            throw new Error('Could not find Chrome/Chromium installation');
          }
        }
      }
      
      console.log('[PDF-HTML] Browser launched successfully');
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
   * Fetch an image from URL and convert to base64 data URL
   * This avoids CORS issues when embedding images in the PDF
   */
  private static async fetchImageAsBase64(url: string): Promise<string | undefined> {
    if (!url) return undefined;
    
    // If already a data URL, return as-is
    if (url.startsWith('data:')) {
      return url;
    }
    
    try {
      console.log(`[PDF-HTML] Fetching image: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`[PDF-HTML] Failed to fetch image: ${response.status} ${response.statusText}`);
        return undefined;
      }
      
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/png';
      const dataUrl = `data:${mimeType};base64,${base64}`;
      
      console.log(`[PDF-HTML] Image fetched successfully, size: ${buffer.byteLength} bytes`);
      return dataUrl;
    } catch (error) {
      console.error(`[PDF-HTML] Error fetching image:`, error);
      return undefined;
    }
  }

  /**
   * Generate PDF from book data using HTML/CSS
   */
  static async generateBookPDF(book: BookExport): Promise<Buffer> {
    console.log(`[PDF-HTML] Generating PDF for: ${book.title}`);
    console.log(`[PDF-HTML] Layout: ${book.layoutType || 'novel-classic'}`);
    console.log(`[PDF-HTML] Chapters: ${book.chapters?.length || 0}`);
    console.log(`[PDF-HTML] Cover URL: ${book.coverUrl ? 'Yes' : 'No'}`);
    console.log(`[PDF-HTML] Back Cover URL: ${book.backCoverUrl ? 'Yes' : 'No'}`);

    // Pre-fetch cover images and convert to base64 to avoid CORS issues
    let coverBase64: string | undefined;
    let backCoverBase64: string | undefined;
    
    if (book.coverUrl) {
      console.log(`[PDF-HTML] Pre-fetching cover image...`);
      coverBase64 = await this.fetchImageAsBase64(book.coverUrl);
      if (coverBase64) {
        console.log(`[PDF-HTML] Cover image converted to base64`);
      }
    }
    
    if (book.backCoverUrl) {
      console.log(`[PDF-HTML] Pre-fetching back cover image...`);
      backCoverBase64 = await this.fetchImageAsBase64(book.backCoverUrl);
      if (backCoverBase64) {
        console.log(`[PDF-HTML] Back cover image converted to base64`);
      }
    }

    // Create a modified book object with base64 images
    const bookWithBase64Images: BookExport = {
      ...book,
      coverUrl: coverBase64 || book.coverUrl,
      backCoverUrl: backCoverBase64 || book.backCoverUrl,
    };

    const browser = await this.getBrowser();
    let page: Page | null = null;

    try {
      page = await browser.newPage();

      // Get layout configuration
      const layoutType = book.layoutType || 'novel-classic';
      const layout = BOOK_LAYOUTS[layoutType] || BOOK_LAYOUTS['novel-classic'];
      const settings = book.publishingSettings || DEFAULT_PUBLISHING_SETTINGS;

      // Generate HTML content with full publishing settings (using base64 images)
      const html = this.generateBookHTML(bookWithBase64Images, layout, settings);

      // Set content with proper encoding
      await page.setContent(html, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 60000,
      });

      // Wait for fonts and images to load
      await page.evaluateHandle('document.fonts.ready');
      
      // Wait for images to load
      await page.evaluate(async () => {
        const images = Array.from(document.images);
        await Promise.all(
          images.map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve; // Don't fail on image errors
              setTimeout(resolve, 5000); // Timeout after 5s
            });
          })
        );
      });
      
      // Small delay for rendering
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get page dimensions from publishing settings
      const pageDimensions = this.getPageDimensions(layout, settings);

      // Check if page numbers are enabled in settings
      const footerEnabled = settings.headerFooter?.footerEnabled ?? true;
      const footerCenterContent = settings.headerFooter?.footerCenterContent ?? 'page-number';
      const showPageNumbers = footerEnabled && footerCenterContent === 'page-number';
      const footerFontSize = settings.headerFooter?.footerFontSize ?? 10;

      // Footer template for Puppeteer - shows page number centered at bottom
      // Note: Page numbers will appear on all pages including front matter
      // This is standard for many published books
      const footerTemplate = showPageNumbers ? `
        <div style="width: 100%; font-size: ${footerFontSize}pt; font-family: Georgia, 'Times New Roman', serif; text-align: center; color: #444; margin: 0 auto;">
          <span class="pageNumber"></span>
        </div>
      ` : '<div></div>';

      // Header template (empty but required)
      const headerTemplate = '<div></div>';

      // Generate PDF with page numbers via Puppeteer's displayHeaderFooter
      const pdfOptions: PDFOptions = {
        format: undefined, // We'll use width/height instead
        width: pageDimensions.width,
        height: pageDimensions.height,
        printBackground: true,
        displayHeaderFooter: showPageNumbers,
        headerTemplate: headerTemplate,
        footerTemplate: footerTemplate,
        preferCSSPageSize: true,
        // Margins needed for footer to be visible
        margin: showPageNumbers 
          ? { top: '0.25in', right: 0, bottom: '0.5in', left: 0 }
          : { top: 0, right: 0, bottom: 0, left: 0 },
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
   * Get page dimensions from publishing settings
   */
  private static getPageDimensions(
    layout: LayoutConfig,
    settings: PublishingSettings
  ): { width: string; height: string } {
    // Priority: publishing settings > layout config
    if (settings?.trimSize) {
      const trimSize = TRIM_SIZES.find(t => t.id === settings.trimSize);
      if (trimSize) {
        const isLandscape = settings.orientation === 'landscape';
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
   * Estimate the page number where each chapter starts
   * This is used for accurate TOC page numbers
   */
  private static estimateChapterPageNumbers(
    book: BookExport,
    settings: PublishingSettings
  ): number[] {
    // Get page dimensions
    const trimSize = TRIM_SIZES.find(t => t.id === settings.trimSize);
    const pageWidth = trimSize ? trimSize.width : 5.5; // inches
    const pageHeight = trimSize ? trimSize.height : 8.5; // inches
    
    // Calculate content area
    const margins = settings.margins;
    const contentWidth = pageWidth - margins.inside - margins.outside;
    const contentHeight = pageHeight - margins.top - margins.bottom;
    
    // Typography settings
    const fontSize = settings.typography.bodyFontSize || 11; // points
    const lineHeight = settings.typography.bodyLineHeight || 1.5;
    
    // Approximate characters per line and lines per page
    // Average character width is roughly fontSize * 0.5 points = fontSize * 0.007 inches
    const charsPerLine = Math.floor(contentWidth / (fontSize * 0.007));
    // Line height in inches: fontSize (points) / 72 * lineHeight
    const lineHeightInches = (fontSize / 72) * lineHeight;
    const linesPerPage = Math.floor(contentHeight / lineHeightInches);
    
    // Characters per page (rough estimate)
    const charsPerPage = charsPerLine * linesPerPage * 0.85; // 85% fill factor
    
    // Count front matter pages
    let frontMatterPages = 1; // Cover page
    if (settings.frontMatter.halfTitlePage) frontMatterPages += 1;
    if (settings.frontMatter.titlePage) frontMatterPages += 1;
    if (settings.frontMatter.copyrightPage) frontMatterPages += 1;
    if (settings.frontMatter.dedicationPage) frontMatterPages += 1;
    if (settings.frontMatter.tableOfContents) {
      // TOC pages based on number of chapters
      frontMatterPages += Math.ceil(book.chapters.length / 20); // ~20 entries per page
    }
    
    // Calculate page numbers for each chapter
    const chapterPageNumbers: number[] = [];
    let currentPage = frontMatterPages + 1; // First chapter starts after front matter
    
    for (const chapter of book.chapters) {
      chapterPageNumbers.push(currentPage);
      
      // Estimate pages for this chapter
      const chapterContent = chapter.content || '';
      const charCount = chapterContent.length;
      
      // Each chapter starts on a new page, plus content pages
      // Add 1 for chapter header/title area
      const contentPages = Math.max(1, Math.ceil(charCount / charsPerPage));
      currentPage += contentPages;
    }
    
    return chapterPageNumbers;
  }

  /**
   * Estimate the total number of pages in the PDF
   */
  private static estimateTotalPages(
    book: BookExport,
    settings: PublishingSettings,
    chapterPageNumbers: number[]
  ): number {
    if (chapterPageNumbers.length === 0) return 1;
    
    // Last chapter's start page
    const lastChapterStartPage = chapterPageNumbers[chapterPageNumbers.length - 1];
    
    // Estimate pages for last chapter
    const lastChapter = book.chapters[book.chapters.length - 1];
    const charsPerPage = this.getCharsPerPage(settings);
    const lastChapterPages = Math.max(1, Math.ceil((lastChapter?.content?.length || 0) / charsPerPage));
    
    let totalPages = lastChapterStartPage + lastChapterPages - 1;
    
    // Add bibliography pages if enabled
    if (book.bibliography?.config?.enabled && book.bibliography.references?.length > 0) {
      totalPages += 1 + Math.ceil(book.bibliography.references.length / 15); // ~15 refs per page
    }
    
    // Add back cover if present
    if (book.backCoverUrl) {
      totalPages += 1;
    }
    
    return totalPages;
  }

  /**
   * Count the number of front matter pages
   */
  private static countFrontMatterPages(book: BookExport, settings: PublishingSettings): number {
    let pages = 0;
    
    // Cover page (always present)
    pages += 1;
    
    const frontMatter = settings.frontMatter;
    if (frontMatter.halfTitlePage) pages += 1;
    if (frontMatter.titlePage) pages += 1;
    if (frontMatter.copyrightPage) pages += 1;
    if (frontMatter.dedicationPage) pages += 1;
    if (frontMatter.tableOfContents) {
      // Estimate TOC pages based on chapter count
      pages += Math.ceil(book.chapters.length / 20);
    }
    
    return pages;
  }

  /**
   * Helper to calculate characters per page
   */
  private static getCharsPerPage(settings: PublishingSettings): number {
    const trimSize = TRIM_SIZES.find(t => t.id === settings.trimSize);
    const pageWidth = trimSize ? trimSize.width : 5.5;
    const pageHeight = trimSize ? trimSize.height : 8.5;
    const margins = settings.margins;
    const contentWidth = pageWidth - margins.inside - margins.outside;
    const contentHeight = pageHeight - margins.top - margins.bottom;
    const fontSize = settings.typography.bodyFontSize || 11;
    const lineHeight = settings.typography.bodyLineHeight || 1.5;
    
    const charsPerLine = Math.floor(contentWidth / (fontSize * 0.007));
    const lineHeightInches = (fontSize / 72) * lineHeight;
    const linesPerPage = Math.floor(contentHeight / lineHeightInches);
    
    return charsPerLine * linesPerPage * 0.85;
  }

  /**
   * Generate complete HTML document for the book
   */
  private static generateBookHTML(
    book: BookExport, 
    layout: LayoutConfig, 
    settings: PublishingSettings
  ): string {
    const metadata = {
      title: book.title,
      author: book.author,
      chapters: book.chapters.map(c => ({ number: c.number, title: c.title })),
    };

    // Get required fonts and generate import
    const requiredFonts = getRequiredFontsForSettings({
      bodyFont: settings.typography.bodyFont,
      headingFont: settings.typography.headingFont,
      dropCapFont: settings.typography.dropCapFont,
      headerFont: settings.headerFooter.headerFont,
      footerFont: settings.headerFooter.footerFont,
    });
    const fontLinks = getGoogleFontsLinkElement(requiredFonts);
    const fontImport = generateGoogleFontImport(requiredFonts);

    // Generate CSS with publishing settings
    const css = this.generateBookCSS(layout, settings, metadata);

    // Calculate estimated page numbers for TOC
    const chapterPageNumbers = this.estimateChapterPageNumbers(book, settings);

    // Generate HTML sections based on settings
    const coverPage = this.generateCoverPage(book);
    const frontMatter = this.generateFrontMatter(book, settings, chapterPageNumbers);
    const mainContent = this.generateMainContent(book, settings);
    const backMatter = this.generateBackMatter(book, settings);
    const backCoverPage = this.generateBackCoverPage(book);

    return `
<!DOCTYPE html>
<html lang="${settings.language || 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(book.title)}</title>
  ${fontLinks}
  <style>
    ${fontImport}
    ${css}
  </style>
</head>
<body>
  <!-- Cover Page -->
  ${coverPage}

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

  <!-- Back Cover Page -->
  ${backCoverPage}
</body>
</html>`;
  }

  /**
   * Generate CSS based on publishing settings
   */
  private static generateBookCSS(
    layout: LayoutConfig,
    settings: PublishingSettings,
    metadata: { title: string; author: string }
  ): string {
    const typo = settings.typography;
    const margins = settings.margins;
    const chapters = settings.chapters;
    const headerFooter = settings.headerFooter;

    // Get actual font families
    const bodyFontFamily = getFontFamily(typo.bodyFont);
    const headingFontFamily = typo.headingFont === 'inherit' 
      ? bodyFontFamily 
      : getFontFamily(typo.headingFont);
    const dropCapFontFamily = typo.dropCapFont === 'inherit'
      ? headingFontFamily
      : getFontFamily(typo.dropCapFont);

    // Get page size
    const trimSize = TRIM_SIZES.find(t => t.id === settings.trimSize);
    const isLandscape = settings.orientation === 'landscape';
    const pageWidth = trimSize 
      ? (isLandscape ? trimSize.height : trimSize.width) 
      : 5.5;
    const pageHeight = trimSize 
      ? (isLandscape ? trimSize.width : trimSize.height) 
      : 8.5;

    // Calculate paragraph indent
    const indentValue = typo.paragraphIndentUnit === 'em' 
      ? `${typo.paragraphIndent}em`
      : typo.paragraphIndentUnit === 'px'
        ? `${typo.paragraphIndent}px`
        : `${typo.paragraphIndent}in`;

    // Paragraph spacing
    const paraSpacingMap = {
      'none': '0',
      'small': '0.25em',
      'medium': '0.5em',
      'large': '1em',
    };
    const paraSpacing = paraSpacingMap[typo.paragraphSpacing] || '0';

    // Scene break symbol based on settings
    const sceneBreakSymbol = this.getSceneBreakSymbol(chapters.sceneBreakStyle, chapters.sceneBreakSymbol);

    // Chapter ornament symbol
    const chapterOrnamentSymbol = this.getChapterOrnamentSymbol(chapters.chapterOrnament);

    return `
/* ==============================================
   CSS PAGED MEDIA STYLESHEET
   Generated for: ${metadata.title} by ${metadata.author}
   Publishing Settings Applied
   ============================================== */

/* ==============================================
   CSS VARIABLES & ROOT
   ============================================== */
:root {
  --body-font: ${bodyFontFamily};
  --heading-font: ${headingFontFamily};
  --drop-cap-font: ${dropCapFontFamily};
  --body-size: ${typo.bodyFontSize}pt;
  --line-height: ${typo.bodyLineHeight};
  --chapter-title-size: ${typo.chapterTitleSize}pt;
  --text-color: #1a1a1a;
  --muted-color: #666;
  --accent-color: #8B4513;
  
  /* Page dimensions */
  --page-width: ${pageWidth}in;
  --page-height: ${pageHeight}in;
  --margin-top: ${margins.top}in;
  --margin-bottom: ${margins.bottom}in;
  --margin-inside: ${margins.inside}in;
  --margin-outside: ${margins.outside}in;
}

/* ==============================================
   @PAGE RULES - Page Layout
   ============================================== */

/* Base page */
@page {
  size: ${pageWidth}in ${pageHeight}in${isLandscape ? ' landscape' : ''};
  margin: ${margins.top}in ${margins.outside}in ${margins.bottom}in ${margins.inside}in;
  
  ${margins.bleed > 0 ? `
  marks: crop cross;
  bleed: ${margins.bleed}in;
  ` : ''}
}

/* Cover pages - no margins */
@page cover {
  margin: 0;
}

/* Left (verso) pages - even page numbers */
@page :left {
  margin-left: ${margins.outside}in;
  margin-right: ${margins.inside}in;
}

/* Right (recto) pages - odd page numbers */
@page :right {
  margin-left: ${margins.inside}in;
  margin-right: ${margins.outside}in;
}

/* Front matter pages - no page numbers */
@page front-matter {
  /* No margin box content - Puppeteer doesn't support @bottom-center etc. */
}

/* Chapter pages */
@page chapter-start {
  /* Chapter opening pages */
}

/* ==============================================
   BASE TYPOGRAPHY
   ============================================== */

* {
  box-sizing: border-box;
}

html {
  font-size: ${typo.bodyFontSize}pt;
}

body {
  font-family: var(--body-font);
  font-size: var(--body-size);
  line-height: var(--line-height);
  color: var(--text-color);
  text-align: ${typo.bodyAlignment};
  ${typo.hyphenation ? `
  hyphens: auto;
  -webkit-hyphens: auto;
  ` : ''}
  ${typo.orphanControl ? 'orphans: 2;' : ''}
  ${typo.widowControl ? 'widows: 2;' : ''}
  margin: 0;
  padding: 0;
}

/* Paragraphs */
p {
  margin: 0;
  margin-bottom: ${paraSpacing};
  text-indent: ${indentValue};
}

/* First paragraph handling */
${!typo.firstParagraphIndent ? `
p:first-of-type,
h1 + p,
h2 + p,
h3 + p,
.no-indent + p,
.scene-break + p,
.chapter-header + .chapter-content > p:first-of-type {
  text-indent: 0;
}
` : ''}

/* Drop Caps */
${typo.dropCapEnabled ? `
.chapter-content > p:first-of-type::first-letter,
.drop-cap::first-letter {
  float: left;
  font-family: var(--drop-cap-font);
  font-size: ${typo.dropCapLines * 1.15}em;
  line-height: 0.85;
  padding-right: 0.1em;
  margin-top: 0.05em;
  font-weight: normal;
  color: var(--text-color);
}
` : ''}

/* ==============================================
   HEADINGS
   ============================================== */

h1, h2, h3, h4, h5, h6 {
  font-family: var(--heading-font);
  margin: 0;
  page-break-after: avoid;
  break-after: avoid;
}

h1 {
  font-size: var(--chapter-title-size);
  font-weight: normal;
  text-align: ${typo.headingAlignment};
  margin-bottom: 1em;
}

h2 {
  font-size: 1.5em;
  font-weight: 600;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

h3 {
  font-size: 1.2em;
  font-weight: 600;
  margin-top: 1em;
  margin-bottom: 0.3em;
}

/* ==============================================
   COVER PAGES
   ============================================== */

.cover-page {
  page: cover;
  break-before: page;
  page-break-before: always;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.cover-page img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-page.text-cover {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #2c3e50 0%, #1a252f 100%);
  color: white;
  padding: 2in;
  text-align: center;
}

.cover-page.text-cover .cover-title {
  font-family: var(--heading-font);
  font-size: 3em;
  font-weight: normal;
  margin-bottom: 0.5em;
  letter-spacing: 0.05em;
}

.cover-page.text-cover .cover-author {
  font-family: var(--body-font);
  font-size: 1.5em;
  font-style: italic;
  opacity: 0.9;
}

.cover-page.text-cover .cover-genre {
  font-size: 1em;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-top: 2em;
  opacity: 0.7;
}

/* ==============================================
   CHAPTER STYLING
   ============================================== */

.chapter {
  page: chapter-start;
  ${chapters.startOnOddPage ? `
  break-before: right;
  page-break-before: right;
  ` : `
  break-before: page;
  page-break-before: always;
  `}
}

.chapter:first-of-type {
  break-before: auto;
  page-break-before: auto;
}

.chapter-header {
  text-align: ${chapters.chapterTitlePosition === 'centered' ? 'center' : chapters.chapterTitlePosition};
  padding-top: ${chapters.chapterDropFromTop}in;
  margin-bottom: ${chapters.afterChapterTitleSpace}in;
}

/* Chapter number styling */
.chapter-number-label {
  font-family: var(--body-font);
  font-size: 0.8em;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--muted-color);
  display: block;
  margin-bottom: 0.5em;
}

.chapter-number {
  font-family: var(--heading-font);
  font-size: 2.5em;
  display: block;
  margin-bottom: 0.3em;
}

.chapter-title {
  font-family: var(--heading-font);
  font-size: var(--chapter-title-size);
  font-weight: normal;
  margin: 0;
  ${chapters.chapterTitleCase === 'uppercase' ? 'text-transform: uppercase;' : ''}
  ${chapters.chapterTitleCase === 'lowercase' ? 'text-transform: lowercase;' : ''}
}

/* Chapter ornaments */
${chapters.chapterOrnament !== 'none' ? `
.chapter-ornament {
  text-align: center;
  font-size: 1.5em;
  color: var(--accent-color);
  margin: 1em 0;
}

.chapter-ornament::before {
  content: "${chapterOrnamentSymbol}";
}
` : ''}

/* ==============================================
   SCENE BREAKS
   ============================================== */

.scene-break {
  text-align: center;
  margin: 2em 0;
  page-break-inside: avoid;
  break-inside: avoid;
}

.scene-break::before {
  content: "${sceneBreakSymbol}";
  color: var(--muted-color);
  letter-spacing: 0.5em;
}

/* ==============================================
   FRONT MATTER
   ============================================== */

.front-matter {
  page: front-matter;
}

.half-title-page {
  break-before: right;
  page-break-before: right;
  text-align: center;
  padding-top: 40%;
}

.half-title-page .book-title {
  font-size: 1.8em;
}

.title-page {
  break-before: right;
  page-break-before: right;
  text-align: center;
  padding-top: 30%;
}

.book-title {
  font-family: var(--heading-font);
  font-size: 3em;
  font-weight: normal;
  margin-bottom: 0.5em;
  letter-spacing: 0.05em;
}

.book-author {
  font-family: var(--body-font);
  font-size: 1.5em;
  font-style: italic;
  margin-bottom: 2em;
}

.book-genre {
  font-size: 1em;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--muted-color);
}

.book-publisher {
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--muted-color);
}

.copyright-page {
  break-before: left;
  page-break-before: left;
  font-size: 0.85em;
  text-align: center;
  padding-top: 60%;
}

.copyright-page p {
  text-indent: 0;
  margin-bottom: 0.5em;
}

.dedication-page {
  break-before: right;
  page-break-before: right;
  text-align: center;
  padding-top: 35%;
  font-style: italic;
}

.toc-page {
  break-before: right;
  page-break-before: right;
}

.toc-title {
  text-align: center;
  font-size: 1.5em;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-bottom: 2em;
}

.toc-entry {
  display: flex;
  align-items: baseline;
  margin-bottom: 0.5em;
}

.toc-chapter-label {
  font-size: 0.85em;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted-color);
  margin-right: 1em;
}

.toc-chapter-title {
  flex: 1;
}

.toc-leader {
  flex: 1;
  border-bottom: 1px dotted var(--muted-color);
  margin: 0 0.5em;
  height: 0.8em;
}

.toc-page-number {
  font-variant-numeric: tabular-nums;
}

/* ==============================================
   BACK MATTER
   ============================================== */

.bibliography {
  break-before: page;
  page-break-before: always;
}

.bibliography-entry {
  text-indent: -1.5em;
  padding-left: 1.5em;
  margin-bottom: 0.5em;
}

.about-author {
  break-before: page;
  page-break-before: always;
  text-align: center;
}

.also-by {
  break-before: page;
  page-break-before: always;
}

/* ==============================================
   SPECIAL ELEMENTS
   ============================================== */

blockquote {
  font-style: italic;
  margin: 1.5em 2em;
  text-indent: 0;
}

blockquote p {
  text-indent: 0;
}

.epigraph {
  font-style: italic;
  text-align: right;
  margin: 2em 10% 3em;
  font-size: 0.95em;
}

.epigraph-author {
  font-style: normal;
  display: block;
  margin-top: 0.5em;
}

.epigraph-author::before {
  content: "— ";
}

/* ==============================================
   IMAGES
   ============================================== */

img {
  max-width: 100%;
  height: auto;
}

/* ==============================================
   PRINT UTILITIES
   ============================================== */

.no-break {
  break-inside: avoid;
  page-break-inside: avoid;
}

.break-before {
  break-before: page;
  page-break-before: always;
}

.break-after {
  break-after: page;
  page-break-after: always;
}

.keep-together {
  break-inside: avoid;
  page-break-inside: avoid;
}

/* ==============================================
   CUSTOM STYLES
   ============================================== */

${settings.customCSS || ''}
`;
  }

  /**
   * Generate header CSS for page margins
   */
  private static generateHeaderCSS(
    page: 'left' | 'right', 
    headerFooter: HeaderFooterSettings,
    metadata: { title: string; author: string }
  ): string {
    const getContent = (content: string) => {
      switch (content) {
        case 'title': return `"${metadata.title}"`;
        case 'author': return `"${metadata.author}"`;
        case 'chapter': return 'string(chapter-title)';
        case 'page-number': return 'counter(page)';
        case 'none': return 'none';
        default: return 'none';
      }
    };

    const fontStyle = headerFooter.headerStyle === 'italic' ? 'font-style: italic;' :
                      headerFooter.headerStyle === 'small-caps' ? 'font-variant: small-caps;' :
                      headerFooter.headerStyle === 'uppercase' ? 'text-transform: uppercase;' : '';

    // Mirror headers if enabled
    let leftContent, centerContent, rightContent;
    if (headerFooter.mirrorHeaders && page === 'left') {
      leftContent = getContent(headerFooter.headerRightContent);
      centerContent = getContent(headerFooter.headerCenterContent);
      rightContent = getContent(headerFooter.headerLeftContent);
    } else {
      leftContent = getContent(headerFooter.headerLeftContent);
      centerContent = getContent(headerFooter.headerCenterContent);
      rightContent = getContent(headerFooter.headerRightContent);
    }

    return `
  @top-left {
    content: ${leftContent};
    font-family: var(--body-font);
    font-size: ${headerFooter.headerFontSize}pt;
    ${fontStyle}
    color: var(--muted-color);
    vertical-align: bottom;
    padding-bottom: 0.5em;
  }
  @top-center {
    content: ${centerContent};
    font-family: var(--body-font);
    font-size: ${headerFooter.headerFontSize}pt;
    ${fontStyle}
    color: var(--muted-color);
  }
  @top-right {
    content: ${rightContent};
    font-family: var(--body-font);
    font-size: ${headerFooter.headerFontSize}pt;
    ${fontStyle}
    color: var(--muted-color);
    vertical-align: bottom;
    padding-bottom: 0.5em;
  }`;
  }

  /**
   * Generate footer CSS for page margins
   */
  private static generateFooterCSS(
    page: 'left' | 'right',
    headerFooter: HeaderFooterSettings
  ): string {
    const getContent = (content: string) => {
      switch (content) {
        case 'page-number': 
          const style = headerFooter.pageNumberStyle === 'roman-lower' ? 'lower-roman' :
                        headerFooter.pageNumberStyle === 'roman-upper' ? 'upper-roman' : 'decimal';
          return `counter(page, ${style})`;
        case 'none': return 'none';
        default: return 'none';
      }
    };

    // Mirror footers if mirror headers is enabled
    let leftContent, centerContent, rightContent;
    if (headerFooter.mirrorHeaders && page === 'left') {
      leftContent = getContent(headerFooter.footerRightContent);
      centerContent = getContent(headerFooter.footerCenterContent);
      rightContent = getContent(headerFooter.footerLeftContent);
    } else {
      leftContent = getContent(headerFooter.footerLeftContent);
      centerContent = getContent(headerFooter.footerCenterContent);
      rightContent = getContent(headerFooter.footerRightContent);
    }

    return `
  @bottom-left {
    content: ${leftContent};
    font-family: var(--body-font);
    font-size: ${headerFooter.footerFontSize}pt;
  }
  @bottom-center {
    content: ${centerContent};
    font-family: var(--body-font);
    font-size: ${headerFooter.footerFontSize}pt;
  }
  @bottom-right {
    content: ${rightContent};
    font-family: var(--body-font);
    font-size: ${headerFooter.footerFontSize}pt;
  }`;
  }

  /**
   * Get scene break symbol
   */
  private static getSceneBreakSymbol(style: string, customSymbol?: string): string {
    switch (style) {
      case 'blank-line': return '';
      case 'asterisks': return '* * *';
      case 'ornament': return '❦';
      case 'number': return '•';
      case 'custom': return customSymbol || '* * *';
      default: return '* * *';
    }
  }

  /**
   * Get chapter ornament symbol
   */
  private static getChapterOrnamentSymbol(ornament: string): string {
    switch (ornament) {
      case 'line': return '━━━━━━━━━';
      case 'flourish': return '❧';
      case 'stars': return '✦ ✦ ✦';
      case 'dots': return '• • •';
      default: return '';
    }
  }

  /**
   * Generate cover page HTML
   */
  private static generateCoverPage(book: BookExport): string {
    if (!book.coverUrl) {
      // Generate a text-based cover if no image
      return `
      <section class="cover-page text-cover">
        <h1 class="cover-title">${this.escapeHtml(book.title)}</h1>
        <p class="cover-author">${this.escapeHtml(book.author)}</p>
        ${book.genre ? `<p class="cover-genre">${this.escapeHtml(book.genre)}</p>` : ''}
      </section>`;
    }

    return `
    <section class="cover-page">
      <img src="${book.coverUrl}" alt="${this.escapeHtml(book.title)} Cover" />
    </section>`;
  }

  /**
   * Generate back cover page HTML
   */
  private static generateBackCoverPage(book: BookExport): string {
    if (!book.backCoverUrl) {
      return '';
    }

    return `
    <section class="cover-page">
      <img src="${book.backCoverUrl}" alt="${this.escapeHtml(book.title)} Back Cover" />
    </section>`;
  }

  /**
   * Generate front matter HTML based on settings
   */
  private static generateFrontMatter(book: BookExport, settings: PublishingSettings, chapterPageNumbers: number[]): string {
    const currentYear = new Date().getFullYear();
    const frontMatter = settings.frontMatter;
    let html = '';
    
    // Determine if this book should show "A Novel By" label
    const bookType = settings?.bookType;
    const showNovelLabel = isNovel(book.genre, bookType);

    // Half-title page
    if (frontMatter.halfTitlePage) {
      html += `
      <section class="half-title-page break-after">
        <h1 class="book-title">${this.escapeHtml(book.title)}</h1>
      </section>`;
    }

    // Title page - conditionally show "A Novel By" only for novels
    if (frontMatter.titlePage) {
      const authorSection = showNovelLabel 
        ? `<p class="book-author-label" style="font-size: 0.7em; letter-spacing: 0.2em; text-transform: uppercase; color: #666; margin-bottom: 0.5em;">A Novel By</p>
           <p class="book-author">${this.escapeHtml(book.author)}</p>`
        : `<p class="book-author">by ${this.escapeHtml(book.author)}</p>`;
      
      html += `
      <section class="title-page break-after">
        <h1 class="book-title">${this.escapeHtml(book.title)}</h1>
        ${authorSection}
        ${book.genre ? `<p class="book-genre">${this.escapeHtml(book.genre)}</p>` : ''}
        ${book.description ? `
        <div class="book-description" style="margin-top: 3em; font-style: italic; max-width: 80%; margin-left: auto; margin-right: auto;">
          ${this.escapeHtml(book.description)}
        </div>` : ''}
        ${settings.publisher ? `<p class="book-publisher" style="margin-top: 3em;">${this.escapeHtml(settings.publisher)}</p>` : ''}
      </section>`;
    }

    // Copyright page
    if (frontMatter.copyrightPage) {
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
        ${settings.isbn ? `<br><p style="font-size: 0.85em;">ISBN: ${settings.isbn}</p>` : ''}
        ${settings.publisher ? `
        <br>
        <p style="font-size: 0.9em;">Published by ${this.escapeHtml(settings.publisher)}</p>
        ${settings.publisherLocation ? `<p style="font-size: 0.8em; color: #888;">${this.escapeHtml(settings.publisherLocation)}</p>` : ''}
        ` : `
        <br>
        <p style="font-size: 0.9em;">Published by Dynamic Labs Media</p>
        <p style="font-size: 0.8em; color: #888;">dlmworld.com</p>
        `}
        <br>
        <p style="font-size: 0.75em; font-style: italic; color: #aaa;">Created with PowerWrite</p>
      </section>`;
    }

    // Dedication page
    if (frontMatter.dedicationPage) {
      html += `
      <section class="dedication-page break-after">
        <p>For those who believe in the power of words.</p>
      </section>`;
    }

    // Table of Contents
    if (frontMatter.tableOfContents) {
      const chapterSettings = settings.chapters;
      
      // Calculate bibliography page number (after last chapter)
      const lastChapterPageNum = chapterPageNumbers[chapterPageNumbers.length - 1] || 1;
      const lastChapterContent = book.chapters[book.chapters.length - 1]?.content || '';
      const charsPerPage = this.getCharsPerPage(settings);
      const lastChapterPages = Math.max(1, Math.ceil(lastChapterContent.length / charsPerPage));
      const bibliographyPageNum = lastChapterPageNum + lastChapterPages;
      
      html += `
      <section class="toc-page break-after">
        <h1 class="toc-title">Contents</h1>
        <nav class="toc">
          ${book.chapters.map((chapter, index) => {
            const chapterLabel = chapterSettings.showChapterNumber 
              ? `${chapterSettings.chapterNumberLabel} ${this.formatChapterNumber(chapter.number, chapterSettings.chapterNumberStyle)}`
              : '';
            // Use calculated page number instead of index + 1
            const pageNum = chapterPageNumbers[index] || (index + 1);
            return `
          <div class="toc-entry">
            <span class="toc-chapter-label">${chapterLabel}</span>
            <span class="toc-chapter-title">${this.escapeHtml(chapter.title)}</span>
            <span class="toc-leader"></span>
            <span class="toc-page-number">${pageNum}</span>
          </div>`;
          }).join('')}
          ${book.bibliography?.config?.enabled && book.bibliography.references?.length > 0 ? `
          <div class="toc-entry" style="margin-top: 1em;">
            <span class="toc-chapter-label"></span>
            <span class="toc-chapter-title">Bibliography</span>
            <span class="toc-leader"></span>
            <span class="toc-page-number">${bibliographyPageNum}</span>
          </div>
          ` : ''}
        </nav>
      </section>`;
    }

    return html;
  }

  /**
   * Generate main content (chapters) HTML
   */
  private static generateMainContent(book: BookExport, settings: PublishingSettings): string {
    const chapterSettings = settings.chapters;
    const typoSettings = settings.typography;

    return book.chapters.map((chapter) => {
      const content = this.processChapterContent(chapter.content, chapter, typoSettings, chapterSettings);
      
      // Determine chapter number display
      let chapterNumberDisplay = '';
      if (chapterSettings.showChapterNumber && chapterSettings.chapterNumberPosition !== 'hidden') {
        chapterNumberDisplay = this.formatChapterNumber(chapter.number, chapterSettings.chapterNumberStyle);
      }

      // Build chapter header based on settings
      let headerContent = '';
      
      // Ornament above number
      if (chapterSettings.chapterOrnament !== 'none' && chapterSettings.chapterOrnamentPosition === 'above-number') {
        headerContent += `<div class="chapter-ornament"></div>`;
      }

      // Chapter number above title
      if (chapterSettings.showChapterNumber && chapterSettings.chapterNumberPosition === 'above-title') {
        headerContent += `
          <span class="chapter-number-label">${chapterSettings.chapterNumberLabel}</span>
          <span class="chapter-number">${chapterNumberDisplay}</span>`;
      }

      // Ornament between number and title
      if (chapterSettings.chapterOrnament !== 'none' && chapterSettings.chapterOrnamentPosition === 'between-number-title') {
        headerContent += `<div class="chapter-ornament"></div>`;
      }

      // Chapter title (possibly with number before it)
      if (chapterSettings.showChapterNumber && chapterSettings.chapterNumberPosition === 'before-title') {
        headerContent += `<h1 class="chapter-title"><span class="chapter-number-inline">${chapterNumberDisplay}.</span> ${this.escapeHtml(chapter.title)}</h1>`;
      } else {
        headerContent += `<h1 class="chapter-title">${this.escapeHtml(chapter.title)}</h1>`;
      }

      // Chapter number below title
      if (chapterSettings.showChapterNumber && chapterSettings.chapterNumberPosition === 'below-title') {
        headerContent += `
          <span class="chapter-number-label" style="margin-top: 0.5em;">${chapterSettings.chapterNumberLabel} ${chapterNumberDisplay}</span>`;
      }

      // Ornament below title
      if (chapterSettings.chapterOrnament !== 'none' && chapterSettings.chapterOrnamentPosition === 'below-title') {
        headerContent += `<div class="chapter-ornament"></div>`;
      }

      return `
      <article class="chapter" id="chapter-${chapter.number}">
        <header class="chapter-header">
          ${headerContent}
        </header>
        <div class="chapter-content">
          ${content}
        </div>
      </article>`;
    }).join('\n');
  }

  /**
   * Format chapter number based on style
   */
  private static formatChapterNumber(num: number, style: string): string {
    switch (style) {
      case 'roman':
        return this.toRoman(num);
      case 'word':
        return this.toWord(num);
      case 'ordinal':
        return this.toOrdinal(num);
      default:
        return String(num);
    }
  }

  /**
   * Process chapter content - convert to HTML with proper formatting
   */
  private static processChapterContent(
    content: string,
    chapter: { number: number; title: string },
    typoSettings: TypoSettings,
    _chapterSettings: ChapterSettings
  ): string {
    // Remove duplicate chapter titles from content
    const cleaned = this.sanitizeChapterContent(content, chapter);

    // Split into paragraphs
    const paragraphs = cleaned.split(/\n\n+/).filter(p => p.trim());

    return paragraphs.map((para, index) => {
      const trimmed = para.trim();

      // Check for scene breaks
      if (this.isSceneBreak(trimmed)) {
        return `<div class="scene-break"></div>`;
      }

      // First paragraph gets special treatment for drop caps
      if (index === 0 && typoSettings.dropCapEnabled) {
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
   * Generate back matter HTML based on settings
   */
  private static generateBackMatter(book: BookExport, settings: PublishingSettings): string {
    const backMatter = settings.backMatter;
    let html = '';

    // Bibliography
    if (backMatter.bibliography && book.bibliography?.config?.enabled && book.bibliography.references?.length > 0) {
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

    // About the Author
    if (backMatter.aboutAuthor) {
      html += `
      <section class="about-author break-before">
        <h1 style="font-size: 1.5em; margin-bottom: 1em;">About the Author</h1>
        <p style="text-indent: 0;">
          ${this.escapeHtml(book.author)} is the author of ${this.escapeHtml(book.title)}.
        </p>
      </section>`;
    }

    // Also By
    if (backMatter.alsoBy) {
      html += `
      <section class="also-by break-before">
        <h1 style="text-align: center; font-size: 1.5em; margin-bottom: 1em;">Also by ${this.escapeHtml(book.author)}</h1>
        <p style="text-align: center; font-style: italic; color: #666;">
          More titles coming soon...
        </p>
      </section>`;
    }

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
   * Sanitize chapter content - remove duplicate titles + AI artifacts
   */
  private static sanitizeChapterContent(
    content: string,
    chapter: { number: number; title: string }
  ): string {
    // First, apply the centralized sanitizer to remove AI artifacts
    let cleaned = sanitizeForExport(content.trim());

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
   * Convert number to ordinal
   */
  private static toOrdinal(num: number): string {
    const ordinals = [
      '', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth',
      'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth',
      'Eighteenth', 'Nineteenth', 'Twentieth'
    ];
    return num <= 20 ? ordinals[num] : String(num);
  }

  /**
   * Generate a preview HTML (without PDF conversion)
   */
  static generatePreviewHTML(book: BookExport): string {
    const layoutType = book.layoutType || 'novel-classic';
    const layout = BOOK_LAYOUTS[layoutType] || BOOK_LAYOUTS['novel-classic'];
    const settings = book.publishingSettings || DEFAULT_PUBLISHING_SETTINGS;
    return this.generateBookHTML(book, layout, settings);
  }
}
