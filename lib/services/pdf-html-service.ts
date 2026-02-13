// HTML-to-PDF Export Service using Puppeteer + Paged.js
// Generates professional book PDFs with full CSS Paged Media support
// Paged.js polyfills W3C Paged Media specs in the browser, giving us:
//   - Real running headers/footers via @page margin boxes
//   - Accurate TOC page numbers via target-counter()
//   - Proper page flow with named pages (cover, front-matter only)
//   - string(chapter-title, first-except) for automatic header suppression on chapter openers

import puppeteerCore, { Browser, Page, PDFOptions } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import * as path from 'path';
import * as fs from 'fs';
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
  bibliography?: any;
  publishingSettings?: PublishingSettings;
  layoutType?: BookLayoutType;
}

// Cache the Paged.js polyfill script content
let pagedJsScriptCache: string | null = null;

function getPagedJsScript(): string {
  if (pagedJsScriptCache) return pagedJsScriptCache;
  const candidates = [
    path.join(process.cwd(), 'node_modules', 'pagedjs', 'dist', 'paged.polyfill.js'),
    path.join(__dirname, '..', '..', 'node_modules', 'pagedjs', 'dist', 'paged.polyfill.js'),
    path.join(__dirname, '..', '..', '..', 'node_modules', 'pagedjs', 'dist', 'paged.polyfill.js'),
  ];
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        pagedJsScriptCache = fs.readFileSync(candidate, 'utf8');
        console.log('[PDF-HTML] Loaded Paged.js polyfill from:', candidate);
        return pagedJsScriptCache;
      }
    } catch { continue; }
  }
  throw new Error('[PDF-HTML] Could not find pagedjs polyfill. npm install pagedjs');
}

export class PDFHTMLService {
  private static browser: Browser | null = null;

