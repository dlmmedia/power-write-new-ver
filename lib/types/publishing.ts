// Comprehensive Publishing Settings Types
// Professional book formatting options for all export formats

import { BookLayoutType } from './book-layouts';

// =============================================
// BOOK TYPE & CATEGORY
// =============================================
export type BookType =
  | 'novel'                    // Standard fiction novel
  | 'novella'                  // Shorter fiction (17,500-40,000 words)
  | 'short-story-collection'   // Anthology of short stories
  | 'picture-book'             // Children's illustrated book
  | 'storybook'                // Children's chapter book
  | 'young-adult'              // YA fiction
  | 'middle-grade'             // Middle grade fiction
  | 'textbook'                 // Educational/academic
  | 'workbook'                 // Interactive exercises
  | 'cookbook'                 // Recipe book
  | 'coffee-table-book'        // Large format visual book
  | 'art-book'                 // Photography/art collection
  | 'memoir'                   // Personal memoir
  | 'biography'                // Biography
  | 'self-help'                // Self-improvement
  | 'business'                 // Business/professional
  | 'technical'                // Technical manual
  | 'poetry'                   // Poetry collection
  | 'graphic-novel'            // Illustrated narrative
  | 'journal'                  // Blank/guided journal
  | 'devotional'               // Religious/spiritual
  | 'travel-guide'             // Travel book
  | 'magazine'                 // Magazine format
  | 'academic'                 // Academic paper/thesis
  | 'custom';                  // Custom format

// =============================================
// TRIM SIZE / PAGE SIZE
// =============================================
export interface TrimSize {
  id: string;
  name: string;
  width: number;  // in inches
  height: number; // in inches
  category: 'paperback' | 'hardcover' | 'children' | 'large-format' | 'standard' | 'custom';
  description?: string;
  bestFor?: string[];
  industry?: 'kdp' | 'ingram' | 'lulu' | 'universal';
}

export const TRIM_SIZES: TrimSize[] = [
  // Mass Market & Pocket
  { id: 'mass-market', name: 'Mass Market Paperback', width: 4.25, height: 6.87, category: 'paperback', description: 'Standard pocket-sized paperback', bestFor: ['romance', 'thriller', 'mystery'], industry: 'universal' },
  { id: 'pocket', name: 'Pocket Book', width: 4.37, height: 7, category: 'paperback', description: 'Compact portable size', bestFor: ['fiction', 'travel'], industry: 'universal' },
  
  // Trade Paperback
  { id: 'trade-5x8', name: 'Trade Paperback (5x8)', width: 5, height: 8, category: 'paperback', description: 'Classic trade paperback', bestFor: ['fiction', 'memoir', 'literary'], industry: 'kdp' },
  { id: 'trade-5.25x8', name: 'Trade Paperback (5.25x8)', width: 5.25, height: 8, category: 'paperback', description: 'Slightly wider trade format', bestFor: ['fiction', 'non-fiction'], industry: 'kdp' },
  { id: 'trade-5.5x8.5', name: 'Trade Paperback (5.5x8.5)', width: 5.5, height: 8.5, category: 'paperback', description: 'Standard trade paperback', bestFor: ['fiction', 'non-fiction', 'self-help'], industry: 'kdp' },
  { id: 'digest', name: 'Digest', width: 5.5, height: 8.25, category: 'paperback', description: 'Popular digest size', bestFor: ['ya', 'self-help', 'business'], industry: 'universal' },
  
  // Standard Non-Fiction
  { id: 'us-trade-6x9', name: 'US Trade (6x9)', width: 6, height: 9, category: 'paperback', description: 'Most popular non-fiction size', bestFor: ['non-fiction', 'business', 'self-help', 'technical'], industry: 'kdp' },
  { id: 'royal-6.14x9.21', name: 'Royal', width: 6.14, height: 9.21, category: 'paperback', description: 'Elegant trade format', bestFor: ['literary', 'memoir', 'biography'], industry: 'ingram' },
  
  // Young Adult & Children
  { id: 'ya-5.5x8.25', name: 'Young Adult', width: 5.5, height: 8.25, category: 'paperback', description: 'Standard YA format', bestFor: ['young-adult'], industry: 'universal' },
  { id: 'children-square-8.5', name: "Children's Square (8.5x8.5)", width: 8.5, height: 8.5, category: 'children', description: 'Square picture book', bestFor: ['picture-book', 'storybook'], industry: 'kdp' },
  { id: 'children-landscape-11x8.5', name: "Children's Landscape", width: 11, height: 8.5, category: 'children', description: 'Landscape picture book', bestFor: ['picture-book'], industry: 'kdp' },
  { id: 'children-portrait-8.5x11', name: "Children's Portrait", width: 8.5, height: 11, category: 'children', description: 'Portrait picture book', bestFor: ['picture-book', 'coloring'], industry: 'kdp' },
  { id: 'middle-grade', name: 'Middle Grade', width: 5.25, height: 7.5, category: 'paperback', description: 'Standard middle grade size', bestFor: ['middle-grade', 'storybook'], industry: 'universal' },
  
  // Large Format
  { id: 'coffee-table-11x8.5', name: 'Coffee Table Landscape', width: 11, height: 8.5, category: 'large-format', description: 'Large landscape format', bestFor: ['art-book', 'photography', 'coffee-table-book'], industry: 'kdp' },
  { id: 'coffee-table-12x12', name: 'Coffee Table Square', width: 12, height: 12, category: 'large-format', description: 'Large square format', bestFor: ['art-book', 'photography'], industry: 'lulu' },
  { id: 'photo-10x8', name: 'Photo Book (10x8)', width: 10, height: 8, category: 'large-format', description: 'Landscape photo book', bestFor: ['photography', 'art-book'], industry: 'universal' },
  
  // Standard Paper Sizes
  { id: 'us-letter', name: 'US Letter', width: 8.5, height: 11, category: 'standard', description: 'Standard US letter size', bestFor: ['textbook', 'workbook', 'technical', 'academic'], industry: 'universal' },
  { id: 'a4', name: 'A4', width: 8.27, height: 11.69, category: 'standard', description: 'International A4 standard', bestFor: ['textbook', 'technical', 'academic'], industry: 'universal' },
  { id: 'a5', name: 'A5', width: 5.83, height: 8.27, category: 'standard', description: 'Compact A5 format', bestFor: ['journal', 'planner', 'devotional'], industry: 'universal' },
  
  // Hardcover Specific
  { id: 'hardcover-6x9', name: 'Hardcover (6x9)', width: 6, height: 9, category: 'hardcover', description: 'Standard hardcover', bestFor: ['literary', 'non-fiction', 'biography'], industry: 'ingram' },
  { id: 'hardcover-6.5x9.5', name: 'Hardcover (6.5x9.5)', width: 6.5, height: 9.5, category: 'hardcover', description: 'Premium hardcover', bestFor: ['literary', 'gift-book'], industry: 'ingram' },
  { id: 'hardcover-7x10', name: 'Hardcover (7x10)', width: 7, height: 10, category: 'hardcover', description: 'Large hardcover', bestFor: ['coffee-table-book', 'art-book'], industry: 'ingram' },
];

