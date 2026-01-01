// CSS Paged Media Generator for Professional Book Layouts
// Generates @page rules, running headers/footers, and print-quality CSS

import { LayoutConfig, BookLayoutType, BOOK_LAYOUTS } from '@/lib/types/book-layouts';

interface BookMetadata {
  title: string;
  author: string;
  chapters?: Array<{ number: number; title: string }>;
}

/**
 * Generate complete CSS Paged Media stylesheet for a book layout
 */
export function generatePagedMediaCSS(
  layout: LayoutConfig,
  metadata: BookMetadata,
  options?: {
    customCSS?: string;
    fontImports?: string[];
    colorScheme?: 'light' | 'sepia' | 'dark';
  }
): string {
  const {
    typography,
    page,
    columns,
    chapter,
    runningHeaders,
    pageNumbers,
    features,
  } = layout;

  const fontImports = options?.fontImports || generateFontImports(layout);
  
  return `
/* ==============================================
   CSS PAGED MEDIA STYLESHEET
   Layout: ${layout.name}
   Generated for: ${metadata.title} by ${metadata.author}
   ============================================== */

/* Font Imports */
${fontImports}

/* ==============================================
   CSS VARIABLES & ROOT
   ============================================== */
:root {
  --body-font: ${typography.bodyFontFamily};
  --heading-font: ${typography.headingFontFamily};
  --body-size: ${typography.bodyFontSize}pt;
  --line-height: ${typography.lineHeight};
  --text-color: #1a1a1a;
  --muted-color: #666;
  --accent-color: #8B4513;
  --column-gap: ${columns.gap}pt;
  
  /* Page dimensions */
  --page-width: ${extractDimension(page.size, 'width')};
  --page-height: ${extractDimension(page.size, 'height')};
  --margin-top: ${page.margins.top};
  --margin-bottom: ${page.margins.bottom};
  --margin-inside: ${page.margins.inside};
  --margin-outside: ${page.margins.outside};
}

/* ==============================================
   @PAGE RULES - Page Layout
   ============================================== */

/* Base page */
@page {
  size: ${page.size}${page.orientation === 'landscape' ? ' landscape' : ''};
  margin: ${page.margins.top} ${page.margins.outside} ${page.margins.bottom} ${page.margins.inside};
  
  ${page.bleed ? `
  /* Bleed marks for printing */
  marks: crop cross;
  bleed: ${page.bleed};
  ` : ''}
  
  ${generatePageFootnotes(features.footnotes)}
}

/* Left (verso) pages - even page numbers */
@page :left {
  margin-left: ${page.margins.outside};
  margin-right: ${page.margins.inside};
  
  ${runningHeaders.enabled ? `
  @top-left {
    content: ${getRunningHeaderContent(runningHeaders.leftPage.left, metadata)};
    font-family: var(--body-font);
    font-size: ${runningHeaders.fontSize}pt;
    ${getHeaderFontStyle(runningHeaders.fontStyle)}
    color: var(--muted-color);
    vertical-align: bottom;
    padding-bottom: 0.5em;
  }
  @top-center {
    content: ${getRunningHeaderContent(runningHeaders.leftPage.center, metadata)};
  }
  @top-right {
    content: ${getRunningHeaderContent(runningHeaders.leftPage.right, metadata)};
  }
  ` : ''}
  
  ${pageNumbers.enabled ? generatePageNumberCSS('left', pageNumbers) : ''}
}

/* Right (recto) pages - odd page numbers */
@page :right {
  margin-left: ${page.margins.inside};
  margin-right: ${page.margins.outside};
  
  ${runningHeaders.enabled ? `
  @top-left {
    content: ${getRunningHeaderContent(runningHeaders.rightPage.left, metadata)};
  }
  @top-center {
    content: ${getRunningHeaderContent(runningHeaders.rightPage.center, metadata)};
  }
  @top-right {
    content: ${getRunningHeaderContent(runningHeaders.rightPage.right, metadata)};
    font-family: var(--body-font);
    font-size: ${runningHeaders.fontSize}pt;
    ${getHeaderFontStyle(runningHeaders.fontStyle)}
    color: var(--muted-color);
    vertical-align: bottom;
    padding-bottom: 0.5em;
  }
  ` : ''}
  
  ${pageNumbers.enabled ? generatePageNumberCSS('right', pageNumbers) : ''}
}

/* First page of document */
@page :first {
  ${pageNumbers.firstPageHidden ? `
  @bottom-center { content: none; }
  @bottom-left { content: none; }
  @bottom-right { content: none; }
  ` : ''}
}

/* Blank pages */
@page :blank {
  @top-left { content: none; }
  @top-center { content: none; }
  @top-right { content: none; }
  @bottom-left { content: none; }
  @bottom-center { content: none; }
  @bottom-right { content: none; }
}

/* Chapter opening pages */
@page chapter-start {
  ${pageNumbers.firstPageHidden ? `
  @bottom-center { content: none; }
  ` : ''}
  @top-left { content: none; }
  @top-center { content: none; }
  @top-right { content: none; }
}

/* Front matter pages (title, copyright, etc.) */
@page front-matter {
  @top-left { content: none; }
  @top-center { content: none; }
  @top-right { content: none; }
  ${pageNumbers.style === 'roman-lower' || pageNumbers.style === 'roman-upper' ? `
  @bottom-center {
    content: counter(page, ${pageNumbers.style === 'roman-lower' ? 'lower-roman' : 'upper-roman'});
    font-family: var(--body-font);
    font-size: ${runningHeaders.fontSize}pt;
  }
  ` : ''}
}

/* ==============================================
   BASE TYPOGRAPHY
   ============================================== */

html {
  font-size: ${typography.bodyFontSize}pt;
}

body {
  font-family: var(--body-font);
  font-size: var(--body-size);
  line-height: var(--line-height);
  color: var(--text-color);
  text-align: ${typography.textAlign};
  ${typography.hyphenate ? `
  hyphens: auto;
  -webkit-hyphens: auto;
  ` : ''}
  orphans: 2;
  widows: 2;
}

/* Paragraphs */
p {
  margin: 0;
  text-indent: 1.5em;
}

p:first-of-type,
h1 + p,
h2 + p,
h3 + p,
.no-indent + p,
.scene-break + p {
  text-indent: 0;
}

${typography.dropCap ? generateDropCapCSS(typography) : ''}

/* ==============================================
   MULTI-COLUMN LAYOUT
   ============================================== */

${columns.count > 1 ? `
.chapter-content,
.main-content {
  column-count: ${columns.count};
  column-gap: var(--column-gap);
  column-fill: ${columns.balance ? 'balance' : 'auto'};
  column-rule: none;
}

/* Elements that span all columns */
${columns.spanElements.map(el => `
${el} {
  column-span: all;
}
`).join('\n')}

/* Prevent column breaks inside */
p, blockquote, figure, .entry, li {
  break-inside: avoid;
  page-break-inside: avoid;
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
  font-size: 2em;
  font-weight: normal;
  text-align: ${chapter.titleAlignment};
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
   CHAPTER STYLING
   ============================================== */

.chapter {
  page: chapter-start;
  ${chapter.startOnRecto ? `
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
  text-align: ${chapter.titleAlignment};
  padding-top: ${chapter.dropFromTop};
  margin-bottom: 2em;
}

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
  font-size: 1.8em;
  font-weight: normal;
  font-style: italic;
  margin: 0;
}

${chapter.ornament ? `
.chapter-ornament {
  text-align: center;
  font-size: 1.5em;
  color: var(--accent-color);
  margin: 1em 0;
}

.chapter-ornament::before {
  content: "${chapter.ornament}";
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
  content: "* * *";
  color: var(--muted-color);
  letter-spacing: 0.5em;
}

.scene-break.ornament::before {
  content: "❧";
  letter-spacing: normal;
}

.scene-break.blank {
  height: 2em;
}

.scene-break.blank::before {
  content: none;
}

/* ==============================================
   FRONT MATTER
   ============================================== */

.front-matter {
  page: front-matter;
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

/* Prince-specific TOC leader */
.toc-entry a::after {
  content: leader('.') target-counter(attr(href), page);
}

/* ==============================================
   SPECIAL ELEMENTS
   ============================================== */

${features.footnotes ? generateFootnoteCSS() : ''}

${features.marginNotes ? generateMarginNotesCSS() : ''}

${features.pullQuotes ? generatePullQuoteCSS() : ''}

${features.sidebars ? generateSidebarCSS() : ''}

${features.figures ? generateFigureCSS() : ''}

${features.tables ? generateTableCSS() : ''}

/* ==============================================
   DICTIONARY/REFERENCE SPECIFIC
   ============================================== */

${layout.id === 'dictionary' ? generateDictionaryCSS() : ''}

/* ==============================================
   BLOCKQUOTES & EPIGRAPHS
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
   LISTS
   ============================================== */

ul, ol {
  margin: 1em 0;
  padding-left: 2em;
}

li {
  margin-bottom: 0.3em;
}

/* ==============================================
   IMAGES
   ============================================== */

img {
  max-width: 100%;
  height: auto;
}

.full-bleed {
  width: calc(100% + ${page.margins.inside} + ${page.margins.outside});
  margin-left: calc(-1 * ${page.margins.inside});
  margin-right: calc(-1 * ${page.margins.outside});
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

${options?.customCSS || ''}
`;
}

// Helper functions

function extractDimension(size: string, dim: 'width' | 'height'): string {
  if (size === 'letter') return dim === 'width' ? '8.5in' : '11in';
  if (size === 'A4') return dim === 'width' ? '210mm' : '297mm';
  if (size === 'A5') return dim === 'width' ? '148mm' : '210mm';
  
  const parts = size.split(' ');
  return dim === 'width' ? parts[0] : parts[1] || parts[0];
}

function getRunningHeaderContent(content: string, metadata: BookMetadata): string {
  switch (content) {
    case 'title': return `"${metadata.title}"`;
    case 'author': return `"${metadata.author}"`;
    case 'chapter': return `string(chapter-title)`;
    case 'none': return 'none';
    default: return content.startsWith('"') ? content : `"${content}"`;
  }
}

function getHeaderFontStyle(style: string): string {
  switch (style) {
    case 'italic': return 'font-style: italic;';
    case 'small-caps': return 'font-variant: small-caps;';
    default: return '';
  }
}

function generatePageNumberCSS(page: 'left' | 'right', config: LayoutConfig['pageNumbers']): string {
  const position = config.position;
  const counterStyle = config.style === 'roman-lower' ? 'lower-roman' : 
                       config.style === 'roman-upper' ? 'upper-roman' : 'decimal';
  
  let cssPosition = '@bottom-center';
  if (position === 'bottom-outside') {
    cssPosition = page === 'left' ? '@bottom-left' : '@bottom-right';
  } else if (position === 'bottom-inside') {
    cssPosition = page === 'left' ? '@bottom-right' : '@bottom-left';
  } else if (position === 'top-outside') {
    cssPosition = page === 'left' ? '@top-left' : '@top-right';
  }
  
  return `
  ${cssPosition} {
    content: counter(page, ${counterStyle});
    font-family: var(--body-font);
    font-size: 10pt;
  }`;
}

function generateDropCapCSS(typography: LayoutConfig['typography']): string {
  return `
/* Drop Cap */
.chapter-content > p:first-of-type::first-letter,
.drop-cap::first-letter {
  float: left;
  font-family: ${typography.dropCapFont || typography.headingFontFamily};
  font-size: ${typography.dropCapLines * 1.15}em;
  line-height: 0.85;
  padding-right: 0.1em;
  margin-top: 0.05em;
  font-weight: normal;
  color: var(--text-color);
}
`;
}

function generatePageFootnotes(enabled: boolean): string {
  if (!enabled) return '';
  return `
  @footnote {
    float: bottom;
    border-top: 0.5pt solid var(--muted-color);
    padding-top: 0.5em;
    margin-top: 1em;
  }`;
}

function generateFootnoteCSS(): string {
  return `
/* Footnotes */
.footnote {
  float: footnote;
  font-size: 0.85em;
  line-height: 1.4;
}

.footnote::footnote-call {
  content: counter(footnote);
  font-size: 0.7em;
  vertical-align: super;
  line-height: none;
}

.footnote::footnote-marker {
  content: counter(footnote) ". ";
  font-size: 0.85em;
}

/* Endnote style alternative */
sup.footnote-ref {
  font-size: 0.75em;
  vertical-align: super;
}

sup.footnote-ref a {
  text-decoration: none;
  color: var(--accent-color);
}
`;
}

function generateMarginNotesCSS(): string {
  return `
/* Margin Notes / Sidenotes */
.margin-note {
  float: right;
  clear: right;
  width: 2in;
  margin-right: -2.5in;
  font-size: 0.8em;
  line-height: 1.3;
  color: var(--muted-color);
}

.margin-note-marker {
  font-size: 0.7em;
  vertical-align: super;
  color: var(--accent-color);
}
`;
}

function generatePullQuoteCSS(): string {
  return `
/* Pull Quotes */
.pull-quote {
  font-family: var(--heading-font);
  font-size: 1.4em;
  font-style: italic;
  text-align: center;
  padding: 1em 2em;
  margin: 1.5em 0;
  border-top: 2pt solid var(--accent-color);
  border-bottom: 2pt solid var(--accent-color);
  column-span: all;
}

.pull-quote cite {
  display: block;
  font-size: 0.7em;
  font-style: normal;
  margin-top: 0.5em;
  color: var(--muted-color);
}
`;
}

function generateSidebarCSS(): string {
  return `
/* Sidebars */
.sidebar {
  background: #f5f5f5;
  padding: 1em;
  margin: 1em 0;
  border-left: 3pt solid var(--accent-color);
  font-size: 0.9em;
}

.sidebar-title {
  font-family: var(--heading-font);
  font-weight: bold;
  margin-bottom: 0.5em;
}

.sidebar p {
  text-indent: 0;
  margin-bottom: 0.5em;
}
`;
}

function generateFigureCSS(): string {
  return `
/* Figures */
figure {
  margin: 1.5em 0;
  text-align: center;
  break-inside: avoid;
  page-break-inside: avoid;
}

figure img {
  max-width: 100%;
  height: auto;
}

figcaption {
  font-size: 0.9em;
  color: var(--muted-color);
  margin-top: 0.5em;
  text-align: center;
}

.figure-full {
  column-span: all;
  margin: 2em 0;
}
`;
}

function generateTableCSS(): string {
  return `
/* Tables */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
  font-size: 0.9em;
  break-inside: avoid;
  page-break-inside: avoid;
}

th, td {
  padding: 0.5em;
  text-align: left;
  border-bottom: 0.5pt solid var(--muted-color);
}

th {
  font-weight: bold;
  border-bottom: 1pt solid var(--text-color);
}

caption {
  font-style: italic;
  margin-bottom: 0.5em;
  text-align: left;
}

.table-full {
  column-span: all;
}
`;
}

function generateDictionaryCSS(): string {
  return `
/* Dictionary/Reference Entries */
.entry {
  margin-bottom: 0.5em;
  text-indent: 0;
}

.headword {
  font-weight: bold;
  font-size: 1.05em;
}

.pronunciation {
  font-style: italic;
  color: var(--muted-color);
}

.part-of-speech {
  font-style: italic;
  font-size: 0.9em;
  color: var(--muted-color);
}

.definition {
  margin-left: 0;
}

.definition-number {
  font-weight: bold;
  margin-right: 0.3em;
}

.example {
  font-style: italic;
  color: var(--muted-color);
}

.cross-reference {
  font-variant: small-caps;
}

/* Thumb index */
.thumb-index {
  position: fixed;
  right: -0.2in;
  font-weight: bold;
  font-size: 1.2em;
  width: 0.4in;
  text-align: center;
}

/* Section letter header */
.section-letter {
  font-family: var(--heading-font);
  font-size: 6em;
  float: left;
  line-height: 0.8;
  padding-right: 0.2em;
  margin-top: 0;
  color: var(--text-color);
}
`;
}

function generateFontImports(layout: LayoutConfig): string {
  // Extract font names from font stacks
  const fonts = new Set<string>();
  
  const bodyFont = layout.typography.bodyFontFamily.split(',')[0].replace(/['"]/g, '').trim();
  const headingFont = layout.typography.headingFontFamily.split(',')[0].replace(/['"]/g, '').trim();
  
  // Map common font names to Google Fonts imports
  const fontMap: Record<string, string> = {
    'EB Garamond': 'EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500',
    'Cormorant Garamond': 'Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500',
    'Source Serif Pro': 'Source+Serif+Pro:ital,wght@0,400;0,600;1,400;1,600',
    'Playfair Display': 'Playfair+Display:ital,wght@0,400;0,700;1,400;1,700',
    'Montserrat': 'Montserrat:wght@400;500;600;700',
    'Lato': 'Lato:ital,wght@0,400;0,700;1,400',
    'Lora': 'Lora:ital,wght@0,400;0,600;1,400;1,600',
    'Open Sans': 'Open+Sans:ital,wght@0,400;0,600;1,400',
    'Crimson Pro': 'Crimson+Pro:ital,wght@0,400;0,600;1,400;1,600',
  };
  
  const imports: string[] = [];
  
  if (fontMap[bodyFont]) {
    fonts.add(fontMap[bodyFont]);
  }
  if (fontMap[headingFont] && headingFont !== bodyFont) {
    fonts.add(fontMap[headingFont]);
  }
  
  if (fonts.size > 0) {
    const fontList = Array.from(fonts).join('&family=');
    imports.push(`@import url('https://fonts.googleapis.com/css2?family=${fontList}&display=swap');`);
  }
  
  return imports.join('\n');
}

/**
 * Export layout-specific CSS generator
 */
export function getLayoutCSS(layoutId: BookLayoutType, metadata: BookMetadata): string {
  const layout = BOOK_LAYOUTS[layoutId] || BOOK_LAYOUTS['novel-classic'];
  return generatePagedMediaCSS(layout, metadata);
}
