  private static async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.connected) {
      console.log('[PDF-HTML] Launching browser...');

      // Detect TRUE serverless: must have env flag AND be on Linux (not macOS/Windows dev)
      const isServerless = (process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_NAME)
        && process.platform === 'linux';

      // Strategy 1: Try local `puppeteer` (bundles its own Chromium -- works on dev machines)
      if (!isServerless) {
        try {
          console.log('[PDF-HTML] Trying local puppeteer...');
          const puppeteer = await import('puppeteer');
          this.browser = await puppeteer.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none'],
          }) as unknown as Browser;
          console.log('[PDF-HTML] Browser launched via local puppeteer');
          return this.browser;
        } catch (localError) {
          console.warn('[PDF-HTML] Local puppeteer failed, trying system Chrome...', localError);
        }

        // Strategy 2: Try system Chrome/Chromium installations
        const possiblePaths = [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/usr/bin/google-chrome',
          '/usr/bin/chromium-browser',
          '/usr/bin/chromium',
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        ];
        for (const p of possiblePaths) {
          try {
            if (fs.existsSync(p)) {
              console.log('[PDF-HTML] Found system Chrome at:', p);
              this.browser = await puppeteerCore.launch({
                headless: true,
                executablePath: p,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none'],
              }) as Browser;
              console.log('[PDF-HTML] Browser launched via system Chrome');
              return this.browser;
            }
          } catch { continue; }
        }

        throw new Error('[PDF-HTML] Could not find Chrome/Chromium. Install puppeteer or Google Chrome.');
      }

      // Strategy 3: Serverless -- use @sparticuz/chromium (Linux only)
      console.log('[PDF-HTML] Running on serverless -- using @sparticuz/chromium');
      chromium.setGraphicsMode = false;
      const executablePath = await chromium.executablePath();
      this.browser = await puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: { width: 1920, height: 1080 },
        executablePath,
        headless: true,
      }) as Browser;
      console.log('[PDF-HTML] Browser launched via @sparticuz/chromium');
    }
    return this.browser;
  }

  static async closeBrowser(): Promise<void> {
    if (this.browser) { await this.browser.close(); this.browser = null; }
  }

  private static async fetchImageAsBase64(url: string): Promise<string | undefined> {
    if (!url) return undefined;
    if (url.startsWith('data:')) return url;
    try {
      const response = await fetch(url);
      if (!response.ok) return undefined;
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/png';
      return `data:${mimeType};base64,${base64}`;
    } catch { return undefined; }
  }

  // ============================================================
  // MAIN PDF GENERATION
  // ============================================================

  static async generateBookPDF(book: BookExport): Promise<Buffer> {
    console.log(`[PDF-HTML] Generating PDF for: ${book.title} (${book.chapters?.length || 0} chapters)`);

    // Pre-fetch cover images as base64
    let coverBase64: string | undefined;
    let backCoverBase64: string | undefined;
    if (book.coverUrl) coverBase64 = await this.fetchImageAsBase64(book.coverUrl);
    if (book.backCoverUrl) backCoverBase64 = await this.fetchImageAsBase64(book.backCoverUrl);

    const bookWithImages: BookExport = {
      ...book,
      coverUrl: coverBase64 || book.coverUrl,
      backCoverUrl: backCoverBase64 || book.backCoverUrl,
    };

    const browser = await this.getBrowser();
    let page: Page | null = null;

    try {
      page = await browser.newPage();
      const layoutType = book.layoutType || 'novel-classic';
      const layout = BOOK_LAYOUTS[layoutType] || BOOK_LAYOUTS['novel-classic'];
      const settings = book.publishingSettings || DEFAULT_PUBLISHING_SETTINGS;

      const html = this.generateBookHTML(bookWithImages, layout, settings);

      await page.setContent(html, { waitUntil: ['networkidle0', 'domcontentloaded'], timeout: 60000 });
      await page.evaluateHandle('document.fonts.ready');

      // Wait for images
      await page.evaluate(async () => {
        const images = Array.from(document.images);
        await Promise.all(images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 5000);
          });
        }));
      });
      await new Promise(resolve => setTimeout(resolve, 300));

      // Inject Paged.js
      console.log('[PDF-HTML] Injecting Paged.js...');
      await page.addScriptTag({ content: getPagedJsScript() });

      // Wait for pagination
      console.log('[PDF-HTML] Waiting for Paged.js pagination...');
      await page.evaluate(() => {
        return new Promise<void>((resolve) => {
          const el = document.documentElement;
          if (el.classList.contains('pagedjs_ready')) { resolve(); return; }
          const obs = new MutationObserver(() => {
            if (el.classList.contains('pagedjs_ready')) { obs.disconnect(); resolve(); }
          });
          obs.observe(el, { attributes: true, attributeFilter: ['class'] });
          setTimeout(() => { obs.disconnect(); resolve(); }, 120000);
        });
      });
      console.log('[PDF-HTML] Pagination complete');

      await new Promise(resolve => setTimeout(resolve, 500));
      await page.evaluateHandle('document.fonts.ready');

      const dims = this.getPageDimensions(layout, settings);
      const pdfOptions: PDFOptions = {
        format: undefined,
        width: dims.width,
        height: dims.height,
        printBackground: true,
        displayHeaderFooter: false,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        preferCSSPageSize: true,
        timeout: 120000,
      };

      const pdfBuffer = await page.pdf(pdfOptions);
      console.log(`[PDF-HTML] PDF generated: ${pdfBuffer.length} bytes`);
      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('[PDF-HTML] Error:', error);
      throw error;
    } finally {
      if (page) await page.close();
    }
  }

  private static getPageDimensions(layout: LayoutConfig, settings: PublishingSettings): { width: string; height: string } {
    if (settings?.trimSize) {
      const ts = TRIM_SIZES.find(t => t.id === settings.trimSize);
      if (ts) {
        const landscape = settings.orientation === 'landscape';
        return { width: `${landscape ? ts.height : ts.width}in`, height: `${landscape ? ts.width : ts.height}in` };
      }
    }
    const ps = layout.page.size;
    if (ps === 'letter') return { width: '8.5in', height: '11in' };
    if (ps === 'A4') return { width: '210mm', height: '297mm' };
    const parts = ps.split(' ');
    return { width: parts[0], height: parts[1] || parts[0] };
  }

  // ============================================================
  // HTML GENERATION
  // ============================================================

  private static generateBookHTML(book: BookExport, layout: LayoutConfig, settings: PublishingSettings): string {
    const requiredFonts = getRequiredFontsForSettings({
      bodyFont: settings.typography.bodyFont,
      headingFont: settings.typography.headingFont,
      dropCapFont: settings.typography.dropCapFont,
      headerFont: settings.headerFooter.headerFont,
      footerFont: settings.headerFooter.footerFont,
    });
    const fontLinks = getGoogleFontsLinkElement(requiredFonts);
    const fontImport = generateGoogleFontImport(requiredFonts);
    const css = this.generateBookCSS(layout, settings, { title: book.title, author: book.author });

    return `<!DOCTYPE html>
<html lang="${settings.language || 'en'}">
<head>
  <meta charset="UTF-8">
  <title>${this.escapeHtml(book.title)}</title>
  ${fontLinks}
  <style>
    ${fontImport}
    ${css}
  </style>
</head>
<body>
${this.generateCoverPage(book)}
<section class="front-matter">
${this.generateFrontMatter(book, settings)}
</section>
<section class="book-content">
${this.generateMainContent(book, settings)}
</section>
<section class="back-matter">
${this.generateBackMatter(book, settings)}
</section>
${this.generateBackCoverPage(book)}
</body>
</html>`;
  }

  // ============================================================
  // CSS GENERATION -- follows Paged.js patterns exactly
  //
  // Named pages used ONLY for cover + front-matter.
  // Chapters use the DEFAULT @page which has header/footer margin boxes.
  // string(chapter-title, first-except) auto-suppresses headers on
  // chapter opening pages without needing a named page transition.
  // ============================================================

  private static generateBookCSS(
    layout: LayoutConfig,
    settings: PublishingSettings,
    metadata: { title: string; author: string }
  ): string {
    const typo = settings.typography;
    const margins = settings.margins;
    const chapters = settings.chapters;

    // Migrate old header defaults: author+title → title+chapter (more professional)
    const hf = { ...settings.headerFooter };
    if (hf.headerLeftContent === 'author' && hf.headerRightContent === 'title') {
      hf.headerLeftContent = 'title';
      hf.headerRightContent = 'chapter';
    }

    const bodyFont = getFontFamily(typo.bodyFont);
    const headingFont = typo.headingFont === 'inherit' ? bodyFont : getFontFamily(typo.headingFont);
    const dropCapFont = typo.dropCapFont === 'inherit' ? headingFont : getFontFamily(typo.dropCapFont);
    const headerFont = hf.headerFont && hf.headerFont !== 'inherit' ? getFontFamily(hf.headerFont) : bodyFont;
    const footerFont = hf.footerFont && hf.footerFont !== 'inherit' ? getFontFamily(hf.footerFont) : bodyFont;

    const ts = TRIM_SIZES.find(t => t.id === settings.trimSize);
    const landscape = settings.orientation === 'landscape';
    const pw = ts ? (landscape ? ts.height : ts.width) : 5.5;
    const ph = ts ? (landscape ? ts.width : ts.height) : 8.5;

    const indent = typo.paragraphIndentUnit === 'em' ? `${typo.paragraphIndent}em`
      : typo.paragraphIndentUnit === 'px' ? `${typo.paragraphIndent}px`
      : `${typo.paragraphIndent}in`;

    const spacingMap: Record<string, string> = { 'none': '0', 'small': '0.25em', 'medium': '0.5em', 'large': '1em' };
    const paraSpacing = spacingMap[typo.paragraphSpacing] || '0';

    const sceneBreak = this.getSceneBreakSymbol(chapters.sceneBreakStyle, chapters.sceneBreakSymbol);
    const ornament = this.getChapterOrnamentSymbol(chapters.chapterOrnament);

    // Header style
    const hStyle = hf.headerStyle === 'italic' ? 'font-style: italic;'
      : hf.headerStyle === 'small-caps' ? 'font-variant: small-caps;'
      : hf.headerStyle === 'uppercase' ? 'text-transform: uppercase; letter-spacing: 0.05em;' : '';

    const pageCounter = hf.pageNumberStyle === 'roman-lower' ? 'lower-roman'
      : hf.pageNumberStyle === 'roman-upper' ? 'upper-roman' : 'decimal';

    const fmCounter = hf.frontMatterNumbering === 'none' ? '' : 'lower-roman';

    // Calculate margins with header/footer space included
    // Paged.js renders margin boxes (headers/footers) within the @page margin area,
    // so we need to increase margins to make room for them
    const marginTop = margins.top + (hf.headerEnabled ? (margins.headerSpace || 0.3) : 0);
    const marginBottom = margins.bottom + (hf.footerEnabled ? (margins.footerSpace || 0.3) : 0);

    // Resolve margin box content
    // For headers, use string() with first-except so ALL header content
    // (title, author, chapter) is automatically suppressed on chapter opening
    // pages (the page where the string-set element appears).
    const resolve = (c: string, forHeader = false): string => {
      switch (c) {
        case 'title': return forHeader
          ? 'string(running-title, first-except)'
          : `"${this.escapeHtml(metadata.title)}"`;
        case 'author': return forHeader
          ? 'string(running-author, first-except)'
          : `"${this.escapeHtml(metadata.author)}"`;
        case 'chapter': return forHeader ? 'string(chapter-title, first-except)' : 'string(chapter-title)';
        case 'page-number': return `counter(page, ${pageCounter})`;
        case 'custom': return '""';
        case 'none': default: return 'none';
      }
    };

    // Build margin boxes for a given page side
    const boxes = (side: 'left' | 'right'): string => {
      let out = '';
      // Determine content (with mirroring)
      const mirror = hf.mirrorHeaders && side === 'left';
      const hL = resolve(mirror ? hf.headerRightContent : hf.headerLeftContent, true);
      const hC = resolve(mirror ? hf.headerCenterContent : hf.headerCenterContent, true);
      const hR = resolve(mirror ? hf.headerLeftContent : hf.headerRightContent, true);
      const fL = resolve(mirror ? hf.footerRightContent : hf.footerLeftContent);
      const fC = resolve(mirror ? hf.footerCenterContent : hf.footerCenterContent);
      const fR = resolve(mirror ? hf.footerLeftContent : hf.footerRightContent);

      const hBorder = hf.headerLine ? 'border-bottom: 0.5pt solid #ccc;' : '';
      const fBorder = hf.footerLine ? 'border-top: 0.5pt solid #ccc;' : '';

      if (hf.headerEnabled) {
        // padding-bottom creates a clear gap between the running header and the body text
        if (hL !== 'none') out += `\n  @top-left { content: ${hL}; font-family: ${headerFont}; font-size: ${hf.headerFontSize}pt; ${hStyle} color: #555; vertical-align: bottom; padding-bottom: 0.2in; ${hBorder} }`;
        if (hC !== 'none') out += `\n  @top-center { content: ${hC}; font-family: ${headerFont}; font-size: ${hf.headerFontSize}pt; ${hStyle} color: #555; vertical-align: bottom; padding-bottom: 0.2in; ${hBorder} }`;
        if (hR !== 'none') out += `\n  @top-right { content: ${hR}; font-family: ${headerFont}; font-size: ${hf.headerFontSize}pt; ${hStyle} color: #555; vertical-align: bottom; padding-bottom: 0.2in; ${hBorder} }`;
      }
      if (hf.footerEnabled) {
        // padding-top creates a clear gap between the body text and the footer
        if (fL !== 'none') out += `\n  @bottom-left { content: ${fL}; font-family: ${footerFont}; font-size: ${hf.footerFontSize}pt; color: #555; vertical-align: top; padding-top: 0.12in; ${fBorder} }`;
        if (fC !== 'none') out += `\n  @bottom-center { content: ${fC}; font-family: ${footerFont}; font-size: ${hf.footerFontSize}pt; color: #555; vertical-align: top; padding-top: 0.12in; ${fBorder} }`;
        if (fR !== 'none') out += `\n  @bottom-right { content: ${fR}; font-family: ${footerFont}; font-size: ${hf.footerFontSize}pt; color: #555; vertical-align: top; padding-top: 0.12in; ${fBorder} }`;
      }
      return out;
    };

    // Only include crop marks + bleed when the export settings explicitly request them
    // (default is ebook quality with cropMarks: false, includeBleed: false)
    const pdfExport = settings.export?.pdf;
    const showCropMarks = pdfExport?.cropMarks === true && margins.bleed > 0;
    const showBleed = pdfExport?.includeBleed === true && margins.bleed > 0;

    return `
/* ====================== PAGE RULES ====================== */

@page {
  size: ${pw}in ${ph}in;
  margin: ${marginTop}in ${margins.outside}in ${marginBottom}in ${margins.inside}in;
  ${showCropMarks ? `marks: crop cross;` : ''}
  ${showBleed ? `bleed: ${margins.bleed}in;` : ''}
}

/* Default right (odd/recto) pages -- has headers + footers */
@page :right {
  margin-left: ${margins.inside}in;
  margin-right: ${margins.outside}in;
  ${boxes('right')}
}

/* Default left (even/verso) pages */
@page :left {
  margin-left: ${margins.outside}in;
  margin-right: ${margins.inside}in;
  ${boxes('left')}
}

/* BLANK pages (inserted by break-before: right) -- no headers/footers */
@page :blank {
  @top-left { content: none; }
  @top-center { content: none; }
  @top-right { content: none; }
  @bottom-left { content: none; }
  @bottom-center { content: none; }
  @bottom-right { content: none; }
}

/* COVER -- zero margins, no headers/footers, no marks */
@page coverPage {
  margin: 0;
  marks: none;
  @top-left { content: none; }
  @top-center { content: none; }
  @top-right { content: none; }
  @bottom-left { content: none; }
  @bottom-center { content: none; }
  @bottom-right { content: none; }
}

/* FRONT MATTER -- no headers, optional roman numerals in footer, no marks */
@page frontMatterPage {
  margin: ${marginTop}in ${margins.outside}in ${marginBottom}in ${margins.inside}in;
  marks: none;
  @top-left { content: none; }
  @top-center { content: none; }
  @top-right { content: none; }
  @bottom-left { content: none; }
  ${fmCounter && hf.footerEnabled
    ? `@bottom-center { content: counter(page, ${fmCounter}); font-family: ${footerFont}; font-size: ${hf.footerFontSize}pt; color: #555; }`
    : `@bottom-center { content: none; }`}
  @bottom-right { content: none; }
}