// =============================================
// TYPOGRAPHY SETTINGS
// =============================================
export interface TypographySettings {
  // Body Text
  bodyFont: string;
  bodyFontSize: number;          // in points (pt)
  bodyLineHeight: number;        // multiplier (e.g., 1.5)
  
  // Headings
  headingFont: string;
  chapterTitleSize: number;      // in points
  chapterSubtitleSize: number;
  sectionHeadingSize: number;
  
  // Special Elements
  dropCapEnabled: boolean;
  dropCapLines: number;          // How many lines the drop cap spans
  dropCapFont: string;
  
  // Paragraph Settings
  paragraphIndent: number;       // in inches or em
  paragraphIndentUnit: 'inches' | 'em' | 'px';
  paragraphSpacing: 'none' | 'small' | 'medium' | 'large';
  firstParagraphIndent: boolean; // Indent first paragraph after heading?
  
  // Text Alignment
  bodyAlignment: 'left' | 'justify' | 'right' | 'center';
  headingAlignment: 'left' | 'center' | 'right';
  
  // Hyphenation
  hyphenation: boolean;
  
  // Widows & Orphans
  widowControl: boolean;         // Prevent single lines at page top
  orphanControl: boolean;        // Prevent single lines at page bottom
}

// Professional font presets for publishing
export const BODY_FONTS = [
  { id: 'garamond', name: 'Garamond', category: 'serif', description: 'Classic, elegant, highly readable' },
  { id: 'georgia', name: 'Georgia', category: 'serif', description: 'Web-safe, warm appearance' },
  { id: 'times-new-roman', name: 'Times New Roman', category: 'serif', description: 'Traditional, professional' },
  { id: 'palatino', name: 'Palatino', category: 'serif', description: 'Calligraphic elegance' },
  { id: 'baskerville', name: 'Baskerville', category: 'serif', description: 'Transitional, refined' },
  { id: 'caslon', name: 'Adobe Caslon Pro', category: 'serif', description: 'Old-style, highly legible' },
  { id: 'minion', name: 'Minion Pro', category: 'serif', description: 'Modern, versatile' },
  { id: 'sabon', name: 'Sabon', category: 'serif', description: 'Based on Garamond, crisp' },
  { id: 'bembo', name: 'Bembo', category: 'serif', description: 'Renaissance, scholarly' },
  { id: 'libre-baskerville', name: 'Libre Baskerville', category: 'serif', description: 'Free, web-optimized' },
  { id: 'merriweather', name: 'Merriweather', category: 'serif', description: 'Designed for screens' },
  { id: 'source-serif', name: 'Source Serif Pro', category: 'serif', description: 'Adobe, clean modern' },
  { id: 'lora', name: 'Lora', category: 'serif', description: 'Well-balanced, contemporary' },
  // Sans-serif options for modern looks
  { id: 'helvetica', name: 'Helvetica', category: 'sans-serif', description: 'Clean, modern, Swiss' },
  { id: 'arial', name: 'Arial', category: 'sans-serif', description: 'Universal, neutral' },
  { id: 'open-sans', name: 'Open Sans', category: 'sans-serif', description: 'Friendly, readable' },
  { id: 'roboto', name: 'Roboto', category: 'sans-serif', description: 'Google, modern' },
  { id: 'lato', name: 'Lato', category: 'sans-serif', description: 'Warm, serious' },
  { id: 'montserrat', name: 'Montserrat', category: 'sans-serif', description: 'Geometric, stylish' },
  // Display/Specialty
  { id: 'playfair', name: 'Playfair Display', category: 'display', description: 'High contrast, stylish' },
  { id: 'cormorant', name: 'Cormorant Garamond', category: 'display', description: 'Display Garamond' },
];