@page frontMatterPage:left {
  margin-left: ${margins.outside}in;
  margin-right: ${margins.inside}in;
}
@page frontMatterPage:right {
  margin-left: ${margins.inside}in;
  margin-right: ${margins.outside}in;
}

/* BLANK pages within front matter -- suppress all margin boxes */
@page frontMatterPage:blank {
  @top-left { content: none; }
  @top-center { content: none; }
  @top-right { content: none; }
  @bottom-left { content: none; }
  @bottom-center { content: none; }
  @bottom-right { content: none; }
}

/* ====================== BASE TYPOGRAPHY ====================== */

*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  padding: 0;
  font-family: ${bodyFont};
  font-size: ${typo.bodyFontSize}pt;
  line-height: ${typo.bodyLineHeight};
  color: #1a1a1a;
  text-align: ${typo.bodyAlignment};
  ${typo.bodyAlignment === 'justify' ? 'text-align-last: left;' : ''}
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  overflow-wrap: break-word;
  word-wrap: break-word;
  ${typo.hyphenation ? 'hyphens: auto; -webkit-hyphens: auto;' : ''}
  ${typo.orphanControl ? 'orphans: 2;' : ''}
  ${typo.widowControl ? 'widows: 2;' : ''}
}

p {
  margin: 0 0 ${paraSpacing} 0;
  text-indent: ${indent};
}

/* No indent on first paragraph after headings / scene breaks */
${!typo.firstParagraphIndent ? `
h1 + p, h2 + p, h3 + p,
.scene-break + p,
.chapter-header + .chapter-text > p:first-child {
  text-indent: 0;
}` : ''}

/* Drop caps */
${typo.dropCapEnabled ? `
.chapter-text > p:first-child::first-letter,
p.drop-cap::first-letter {
  float: left;
  font-family: ${dropCapFont};
  font-size: ${typo.dropCapLines * 1.2}em;
  line-height: 0.8;
  padding-right: 0.08em;
  margin-top: 0.02em;
  color: #1a1a1a;
}` : ''}

/* ====================== HEADINGS ====================== */

h1, h2, h3, h4, h5, h6 {
  font-family: ${headingFont};
  break-after: avoid;
  page-break-after: avoid;
}
h1 { font-size: ${typo.chapterTitleSize}pt; font-weight: normal; text-align: ${typo.headingAlignment}; margin-bottom: 0.8em; }
h2 { font-size: 1.4em; font-weight: 600; margin: 1.5em 0 0.4em; }
h3 { font-size: 1.15em; font-weight: 600; margin: 1em 0 0.3em; }

/* ====================== COVER PAGE ====================== */

.cover-wrapper {
  page: coverPage;
  overflow: hidden;
  break-after: avoid;
}

.cover-wrapper img {
  width: ${pw}in;
  height: ${ph}in;
  object-fit: cover;
  display: block;
}

.cover-wrapper.text-cover {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #2c3e50 0%, #1a252f 100%);
  color: white;
  text-align: center;
  width: ${pw}in;
  height: ${ph}in;
}

.cover-wrapper.text-cover .cover-title {
  font-family: ${headingFont};
  font-size: 2.8em;
  font-weight: normal;
  margin-bottom: 0.5em;
  letter-spacing: 0.05em;
}

.cover-wrapper.text-cover .cover-author {
  font-family: ${bodyFont};
  font-size: 1.4em;
  font-style: italic;
  opacity: 0.9;
}

.cover-wrapper.text-cover .cover-genre {
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-top: 2em;
  opacity: 0.7;
}

/* ====================== FRONT MATTER ====================== */