export const HEADING_FONTS = [
  { id: 'inherit', name: 'Same as Body', category: 'inherit' },
  ...BODY_FONTS.filter(f => f.category !== 'display'),
  { id: 'playfair', name: 'Playfair Display', category: 'display' },
  { id: 'cormorant', name: 'Cormorant Garamond', category: 'display' },
  { id: 'cinzel', name: 'Cinzel', category: 'display', description: 'Roman inscriptional' },
  { id: 'philosopher', name: 'Philosopher', category: 'display', description: 'Russian academia' },
  { id: 'spectral', name: 'Spectral', category: 'display', description: 'Designed for screens' },
];

// =============================================
// MARGIN SETTINGS
// =============================================
export interface MarginSettings {
  // Individual margins in inches
  top: number;
  bottom: number;
  inside: number;    // Gutter margin (binding side)
  outside: number;   // Outer margin
  
  // Mirror margins for book binding
  mirrorMargins: boolean;
  
  // Bleed (for print)
  bleed: number;     // in inches (typically 0.125" for print)
  
  // Running headers/footers space
  headerSpace: number;
  footerSpace: number;
}

export const MARGIN_PRESETS: Record<string, MarginSettings> = {
  'tight': { top: 0.5, bottom: 0.5, inside: 0.625, outside: 0.5, mirrorMargins: true, bleed: 0.125, headerSpace: 0.25, footerSpace: 0.25 },
  'normal': { top: 0.75, bottom: 0.75, inside: 0.875, outside: 0.75, mirrorMargins: true, bleed: 0.125, headerSpace: 0.3, footerSpace: 0.3 },
  'comfortable': { top: 1, bottom: 1, inside: 1, outside: 1, mirrorMargins: true, bleed: 0.125, headerSpace: 0.35, footerSpace: 0.35 },
  'wide': { top: 1.25, bottom: 1.25, inside: 1.25, outside: 1.25, mirrorMargins: true, bleed: 0.125, headerSpace: 0.4, footerSpace: 0.4 },
  'academic': { top: 1, bottom: 1, inside: 1.5, outside: 1, mirrorMargins: true, bleed: 0, headerSpace: 0.5, footerSpace: 0.5 },
  'picture-book': { top: 0.5, bottom: 0.5, inside: 0.5, outside: 0.5, mirrorMargins: false, bleed: 0.25, headerSpace: 0, footerSpace: 0 },
};

// =============================================
// CHAPTER & SECTION STYLING
// =============================================
export interface ChapterSettings {
  // Chapter Opening
  startOnOddPage: boolean;        // Traditional: chapters start on right/odd page
  chapterOpeningStyle: 'simple' | 'decorated' | 'illustrated' | 'full-page' | 'minimal';
  
  // Chapter Number
  showChapterNumber: boolean;
  chapterNumberStyle: 'numeric' | 'roman' | 'word' | 'ordinal';  // 1, I, One, First
  chapterNumberPosition: 'above-title' | 'before-title' | 'below-title' | 'hidden';
  chapterNumberLabel: string;     // "Chapter", "Part", etc.
  
  // Chapter Title
  chapterTitlePosition: 'centered' | 'left' | 'right';
  chapterTitleCase: 'title-case' | 'uppercase' | 'lowercase' | 'as-written';
  
  // Vertical Spacing
  chapterDropFromTop: number;     // Space from top of page to chapter opening (inches)
  afterChapterTitleSpace: number; // Space after title before content (inches)
  
  // Ornaments
  chapterOrnament: 'none' | 'line' | 'flourish' | 'stars' | 'dots' | 'custom';
  chapterOrnamentPosition: 'above-number' | 'between-number-title' | 'below-title';
  
  // Scene Breaks
  sceneBreakStyle: 'blank-line' | 'asterisks' | 'ornament' | 'number' | 'custom';
  sceneBreakSymbol: string;       // Custom scene break symbol (e.g., "* * *", "—", "❧")
}

// =============================================
// HEADERS & FOOTERS
// =============================================
export interface HeaderFooterSettings {
  // Header Content
  headerEnabled: boolean;
  headerLeftContent: 'none' | 'title' | 'author' | 'chapter' | 'page-number' | 'custom';
  headerCenterContent: 'none' | 'title' | 'author' | 'chapter' | 'page-number' | 'custom';
  headerRightContent: 'none' | 'title' | 'author' | 'chapter' | 'page-number' | 'custom';
  headerCustomText?: { left?: string; center?: string; right?: string };
  
  // Header Styling
  headerFontSize: number;
  headerFont: string;
  headerStyle: 'normal' | 'italic' | 'small-caps' | 'uppercase';
  headerLine: boolean;            // Line under header
  
  // Footer Content
  footerEnabled: boolean;
  footerLeftContent: 'none' | 'title' | 'author' | 'chapter' | 'page-number' | 'custom';
  footerCenterContent: 'none' | 'title' | 'author' | 'chapter' | 'page-number' | 'custom';
  footerRightContent: 'none' | 'title' | 'author' | 'chapter' | 'page-number' | 'custom';
  footerCustomText?: { left?: string; center?: string; right?: string };
  