.front-matter {
  page: frontMatterPage;
  margin: 0;
  padding: 0;
}

/* First child inside front-matter: named page transition already creates a break,
   so suppress the child's own break-before to avoid a double/blank page */
.front-matter > *:first-child {
  break-before: auto !important;
}

/* Also suppress any break between cover and front-matter */
.cover-wrapper + .front-matter {
  break-before: auto;
}

.fm-half-title {
  text-align: center;
  text-align-last: center;
  padding-top: 35%;
  break-before: page;
}
.fm-half-title .book-title { font-size: 1.6em; }

.fm-title-page {
  text-align: center;
  text-align-last: center;
  padding-top: 1.2in;
  break-before: page;
}
.book-title { font-family: ${headingFont}; font-size: 2.2em; font-weight: normal; margin-bottom: 0.3em; letter-spacing: 0.04em; }
.book-author { font-family: ${bodyFont}; font-size: 1.2em; font-style: italic; margin-bottom: 1em; }
.book-genre { font-size: 0.9em; text-transform: uppercase; letter-spacing: 0.15em; color: #666; }
.book-publisher { font-size: 0.85em; text-transform: uppercase; letter-spacing: 0.15em; color: #666; }
.book-description { font-size: 0.78em; line-height: 1.45; font-style: italic; max-width: 80%; margin-left: auto; margin-right: auto; text-indent: 0; margin-top: 1em; max-height: 5.5em; overflow: hidden; }

.fm-copyright {
  font-size: 0.78em;
  line-height: 1.75;
  text-align: center;
  text-align-last: center;
  break-before: page;
  /* Position copyright content in the lower portion of the page.
     padding-top % is relative to content-area width (CSS spec).
     45% provides a balanced position across common trim sizes
     without risking overflow on smaller pages. */
  padding-top: 45%;
}
.fm-copyright p {
  text-indent: 0;
  margin-bottom: 0.35em;
  text-align: center;
  text-align-last: center;
}
.fm-copyright .copyright-title {
  font-weight: 600;
  font-size: 1.15em;
  margin-bottom: 0.25em;
  letter-spacing: 0.02em;
}
.fm-copyright .copyright-author {
  font-style: italic;
  margin-bottom: 0.2em;
}
.fm-copyright .copyright-spacer { display: block; height: 0.9em; }
.fm-copyright .copyright-legal {
  font-size: 0.92em;
  color: #555;
  max-width: 88%;
  margin-left: auto;
  margin-right: auto;
}
.fm-copyright .copyright-isbn {
  letter-spacing: 0.04em;
}
.fm-copyright .copyright-publisher {
  font-variant: small-caps;
  letter-spacing: 0.03em;
}
.fm-copyright .copyright-location {
  color: #777;
  font-size: 0.95em;
}
.fm-copyright .copyright-credit {
  font-size: 0.88em;
  font-style: italic;
  color: #999;
}

.fm-dedication {
  text-align: center;
  text-align-last: center;
  padding-top: 30%;
  font-style: italic;
  break-before: page;
}

.fm-toc {
  break-before: page;
}
.fm-toc h1 {
  text-align: center;
  font-size: 1.4em;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 2.5em;
}

/* ====================== TABLE OF CONTENTS ====================== */
/* Float-based overflow approach for reliable dot leaders (Paged.js recommended) */

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-item {
  margin-bottom: 0.75em;
  line-height: 1.7;
  break-inside: avoid;
  overflow: hidden; /* KEY: enables the dot-leader overflow trick */
}

.toc-item a {
  color: inherit;
  text-decoration: none;
  display: block;
}

/* Page number floated right -- white background covers dots behind it */
.toc-item a::after {
  content: target-counter(attr(href), page);
  float: right;
  font-variant-numeric: tabular-nums;
  background: white;
  padding-left: 6px;
  font-weight: normal;
  min-width: 1.5em;
  text-align: right;
}

/* Dot leaders via float overflow trick */
.toc-item a::before {
  float: right;
  width: 0;
  white-space: nowrap;
  content: " . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .";
  color: #999;
  font-size: 0.85em;
  letter-spacing: 0.15em;
}

.toc-label {
  font-size: 0.82em;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #666;
  margin-right: 0.6em;
}

.toc-title {
  font-style: italic;
}

/* ====================== CHAPTERS ====================== */
/* Chapters use the DEFAULT @page (which has header/footer margin boxes).
   string-set on .chapter-title feeds running headers.
   string(chapter-title, first-except) auto-blanks headers on chapter openers. */

.chapter-title {
  string-set: chapter-title content(text);
}

/* Running header strings: re-set on each chapter so first-except
   suppresses ALL header content on chapter opening pages */
.running-title { string-set: running-title content(text); }
.running-author { string-set: running-author content(text); }

/* Visually hidden but kept in document flow so string-set is processed */
.running-header-data {
  display: block;
  height: 0;
  overflow: hidden;
  font-size: 0;
  line-height: 0;
  margin: 0;
  padding: 0;
}

.chapter {
  break-before: page;
}

.chapter-header {
  text-align: ${chapters.chapterTitlePosition === 'centered' ? 'center' : chapters.chapterTitlePosition};
  padding-top: ${chapters.chapterDropFromTop}in;
  margin-bottom: ${chapters.afterChapterTitleSpace}in;
}

.chapter-number-label {
  font-family: ${bodyFont};
  font-size: 0.75em;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #666;
  display: block;
  margin-bottom: 0.3em;
}

.chapter-number {
  font-family: ${headingFont};
  font-size: 2.2em;
  display: block;
  margin-bottom: 0.2em;
}

.chapter-title {
  font-family: ${headingFont};
  font-size: ${typo.chapterTitleSize}pt;
  font-weight: normal;
  ${chapters.chapterTitleCase === 'uppercase' ? 'text-transform: uppercase;' : ''}
  ${chapters.chapterTitleCase === 'lowercase' ? 'text-transform: lowercase;' : ''}
}

${chapters.chapterOrnament !== 'none' ? `
.chapter-ornament {
  text-align: center;
  font-size: 1.4em;
  color: #8B4513;
  margin: 0.8em 0;
}
.chapter-ornament::before {
  content: "${ornament}";
}` : ''}

/* ====================== SCENE BREAKS ====================== */

.scene-break {
  text-align: center;
  margin: 1.8em 0;
  break-inside: avoid;
}
.scene-break::before {
  content: "${sceneBreak}";
  color: #666;
  letter-spacing: 0.4em;
}

/* ====================== MAIN CONTENT ====================== */

/* The named-page transition (frontMatterPage -> default) automatically creates
   a page break, so we do NOT add break-before here (that would create a blank page).
   We only reset the page counter to start Arabic numbering at 1. */
.book-content {
  counter-reset: page 1;
}

/* First chapter: suppress its own break-before since the named-page transition
   already created the break. */
.book-content > .chapter:first-child {
  break-before: auto;
}

/* ====================== BACK MATTER ====================== */

.back-matter { margin: 0; padding: 0; }
.bibliography { break-before: page; }
.bibliography-entry { text-indent: -1.5em; padding-left: 1.5em; margin-bottom: 0.4em; text-align-last: left; }
.about-author { break-before: page; text-align: center; text-align-last: center; padding-top: 25%; }
.also-by { break-before: page; padding-top: 15%; }

/* ====================== SPECIAL ELEMENTS ====================== */

blockquote { font-style: italic; margin: 1.2em 1.5em; }
blockquote p { text-indent: 0; }

img { max-width: 100%; height: auto; }

/* ====================== UTILITIES ====================== */

.break-before { break-before: page; }
.break-inside-avoid { break-inside: avoid; }

/* ====================== CUSTOM CSS ====================== */
${settings.customCSS || ''}
`;
  }

  // ============================================================
  // SYMBOL HELPERS
  // ============================================================

  private static getSceneBreakSymbol(style: string, customSymbol?: string): string {
    switch (style) {
      case 'blank-line': return '';
      case 'asterisks': return '* * *';
      case 'ornament': return '\\2766';
      case 'number': return '\\2022';
      case 'custom': return customSymbol || '* * *';
      default: return '* * *';
    }
  }

  private static getChapterOrnamentSymbol(ornament: string): string {
    switch (ornament) {
      case 'line': return '\\2501\\2501\\2501\\2501\\2501\\2501\\2501\\2501\\2501';
      case 'flourish': return '\\2767';
      case 'stars': return '\\2726 \\2726 \\2726';
      case 'dots': return '\\2022 \\2022 \\2022';
      default: return '';
    }
  }

  // ============================================================
  // HTML SECTION GENERATORS
  // ============================================================

  private static generateCoverPage(book: BookExport): string {
    if (!book.coverUrl) {
      return `
<section class="cover-wrapper text-cover">
  <div class="cover-title">${this.escapeHtml(book.title)}</div>
  <div class="cover-author">${this.escapeHtml(book.author)}</div>
  ${book.genre ? `<div class="cover-genre">${this.escapeHtml(book.genre)}</div>` : ''}
</section>`;
    }
    return `
<section class="cover-wrapper">
  <img src="${book.coverUrl}" alt="Cover" />
</section>`;
  }

  private static generateBackCoverPage(book: BookExport): string {
    if (!book.backCoverUrl) return '';
    return `
<section class="cover-wrapper">
  <img src="${book.backCoverUrl}" alt="Back Cover" />
</section>`;
  }

  private static generateFrontMatter(book: BookExport, settings: PublishingSettings): string {
    const fm = settings.frontMatter;
    const year = new Date().getFullYear();
    const novelLabel = isNovel(book.genre, settings?.bookType);
    let html = '';

    // Half-title: skip when a cover image is present (the cover already introduces the book,
    // so the half-title feels redundant in digital PDF output)
    if (fm.halfTitlePage && !book.coverUrl) {
      html += `<div class="fm-half-title"><h1 class="book-title">${this.escapeHtml(book.title)}</h1></div>`;
    }

    // Title page
    if (fm.titlePage) {
      const authorLine = novelLabel
        ? `<p style="font-size: 0.65em; letter-spacing: 0.15em; text-transform: uppercase; color: #666; margin-bottom: 0.3em;">A Novel By</p><p class="book-author">${this.escapeHtml(book.author)}</p>`
        : `<p class="book-author">by ${this.escapeHtml(book.author)}</p>`;
      html += `
<div class="fm-title-page">
  <h1 class="book-title">${this.escapeHtml(book.title)}</h1>
  ${authorLine}
  ${book.genre ? `<p class="book-genre">${this.escapeHtml(book.genre)}</p>` : ''}
  ${book.description ? `<p class="book-description">${this.escapeHtml(book.description.length > 300 ? book.description.slice(0, 297).trim() + '...' : book.description)}</p>` : ''}
  ${settings.publisher ? `<p class="book-publisher" style="margin-top: 2em;">${this.escapeHtml(settings.publisher)}</p>` : ''}
</div>`;
    }

    // Copyright
    if (fm.copyrightPage) {
      html += `
<div class="fm-copyright">
  <p class="copyright-title">${this.escapeHtml(book.title)}</p>
  <p class="copyright-author">by ${this.escapeHtml(book.author)}</p>
  <span class="copyright-spacer"></span>
  <p>Copyright &copy; ${year} ${this.escapeHtml(book.author)}</p>
  <p>All rights reserved.</p>
  <span class="copyright-spacer"></span>
  <p class="copyright-legal">No part of this publication may be reproduced, stored in a retrieval system, or transmitted in any form or by any means without the prior written permission of the copyright holder.</p>
  ${settings.isbn ? `<span class="copyright-spacer"></span><p class="copyright-isbn">ISBN: ${settings.isbn}</p>` : ''}
  <span class="copyright-spacer"></span>
  ${settings.publisher
    ? `<p class="copyright-publisher">Published by ${this.escapeHtml(settings.publisher)}</p>${settings.publisherLocation ? `<p class="copyright-location">${this.escapeHtml(settings.publisherLocation)}</p>` : ''}`
    : `<p class="copyright-publisher">Published by Dynamic Labs Media</p><p class="copyright-location">dlmworld.com</p>`}
  <span class="copyright-spacer"></span>
  <p class="copyright-credit">Created with PowerWrite</p>
</div>`;
    }

    // Dedication
    if (fm.dedicationPage) {
      html += `<div class="fm-dedication"><p>For those who believe in the power of words.</p></div>`;
    }

    // Table of Contents
    if (fm.tableOfContents) {
      const cs = settings.chapters;

      // Deduplicate chapters for TOC by number+title (keeps first occurrence)
      const seen = new Map<string, { ch: typeof book.chapters[0]; idx: number }>();
      book.chapters.forEach((ch, idx) => {
        const key = `${ch.number}-${ch.title}`;
        if (!seen.has(key)) seen.set(key, { ch, idx });
      });
      const tocEntries = Array.from(seen.values());

      html += `
<div class="fm-toc">
  <h1>Contents</h1>
  <ul class="toc-list">
    ${tocEntries.map(({ ch, idx }) => {
      const label = cs.showChapterNumber
        ? `<span class="toc-label">${cs.chapterNumberLabel} ${this.formatChapterNumber(ch.number, cs.chapterNumberStyle)}</span>`
        : '';
      return `<li class="toc-item"><a href="#chapter-idx-${idx}">${label}<span class="toc-title">${this.escapeHtml(ch.title)}</span></a></li>`;
    }).join('\n    ')}
    ${book.bibliography?.config?.enabled && book.bibliography.references?.length > 0
      ? `<li class="toc-item" style="margin-top: 0.8em;"><a href="#bibliography-section"><span class="toc-title">Bibliography</span></a></li>`
      : ''}
  </ul>
</div>`;
    }

    return html;
  }

  private static generateMainContent(book: BookExport, settings: PublishingSettings): string {
    const cs = settings.chapters;
    const typo = settings.typography;

    return book.chapters.map((chapter, index) => {
      const content = this.processChapterContent(chapter.content, chapter, typo, cs);

      let numDisplay = '';
      if (cs.showChapterNumber && cs.chapterNumberPosition !== 'hidden') {
        numDisplay = this.formatChapterNumber(chapter.number, cs.chapterNumberStyle);
      }

      let hdr = '';

      if (cs.chapterOrnament !== 'none' && cs.chapterOrnamentPosition === 'above-number') {
        hdr += '<div class="chapter-ornament"></div>';
      }
      if (cs.showChapterNumber && cs.chapterNumberPosition === 'above-title') {
        hdr += `<span class="chapter-number-label">${cs.chapterNumberLabel}</span><span class="chapter-number">${numDisplay}</span>`;
      }
      if (cs.chapterOrnament !== 'none' && cs.chapterOrnamentPosition === 'between-number-title') {
        hdr += '<div class="chapter-ornament"></div>';
      }
      if (cs.showChapterNumber && cs.chapterNumberPosition === 'before-title') {
        hdr += `<h1 class="chapter-title"><span>${numDisplay}.</span> ${this.escapeHtml(chapter.title)}</h1>`;
      } else {
        hdr += `<h1 class="chapter-title">${this.escapeHtml(chapter.title)}</h1>`;
      }
      if (cs.showChapterNumber && cs.chapterNumberPosition === 'below-title') {
        hdr += `<span class="chapter-number-label" style="margin-top: 0.4em;">${cs.chapterNumberLabel} ${numDisplay}</span>`;
      }
      if (cs.chapterOrnament !== 'none' && cs.chapterOrnamentPosition === 'below-title') {
        hdr += '<div class="chapter-ornament"></div>';
      }

      return `
<article class="chapter" id="chapter-idx-${index}">
  <span class="running-header-data running-title">${this.escapeHtml(book.title)}</span>
  <span class="running-header-data running-author">${this.escapeHtml(book.author)}</span>
  <header class="chapter-header">${hdr}</header>
  <div class="chapter-text">${content}</div>
</article>`;
    }).join('\n');
  }

  private static processChapterContent(content: string, chapter: { number: number; title: string }, typo: TypoSettings, _cs: ChapterSettings): string {
    const cleaned = this.sanitizeChapterContent(content, chapter);
    const paragraphs = cleaned.split(/\n\n+/).filter(p => p.trim());

    return paragraphs.map((para, i) => {
      const t = para.trim();
      if (this.isSceneBreak(t)) return '<div class="scene-break"></div>';
      if (i === 0 && typo.dropCapEnabled) return `<p class="drop-cap">${this.escapeHtml(t)}</p>`;
      if (t.startsWith('>')) return `<blockquote><p>${this.escapeHtml(t.replace(/^>\s*/gm, ''))}</p></blockquote>`;
      return `<p>${this.escapeHtml(t)}</p>`;
    }).join('\n');
  }

  private static generateBackMatter(book: BookExport, settings: PublishingSettings): string {
    const bm = settings.backMatter;
    let html = '';

    if (bm.bibliography && book.bibliography?.config?.enabled && book.bibliography.references?.length > 0) {
      const refs = book.bibliography.references;
      const cfg = book.bibliography.config;
      html += `
<div class="bibliography" id="bibliography-section">
  <h1 style="text-align: center; margin-bottom: 1.5em;">Bibliography</h1>
  ${refs.map((ref: unknown, i: number) => `<p class="bibliography-entry">${cfg.numberingStyle === 'numeric' ? `${i + 1}. ` : ''}${this.formatReference(ref)}</p>`).join('\n')}
  <p style="text-align: center; margin-top: 1.5em; font-style: italic; font-size: 0.85em; color: #888;">References formatted in ${cfg.citationStyle || 'APA'} style.</p>
</div>`;
    }

    if (bm.aboutAuthor) {
      html += `
<div class="about-author">
  <h1 style="font-size: 1.4em; margin-bottom: 0.8em;">About the Author</h1>
  <p style="text-indent: 0;">${this.escapeHtml(book.author)} is the author of ${this.escapeHtml(book.title)}.</p>
</div>`;
    }

    if (bm.alsoBy) {
      html += `
<div class="also-by">
  <h1 style="text-align: center; font-size: 1.4em; margin-bottom: 0.8em;">Also by ${this.escapeHtml(book.author)}</h1>
  <p style="text-align: center; font-style: italic; color: #666;">More titles coming soon...</p>
</div>`;
    }

    return html;
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static formatReference(ref: any): string {
    const parts: string[] = [];
    if (ref.authors && Array.isArray(ref.authors) && ref.authors.length > 0) {
      const names = ref.authors.map((a: unknown) => {
        if (typeof a === 'string') return a;
        if (typeof a === 'object' && a !== null) {
          const x = a as { firstName?: string; lastName?: string; organization?: string };
          if (x.organization) return x.organization;
          return [x.firstName, x.lastName].filter(Boolean).join(' ');
        }
        return '';
      }).filter(Boolean);
      if (names.length > 0) parts.push(names.join(', '));
    }
    if (ref.year) parts.push(`(${ref.year})`);
    if (ref.title) parts.push(`<em>${this.escapeHtml(String(ref.title))}</em>`);
    if (ref.publisher) parts.push(String(ref.publisher));
    if (ref.url) parts.push(`<a href="${ref.url}">${ref.url}</a>`);
    return parts.join('. ') + '.';
  }

  private static sanitizeChapterContent(content: string, chapter: { number: number; title: string }): string {
    let cleaned = sanitizeForExport(content.trim());
    const esc = chapter.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(`^Chapter\\s+${chapter.number}[:\\s-]+${esc}[\\s\\.,:;!?]*`, 'im'),
      new RegExp(`^Chapter\\s+${chapter.number}\\s*[-\\u2013\\u2014]\\s*${esc}[\\s\\.,:;!?]*`, 'im'),
      new RegExp(`^Chapter\\s+${chapter.number}\\s+${esc}[\\s\\.,:;!?]*`, 'im'),
      new RegExp(`^Chapter\\s+${chapter.number}[:\\s-]*[\\s\\.,:;!?]*`, 'im'),
      new RegExp(`^${esc}[\\s\\.,:;!?]*`, 'im'),
    ];
    for (const p of patterns) { cleaned = cleaned.replace(p, '').trim(); }
    return cleaned.replace(/\n{3,}/g, '\n\n');
  }

  private static formatChapterNumber(num: number, style: string): string {
    switch (style) {
      case 'roman': return this.toRoman(num);
      case 'word': return this.toWord(num);
      case 'ordinal': return this.toOrdinal(num);
      default: return String(num);
    }
  }

  private static isSceneBreak(text: string): boolean {
    const t = text.trim();
    return t === '***' || t === '* * *' || t === '---' || t === '- - -' ||
      t === '\u2767' || t === '\u2022 \u2022 \u2022' ||
      (t.length <= 5 && /^[*\-\u2022]+$/.test(t.replace(/\s/g, '')));
  }

  private static escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  private static toRoman(num: number): string {
    const map: [number, string][] = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
    let r = '';
    for (const [v, s] of map) { while (num >= v) { r += s; num -= v; } }
    return r;
  }

  private static toWord(num: number): string {
    const w = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen','Twenty','Twenty-One','Twenty-Two','Twenty-Three','Twenty-Four','Twenty-Five','Twenty-Six','Twenty-Seven','Twenty-Eight','Twenty-Nine','Thirty'];
    return num <= 30 ? w[num] : String(num);
  }

  private static toOrdinal(num: number): string {
    const o = ['','First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth','Eleventh','Twelfth','Thirteenth','Fourteenth','Fifteenth','Sixteenth','Seventeenth','Eighteenth','Nineteenth','Twentieth'];
    return num <= 20 ? o[num] : String(num);
  }

  static generatePreviewHTML(book: BookExport): string {
    const layout = BOOK_LAYOUTS[book.layoutType || 'novel-classic'] || BOOK_LAYOUTS['novel-classic'];
    return this.generateBookHTML(book, layout, book.publishingSettings || DEFAULT_PUBLISHING_SETTINGS);
  }
}