  // Footer Styling
  footerFontSize: number;
  footerFont: string;
  footerLine: boolean;            // Line above footer
  
  // Page Number Settings
  pageNumberStyle: 'arabic' | 'roman-lower' | 'roman-upper' | 'none';
  firstPageNumberVisible: boolean; // Show page number on first page of chapter?
  frontMatterNumbering: 'roman-lower' | 'none';  // Usually roman numerals for front matter
  
  // Different headers for odd/even pages
  mirrorHeaders: boolean;
}

// =============================================
// FRONT & BACK MATTER
// =============================================
export interface FrontMatterSettings {
  // Order of front matter (drag to reorder)
  order: FrontMatterSection[];
  
  // Individual section settings
  halfTitlePage: boolean;
  titlePage: boolean;
  copyrightPage: boolean;
  dedicationPage: boolean;
  epigraph?: string;
  tableOfContents: boolean;
  tocDepth: number;              // 1 = chapters only, 2 = chapters + sections
  foreword: boolean;
  preface: boolean;
  acknowledgments: boolean;
  introduction: boolean;
}

export type FrontMatterSection = 
  | 'half-title'
  | 'title-page'
  | 'copyright'
  | 'dedication'
  | 'epigraph'
  | 'table-of-contents'
  | 'foreword'
  | 'preface'
  | 'acknowledgments'
  | 'introduction';

export interface BackMatterSettings {
  order: BackMatterSection[];
  
  epilogue: boolean;
  afterword: boolean;
  appendices: boolean;
  glossary: boolean;
  bibliography: boolean;
  index: boolean;
  aboutAuthor: boolean;
  alsoBy: boolean;              // "Also by this author"
  bookClubQuestions: boolean;
  excerpt: boolean;             // Preview of next book
}

export type BackMatterSection =
  | 'epilogue'
  | 'afterword'
  | 'appendices'
  | 'glossary'
  | 'bibliography'
  | 'index'
  | 'about-author'
  | 'also-by'
  | 'book-club-questions'
  | 'excerpt';

// =============================================
// PLATFORM-SPECIFIC EXPORT SETTINGS
// =============================================
export interface ExportSettings {
  // PDF Settings
  pdf: {
    quality: 'screen' | 'ebook' | 'print' | 'press';
    embedFonts: boolean;
    colorProfile: 'rgb' | 'cmyk' | 'grayscale';
    compression: 'none' | 'low' | 'medium' | 'high';
    pdfVersion: '1.4' | '1.5' | '1.6' | '1.7' | '2.0';
    includeBleed: boolean;
    cropMarks: boolean;
    hyperlinks: boolean;
  };
  
  // EPUB Settings
  epub: {
    version: 'epub2' | 'epub3';
    layout: 'reflowable' | 'fixed';
    tocType: 'ncx' | 'nav' | 'both';
    coverInSpine: boolean;
    embedFonts: boolean;
    generateCSS: boolean;
  };
  
  // DOCX Settings
  docx: {
    compatibility: 'word2007' | 'word2010' | 'word2013' | 'word2016' | 'word365';
    embedFonts: boolean;
    trackChanges: boolean;
  };
  
  // HTML Settings
  html: {
    singleFile: boolean;
    includeCSS: 'inline' | 'external' | 'none';
    responsive: boolean;
    darkModeSupport: boolean;
  };
  
  // Kindle/KDP Settings
  kindle: {
    enhancedTypesetting: boolean;
    xrayEnabled: boolean;
    textToSpeechEnabled: boolean;
    lendingEnabled: boolean;
    primaryMarketplace: 'amazon.com' | 'amazon.co.uk' | 'amazon.de' | 'amazon.fr' | 'amazon.co.jp';
  };
}

// =============================================
// MAIN PUBLISHING SETTINGS INTERFACE
// =============================================
export interface PublishingSettings {
  // Publishing preset selection (for UI + tracking)
  publishingPresetId?: string;

  // Book Type
  bookType: BookType;
  
  // Book Layout (for PDF export)
  layoutType?: BookLayoutType;    // Layout template for PDF export
  
  // Page Size
  trimSize: string;              // ID from TRIM_SIZES
  customTrimSize?: { width: number; height: number };
  orientation: 'portrait' | 'landscape';
  
  // Typography
  typography: TypographySettings;
  
  // Margins
  margins: MarginSettings;
  marginPreset: string;          // 'tight', 'normal', 'wide', 'custom'
  
  // Chapters
  chapters: ChapterSettings;
  
  // Headers & Footers
  headerFooter: HeaderFooterSettings;
  
  // Front Matter
  frontMatter: FrontMatterSettings;
  
  // Back Matter
  backMatter: BackMatterSettings;
  
  // Export Settings
  export: ExportSettings;
  
  // Theme/Style Preset
  stylePreset: 'classic' | 'modern' | 'minimal' | 'elegant' | 'bold' | 'academic' | 'childrens' | 'custom';
  
  // Custom CSS (for advanced users)
  customCSS?: string;
  
  // Metadata
  language: string;
  isbn?: string;
  publisher?: string;
  publisherLocation?: string;
  edition?: string;
  printingNumber?: number;
}

// =============================================
// DEFAULT PUBLISHING SETTINGS
// =============================================
export const DEFAULT_PUBLISHING_SETTINGS: PublishingSettings = {
  publishingPresetId: 'a5-default',
  bookType: 'novel',
  layoutType: 'novel-classic',
  trimSize: 'a5',
  orientation: 'portrait',
  
  typography: {
    bodyFont: 'georgia',
    bodyFontSize: 11,
    bodyLineHeight: 1.45,
    headingFont: 'inherit',
    chapterTitleSize: 20,
    chapterSubtitleSize: 14,
    sectionHeadingSize: 16,
    dropCapEnabled: false,
    dropCapLines: 3,
    dropCapFont: 'inherit',
    paragraphIndent: 0.25,
    paragraphIndentUnit: 'inches',
    paragraphSpacing: 'none',
    firstParagraphIndent: false,
    bodyAlignment: 'justify',
    headingAlignment: 'center',
    hyphenation: true,
    widowControl: true,
    orphanControl: true,
  },
  
  margins: MARGIN_PRESETS['normal'],
  marginPreset: 'normal',
  
  chapters: {
    startOnOddPage: true,
    chapterOpeningStyle: 'simple',
    showChapterNumber: true,
    chapterNumberStyle: 'numeric',
    chapterNumberPosition: 'above-title',
    chapterNumberLabel: 'Chapter',
    chapterTitlePosition: 'centered',
    chapterTitleCase: 'title-case',
    chapterDropFromTop: 0,
    afterChapterTitleSpace: 0.35,
    chapterOrnament: 'line',
    chapterOrnamentPosition: 'below-title',
    sceneBreakStyle: 'asterisks',
    sceneBreakSymbol: '* * *',
  },
  
  headerFooter: {
    headerEnabled: false,
    headerLeftContent: 'title',
    headerCenterContent: 'none',
    headerRightContent: 'chapter',
    headerFontSize: 9,
    headerFont: 'inherit',
    headerStyle: 'small-caps',
    headerLine: false,
    footerEnabled: true,
    footerLeftContent: 'none',
    footerCenterContent: 'page-number',
    footerRightContent: 'none',
    footerFontSize: 10,
    footerFont: 'inherit',
    footerLine: false,
    pageNumberStyle: 'arabic',
    firstPageNumberVisible: false,
    frontMatterNumbering: 'roman-lower',
    mirrorHeaders: true,
  },
  
  frontMatter: {
    order: ['half-title', 'title-page', 'copyright', 'dedication', 'table-of-contents'],
    halfTitlePage: true,
    titlePage: true,
    copyrightPage: true,
    dedicationPage: false,
    tableOfContents: true,
    tocDepth: 1,
    foreword: false,
    preface: false,
    acknowledgments: false,
    introduction: false,
  },
  
  backMatter: {
    order: ['about-author', 'also-by'],
    epilogue: false,
    afterword: false,
    appendices: false,
    glossary: false,
    bibliography: false,
    index: false,
    aboutAuthor: true,
    alsoBy: false,
    bookClubQuestions: false,
    excerpt: false,
  },
  
  export: {
    pdf: {
      quality: 'ebook',
      embedFonts: true,
      colorProfile: 'rgb',
      compression: 'medium',
      pdfVersion: '1.7',
      includeBleed: false,
      cropMarks: false,
      hyperlinks: true,
    },
    epub: {
      version: 'epub3',
      layout: 'reflowable',
      tocType: 'nav',
      coverInSpine: true,
      embedFonts: true,
      generateCSS: true,
    },
    docx: {
      compatibility: 'word2016',
      embedFonts: true,
      trackChanges: false,
    },
    html: {
      singleFile: true,
      includeCSS: 'inline',
      responsive: true,
      darkModeSupport: true,
    },
    kindle: {
      enhancedTypesetting: true,
      xrayEnabled: true,
      textToSpeechEnabled: true,
      lendingEnabled: false,
      primaryMarketplace: 'amazon.com',
    },
  },
  
  stylePreset: 'classic',
  language: 'en-US',
};

// =============================================
// PUBLISHING PRESETS (complete, robust)
// =============================================
export type PublishingPresetIconKey =
  | 'sparkles'
  | 'book'
  | 'ruler'
  | 'file'
  | 'graduation'
  | 'square';

export interface PublishingPresetDefinition {
  id: string;
  title: string;
  description: string;
  icon: PublishingPresetIconKey;
  settings: Partial<PublishingSettings>;
}

export const PUBLISHING_PRESETS: PublishingPresetDefinition[] = [
  {
    id: 'a5-default',
    title: 'Default (A5)',
    description: 'Compact A5 interior with clean chapter openings (drop = 0).',
    icon: 'sparkles',
    settings: {
      publishingPresetId: 'a5-default',
      trimSize: 'a5',
      orientation: 'portrait',
      marginPreset: 'normal',
      margins: MARGIN_PRESETS['normal'],
      typography: {
        ...DEFAULT_PUBLISHING_SETTINGS.typography,
      },
      chapters: {
        ...DEFAULT_PUBLISHING_SETTINGS.chapters,
        chapterDropFromTop: 0,
      },
      export: {
        ...DEFAULT_PUBLISHING_SETTINGS.export,
        pdf: {
          ...DEFAULT_PUBLISHING_SETTINGS.export.pdf,
          quality: 'ebook',
        },
      },
    },
  },
  {
    id: 'trade-5x8',
    title: 'Trade Paperback (5×8)',
    description: 'Classic fiction size; balanced margins and readable typography.',
    icon: 'book',
    settings: {
      publishingPresetId: 'trade-5x8',
      trimSize: 'trade-5x8',
      orientation: 'portrait',
      marginPreset: 'normal',
      margins: MARGIN_PRESETS['normal'],
      typography: {
        ...DEFAULT_PUBLISHING_SETTINGS.typography,
        bodyLineHeight: 1.5,
        chapterTitleSize: 22,
        paragraphIndent: 0.3,
      },
      chapters: {
        ...DEFAULT_PUBLISHING_SETTINGS.chapters,
        chapterDropFromTop: 1.25,
        afterChapterTitleSpace: 0.5,
      },
      export: {
        ...DEFAULT_PUBLISHING_SETTINGS.export,
        pdf: {
          ...DEFAULT_PUBLISHING_SETTINGS.export.pdf,
          quality: 'print',
          includeBleed: false,
        },
      },
    },
  },
  {
    id: 'trade-5.5x8.5',
    title: 'Trade Paperback (5.5×8.5)',
    description: 'Standard trade size for fiction & non-fiction.',
    icon: 'book',
    settings: {
      publishingPresetId: 'trade-5.5x8.5',
      trimSize: 'trade-5.5x8.5',
      orientation: 'portrait',
      marginPreset: 'normal',
      margins: MARGIN_PRESETS['normal'],
      typography: {
        ...DEFAULT_PUBLISHING_SETTINGS.typography,
        bodyLineHeight: 1.5,
        chapterTitleSize: 24,
        paragraphIndent: 0.3,
      },
      chapters: {
        ...DEFAULT_PUBLISHING_SETTINGS.chapters,
        chapterDropFromTop: 1.5,
        afterChapterTitleSpace: 0.5,
      },
      export: {
        ...DEFAULT_PUBLISHING_SETTINGS.export,
        pdf: {
          ...DEFAULT_PUBLISHING_SETTINGS.export.pdf,
          quality: 'print',
        },
      },
    },
  },
  {
    id: 'us-trade-6x9',
    title: 'US Trade (6×9)',
    description: 'Popular for non-fiction, business, and textbooks.',
    icon: 'ruler',
    settings: {
      publishingPresetId: 'us-trade-6x9',
      trimSize: 'us-trade-6x9',
      orientation: 'portrait',
      marginPreset: 'normal',
      margins: MARGIN_PRESETS['normal'],
      typography: {
        ...DEFAULT_PUBLISHING_SETTINGS.typography,
        bodyFontSize: 12,
        bodyLineHeight: 1.55,
        chapterTitleSize: 26,
        paragraphIndent: 0.3,
      },
      chapters: {
        ...DEFAULT_PUBLISHING_SETTINGS.chapters,
        chapterDropFromTop: 1.5,
        afterChapterTitleSpace: 0.55,
      },
      export: {
        ...DEFAULT_PUBLISHING_SETTINGS.export,
        pdf: {
          ...DEFAULT_PUBLISHING_SETTINGS.export.pdf,
          quality: 'print',
        },
      },
    },
  },
  {
    id: 'a4',
    title: 'A4',
    description: 'International standard paper size; great for documents and academic layouts.',
    icon: 'file',
    settings: {
      publishingPresetId: 'a4',
      trimSize: 'a4',
      orientation: 'portrait',
      stylePreset: 'academic',
      marginPreset: 'academic',
      margins: MARGIN_PRESETS['academic'],
      typography: {
        ...DEFAULT_PUBLISHING_SETTINGS.typography,
        bodyFont: 'times-new-roman',
        bodyFontSize: 12,
        bodyLineHeight: 1.9,
        bodyAlignment: 'left',
        paragraphIndent: 0.5,
      },
      chapters: {
        ...DEFAULT_PUBLISHING_SETTINGS.chapters,
        startOnOddPage: false,
        chapterOrnament: 'none',
        chapterDropFromTop: 1.0,
      },
      export: {
        ...DEFAULT_PUBLISHING_SETTINGS.export,
        pdf: {
          ...DEFAULT_PUBLISHING_SETTINGS.export.pdf,
          quality: 'print',
        },
      },
    },
  },
  {
    id: 'us-letter',
    title: 'US Letter',
    description: 'Standard US paper size; best for worksheets and academic exports.',
    icon: 'file',
    settings: {
      publishingPresetId: 'us-letter',
      trimSize: 'us-letter',
      orientation: 'portrait',
      stylePreset: 'academic',
      marginPreset: 'academic',
      margins: MARGIN_PRESETS['academic'],
      typography: {
        ...DEFAULT_PUBLISHING_SETTINGS.typography,
        bodyFont: 'times-new-roman',
        bodyFontSize: 12,
        bodyLineHeight: 2.0,
        bodyAlignment: 'left',
        paragraphIndent: 0.5,
      },
      chapters: {
        ...DEFAULT_PUBLISHING_SETTINGS.chapters,
        startOnOddPage: false,
        chapterOrnament: 'none',
        chapterDropFromTop: 1.0,
      },
      export: {
        ...DEFAULT_PUBLISHING_SETTINGS.export,
        pdf: {
          ...DEFAULT_PUBLISHING_SETTINGS.export.pdf,
          quality: 'print',
        },
      },
    },
  },
  {
    id: 'ya-5.5x8.25',
    title: 'Young Adult (5.5×8.25)',
    description: 'YA-friendly size with slightly larger type and comfortable spacing.',
    icon: 'sparkles',
    settings: {
      publishingPresetId: 'ya-5.5x8.25',
      trimSize: 'ya-5.5x8.25',
      orientation: 'portrait',
      stylePreset: 'modern',
      marginPreset: 'normal',
      margins: MARGIN_PRESETS['normal'],
      typography: {
        ...DEFAULT_PUBLISHING_SETTINGS.typography,
        bodyFontSize: 12,
        bodyLineHeight: 1.6,
        paragraphIndent: 0.25,
      },
      chapters: {
        ...DEFAULT_PUBLISHING_SETTINGS.chapters,
        chapterDropFromTop: 1.0,
        afterChapterTitleSpace: 0.45,
      },
    },
  },
  {
    id: 'children-square-8.5x8.5',
    title: "Children's Square (8.5×8.5)",
    description: 'Square format for picture books; large type and generous spacing.',
    icon: 'square',
    settings: {
      publishingPresetId: 'children-square-8.5x8.5',
      trimSize: 'children-square-8.5',
      orientation: 'portrait',
      stylePreset: 'childrens',
      marginPreset: 'picture-book',
      margins: MARGIN_PRESETS['picture-book'],
      typography: {
        ...DEFAULT_PUBLISHING_SETTINGS.typography,
        bodyFont: 'open-sans',
        bodyFontSize: 16,
        bodyLineHeight: 1.8,
        bodyAlignment: 'left',
        paragraphIndent: 0,
        paragraphSpacing: 'large',
      },
      chapters: {
        ...DEFAULT_PUBLISHING_SETTINGS.chapters,
        startOnOddPage: false,
        chapterOpeningStyle: 'illustrated',
        showChapterNumber: false,
        chapterOrnament: 'none',
        chapterDropFromTop: 0.5,
        afterChapterTitleSpace: 0.35,
        sceneBreakStyle: 'blank-line',
      },
      headerFooter: {
        ...DEFAULT_PUBLISHING_SETTINGS.headerFooter,
        headerEnabled: false,
        footerEnabled: false,
      },
    },
  },
  {
    id: 'academic',
    title: 'Academic',
    description: 'Double-spaced, left-aligned text with academic margins.',
    icon: 'graduation',
    settings: {
      publishingPresetId: 'academic',
      trimSize: 'us-letter',
      orientation: 'portrait',
      stylePreset: 'academic',
      marginPreset: 'academic',
      margins: MARGIN_PRESETS['academic'],
      typography: {
        ...DEFAULT_PUBLISHING_SETTINGS.typography,
        bodyFont: 'times-new-roman',
        bodyFontSize: 12,
        bodyLineHeight: 2.0,
        bodyAlignment: 'left',
        paragraphIndent: 0.5,
      },
      chapters: {
        ...DEFAULT_PUBLISHING_SETTINGS.chapters,
        startOnOddPage: false,
        chapterOrnament: 'none',
        chapterDropFromTop: 1.0,
      },
      export: {
        ...DEFAULT_PUBLISHING_SETTINGS.export,
        docx: {
          ...DEFAULT_PUBLISHING_SETTINGS.export.docx,
          compatibility: 'word365',
        },
      },
    },
  },
  {
    id: 'custom',
    title: 'Custom',
    description: 'Keep your current settings; no auto changes.',
    icon: 'ruler',
    settings: {
      publishingPresetId: 'custom',
    },
  },
];

export function getPublishingPreset(presetId: string): PublishingPresetDefinition | undefined {
  return PUBLISHING_PRESETS.find((p) => p.id === presetId);
}

// =============================================
// STYLE PRESETS
// =============================================
export const STYLE_PRESETS: Record<string, Partial<PublishingSettings>> = {
  'classic': {
    typography: {
      ...DEFAULT_PUBLISHING_SETTINGS.typography,
      bodyFont: 'garamond',
      headingFont: 'inherit',
      dropCapEnabled: true,
    },
    chapters: {
      ...DEFAULT_PUBLISHING_SETTINGS.chapters,
      chapterOrnament: 'flourish',
    },
  },
  'modern': {
    typography: {
      ...DEFAULT_PUBLISHING_SETTINGS.typography,
      bodyFont: 'source-serif',
      headingFont: 'montserrat',
      bodyAlignment: 'left',
      dropCapEnabled: false,
    },
    chapters: {
      ...DEFAULT_PUBLISHING_SETTINGS.chapters,
      chapterOrnament: 'none',
      chapterOpeningStyle: 'minimal',
    },
  },
  'minimal': {
    typography: {
      ...DEFAULT_PUBLISHING_SETTINGS.typography,
      bodyFont: 'helvetica',
      headingFont: 'inherit',
      bodyAlignment: 'left',
      paragraphSpacing: 'medium',
      paragraphIndent: 0,
    },
    chapters: {
      ...DEFAULT_PUBLISHING_SETTINGS.chapters,
      showChapterNumber: false,
      chapterOrnament: 'none',
      sceneBreakStyle: 'blank-line',
    },
    headerFooter: {
      ...DEFAULT_PUBLISHING_SETTINGS.headerFooter,
      headerEnabled: false,
    },
  },
  'elegant': {
    typography: {
      ...DEFAULT_PUBLISHING_SETTINGS.typography,
      bodyFont: 'baskerville',
      headingFont: 'playfair',
      dropCapEnabled: true,
      dropCapLines: 4,
    },
    chapters: {
      ...DEFAULT_PUBLISHING_SETTINGS.chapters,
      chapterOpeningStyle: 'decorated',
      chapterOrnament: 'flourish',
    },
  },
  'academic': {
    trimSize: 'us-letter',
    typography: {
      ...DEFAULT_PUBLISHING_SETTINGS.typography,
      bodyFont: 'times-new-roman',
      bodyFontSize: 12,
      bodyLineHeight: 2,
      bodyAlignment: 'left',
      paragraphIndent: 0.5,
    },
    margins: MARGIN_PRESETS['academic'],
    chapters: {
      ...DEFAULT_PUBLISHING_SETTINGS.chapters,
      startOnOddPage: false,
      chapterOrnament: 'none',
    },
  },
  'childrens': {
    trimSize: 'children-square-8.5',
    typography: {
      ...DEFAULT_PUBLISHING_SETTINGS.typography,
      bodyFont: 'open-sans',
      bodyFontSize: 16,
      bodyLineHeight: 1.8,
      bodyAlignment: 'left',
      paragraphSpacing: 'large',
      paragraphIndent: 0,
    },
    margins: MARGIN_PRESETS['picture-book'],
    chapters: {
      ...DEFAULT_PUBLISHING_SETTINGS.chapters,
      chapterOpeningStyle: 'illustrated',
      startOnOddPage: false,
    },
    headerFooter: {
      ...DEFAULT_PUBLISHING_SETTINGS.headerFooter,
      headerEnabled: false,
      footerEnabled: false,
    },
  },
};

// =============================================
// BOOK TYPE PRESETS
// =============================================
export const BOOK_TYPE_PRESETS: Record<BookType, Partial<PublishingSettings>> = {
  'novel': {
    trimSize: 'trade-5.5x8.5',
    stylePreset: 'classic',
  },
  'novella': {
    trimSize: 'trade-5x8',
    stylePreset: 'classic',
  },
  'short-story-collection': {
    trimSize: 'trade-5.5x8.5',
    chapters: {
      ...DEFAULT_PUBLISHING_SETTINGS.chapters,
      chapterNumberLabel: 'Story',
    },
  },
  'picture-book': {
    trimSize: 'children-square-8.5',
    stylePreset: 'childrens',
  },
  'storybook': {
    trimSize: 'middle-grade',
    typography: {
      ...DEFAULT_PUBLISHING_SETTINGS.typography,
      bodyFontSize: 13,
    },
  },
  'young-adult': {
    trimSize: 'ya-5.5x8.25',
    stylePreset: 'modern',
  },
  'middle-grade': {
    trimSize: 'middle-grade',
    typography: {
      ...DEFAULT_PUBLISHING_SETTINGS.typography,
      bodyFontSize: 12,
      bodyLineHeight: 1.6,
    },
  },
  'textbook': {
    trimSize: 'us-letter',
    stylePreset: 'academic',
  },
  'workbook': {
    trimSize: 'us-letter',
    margins: MARGIN_PRESETS['wide'],
  },
  'cookbook': {
    trimSize: 'us-trade-6x9',
    typography: {
      ...DEFAULT_PUBLISHING_SETTINGS.typography,
      bodyFont: 'open-sans',
    },
  },
  'coffee-table-book': {
    trimSize: 'coffee-table-11x8.5',
    orientation: 'landscape',
    stylePreset: 'minimal',
  },
  'art-book': {
    trimSize: 'coffee-table-12x12',
    margins: MARGIN_PRESETS['tight'],
  },
  'memoir': {
    trimSize: 'trade-5.5x8.5',
    stylePreset: 'elegant',
  },
  'biography': {
    trimSize: 'us-trade-6x9',
    stylePreset: 'classic',
  },
  'self-help': {
    trimSize: 'us-trade-6x9',
    stylePreset: 'modern',
  },
  'business': {
    trimSize: 'us-trade-6x9',
    stylePreset: 'modern',
  },
  'technical': {
    trimSize: 'us-letter',
    stylePreset: 'academic',
  },
  'poetry': {
    trimSize: 'trade-5x8',
    typography: {
      ...DEFAULT_PUBLISHING_SETTINGS.typography,
      bodyAlignment: 'left',
      paragraphIndent: 0,
    },
    chapters: {
      ...DEFAULT_PUBLISHING_SETTINGS.chapters,
      chapterNumberLabel: 'Part',
    },
  },
  'graphic-novel': {
    trimSize: 'us-trade-6x9',
    margins: MARGIN_PRESETS['tight'],
  },
  'journal': {
    trimSize: 'a5',
    margins: MARGIN_PRESETS['wide'],
  },
  'devotional': {
    trimSize: 'trade-5x8',
    stylePreset: 'elegant',
  },
  'travel-guide': {
    trimSize: 'trade-5x8',
    stylePreset: 'modern',
  },
  'magazine': {
    trimSize: 'us-letter',
    orientation: 'portrait',
  },
  'academic': {
    trimSize: 'us-letter',
    stylePreset: 'academic',
  },
  'custom': DEFAULT_PUBLISHING_SETTINGS,
};

