// Book Layout Types for HTML-to-PDF Export
// Professional publishing layouts using CSS Paged Media

export type BookLayoutType = 
  | 'novel-classic'        // Traditional novel layout (single column, elegant)
  | 'novel-modern'         // Contemporary novel (clean, minimal)
  | 'academic-single'      // Academic paper (single column with footnotes)
  | 'academic-twocolumn'   // Academic/journal style (two columns)
  | 'dictionary'           // Dictionary/reference layout (two columns, entries)
  | 'magazine'             // Magazine-style layout
  | 'poetry'               // Poetry collection
  | 'picture-book'         // Children's picture book
  | 'coffee-table'         // Large format art book
  | 'textbook'             // Educational textbook with sidebars
  | 'cookbook'             // Recipe book layout
  | 'custom';              // User-defined layout

export interface LayoutConfig {
  id: BookLayoutType;
  name: string;
  description: string;
  category: 'fiction' | 'non-fiction' | 'academic' | 'specialty';
  
  // Column configuration
  columns: {
    count: 1 | 2 | 3;
    gap: number;              // in points
    balance: boolean;         // Balance column heights
    spanElements: string[];   // Elements that span all columns (e.g., 'h1', '.figure')
  };
  
  // Typography
  typography: {
    bodyFontFamily: string;
    headingFontFamily: string;
    bodyFontSize: number;     // in points
    lineHeight: number;       // multiplier
    dropCap: boolean;
    dropCapLines: number;
    dropCapFont?: string;
    textAlign: 'left' | 'justify' | 'center';
    hyphenate: boolean;
  };
  
  // Page layout
  page: {
    size: string;             // e.g., '5.5in 8.5in', 'A4', 'letter'
    orientation: 'portrait' | 'landscape';
    margins: {
      top: string;
      bottom: string;
      inside: string;
      outside: string;
    };
    bleed?: string;
  };
  
  // Chapter styling
  chapter: {
    startOnRecto: boolean;    // Start chapters on right page
    dropFromTop: string;      // Distance from top to chapter start
    numberStyle: 'numeric' | 'roman' | 'word' | 'hidden';
    titleAlignment: 'left' | 'center' | 'right';
    ornament: string | null;  // Decorative element
  };
  
  // Headers and footers
  runningHeaders: {
    enabled: boolean;
    leftPage: {
      left: 'title' | 'author' | 'chapter' | 'none' | string;
      center: 'title' | 'author' | 'chapter' | 'none' | string;
      right: 'title' | 'author' | 'chapter' | 'none' | string;
    };
    rightPage: {
      left: 'title' | 'author' | 'chapter' | 'none' | string;
      center: 'title' | 'author' | 'chapter' | 'none' | string;
      right: 'title' | 'author' | 'chapter' | 'none' | string;
    };
    fontSize: number;
    fontStyle: 'normal' | 'italic' | 'small-caps';
  };
  
  // Page numbers
  pageNumbers: {
    enabled: boolean;
    position: 'bottom-center' | 'bottom-outside' | 'top-outside' | 'bottom-inside';
    style: 'arabic' | 'roman-lower' | 'roman-upper';
    firstPageHidden: boolean;
  };
  
  // Special features
  features: {
    footnotes: boolean;
    marginNotes: boolean;
    figures: boolean;
    tables: boolean;
    pullQuotes: boolean;
    sidebars: boolean;
  };
}

// =============================================
// PREDEFINED LAYOUT CONFIGURATIONS
// =============================================

export const BOOK_LAYOUTS: Record<BookLayoutType, LayoutConfig> = {
  'novel-classic': {
    id: 'novel-classic',
    name: 'Classic Novel',
    description: 'Traditional novel layout with elegant typography, drop caps, and justified text',
    category: 'fiction',
    columns: {
      count: 1,
      gap: 0,
      balance: false,
      spanElements: [],
    },
    typography: {
      bodyFontFamily: '"EB Garamond", Garamond, "Times New Roman", serif',
      headingFontFamily: '"Cormorant Garamond", Garamond, serif',
      bodyFontSize: 11,
      lineHeight: 1.5,
      dropCap: true,
      dropCapLines: 3,
      dropCapFont: '"Cormorant Garamond", serif',
      textAlign: 'justify',
      hyphenate: true,
    },
    page: {
      size: '5.5in 8.5in',
      orientation: 'portrait',
      margins: {
        top: '0.875in',
        bottom: '1in',
        inside: '0.875in',
        outside: '0.625in',
      },
    },
    chapter: {
      startOnRecto: true,
      dropFromTop: '2.5in',
      numberStyle: 'numeric',
      titleAlignment: 'center',
      ornament: '❧',
    },
    runningHeaders: {
      enabled: true,
      leftPage: { left: 'author', center: 'none', right: 'none' },
      rightPage: { left: 'none', center: 'none', right: 'title' },
      fontSize: 9,
      fontStyle: 'small-caps',
    },
    pageNumbers: {
      enabled: true,
      position: 'bottom-center',
      style: 'arabic',
      firstPageHidden: true,
    },
    features: {
      footnotes: false,
      marginNotes: false,
      figures: false,
      tables: false,
      pullQuotes: false,
      sidebars: false,
    },
  },

  'novel-modern': {
    id: 'novel-modern',
    name: 'Modern Novel',
    description: 'Clean, contemporary design with ragged-right text and minimal ornamentation',
    category: 'fiction',
    columns: {
      count: 1,
      gap: 0,
      balance: false,
      spanElements: [],
    },
    typography: {
      bodyFontFamily: '"Source Serif Pro", Georgia, serif',
      headingFontFamily: '"Montserrat", "Helvetica Neue", sans-serif',
      bodyFontSize: 11,
      lineHeight: 1.6,
      dropCap: false,
      dropCapLines: 0,
      textAlign: 'left',
      hyphenate: false,
    },
    page: {
      size: '5.5in 8.5in',
      orientation: 'portrait',
      margins: {
        top: '1in',
        bottom: '1in',
        inside: '1in',
        outside: '0.75in',
      },
    },
    chapter: {
      startOnRecto: false,
      dropFromTop: '3in',
      numberStyle: 'numeric',
      titleAlignment: 'left',
      ornament: null,
    },
    runningHeaders: {
      enabled: false,
      leftPage: { left: 'none', center: 'none', right: 'none' },
      rightPage: { left: 'none', center: 'none', right: 'none' },
      fontSize: 9,
      fontStyle: 'normal',
    },
    pageNumbers: {
      enabled: true,
      position: 'bottom-outside',
      style: 'arabic',
      firstPageHidden: true,
    },
    features: {
      footnotes: false,
      marginNotes: false,
      figures: false,
      tables: false,
      pullQuotes: false,
      sidebars: false,
    },
  },

  'academic-single': {
    id: 'academic-single',
    name: 'Academic Paper',
    description: 'Single-column academic layout with footnotes and proper citations',
    category: 'academic',
    columns: {
      count: 1,
      gap: 0,
      balance: false,
      spanElements: [],
    },
    typography: {
      bodyFontFamily: '"Times New Roman", Times, serif',
      headingFontFamily: '"Times New Roman", Times, serif',
      bodyFontSize: 12,
      lineHeight: 2,
      dropCap: false,
      dropCapLines: 0,
      textAlign: 'left',
      hyphenate: false,
    },
    page: {
      size: 'letter',
      orientation: 'portrait',
      margins: {
        top: '1in',
        bottom: '1in',
        inside: '1.5in',
        outside: '1in',
      },
    },
    chapter: {
      startOnRecto: false,
      dropFromTop: '1in',
      numberStyle: 'numeric',
      titleAlignment: 'left',
      ornament: null,
    },
    runningHeaders: {
      enabled: true,
      leftPage: { left: 'title', center: 'none', right: 'none' },
      rightPage: { left: 'none', center: 'none', right: 'title' },
      fontSize: 10,
      fontStyle: 'italic',
    },
    pageNumbers: {
      enabled: true,
      position: 'top-outside',
      style: 'arabic',
      firstPageHidden: true,
    },
    features: {
      footnotes: true,
      marginNotes: false,
      figures: true,
      tables: true,
      pullQuotes: false,
      sidebars: false,
    },
  },

  'academic-twocolumn': {
    id: 'academic-twocolumn',
    name: 'Academic Journal',
    description: 'Two-column academic/journal layout with figures, footnotes, and professional formatting',
    category: 'academic',
    columns: {
      count: 2,
      gap: 20,
      balance: true,
      spanElements: ['h1', '.abstract', '.figure-full', '.table-full'],
    },
    typography: {
      bodyFontFamily: '"Times New Roman", Times, serif',
      headingFontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      bodyFontSize: 9,
      lineHeight: 1.3,
      dropCap: false,
      dropCapLines: 0,
      textAlign: 'justify',
      hyphenate: true,
    },
    page: {
      size: 'letter',
      orientation: 'portrait',
      margins: {
        top: '0.75in',
        bottom: '1in',
        inside: '0.75in',
        outside: '0.75in',
      },
    },
    chapter: {
      startOnRecto: false,
      dropFromTop: '0',
      numberStyle: 'numeric',
      titleAlignment: 'center',
      ornament: null,
    },
    runningHeaders: {
      enabled: true,
      leftPage: { left: 'author', center: 'none', right: 'none' },
      rightPage: { left: 'none', center: 'none', right: 'title' },
      fontSize: 8,
      fontStyle: 'normal',
    },
    pageNumbers: {
      enabled: true,
      position: 'bottom-center',
      style: 'arabic',
      firstPageHidden: false,
    },
    features: {
      footnotes: true,
      marginNotes: false,
      figures: true,
      tables: true,
      pullQuotes: false,
      sidebars: false,
    },
  },

  'dictionary': {
    id: 'dictionary',
    name: 'Dictionary/Reference',
    description: 'Two-column reference layout with entry headers, drop caps, and thumb index',
    category: 'non-fiction',
    columns: {
      count: 2,
      gap: 24,
      balance: true,
      spanElements: ['h1', '.section-header'],
    },
    typography: {
      bodyFontFamily: '"Crimson Pro", Georgia, serif',
      headingFontFamily: '"Crimson Pro", Georgia, serif',
      bodyFontSize: 9,
      lineHeight: 1.25,
      dropCap: true,
      dropCapLines: 6,
      dropCapFont: '"Crimson Pro", serif',
      textAlign: 'justify',
      hyphenate: true,
    },
    page: {
      size: '6.5in 9.5in',
      orientation: 'portrait',
      margins: {
        top: '0.6in',
        bottom: '0.75in',
        inside: '0.75in',
        outside: '0.5in',
      },
    },
    chapter: {
      startOnRecto: true,
      dropFromTop: '0.5in',
      numberStyle: 'hidden',
      titleAlignment: 'center',
      ornament: null,
    },
    runningHeaders: {
      enabled: true,
      leftPage: { left: 'first-entry', center: 'none', right: 'none' },
      rightPage: { left: 'none', center: 'none', right: 'last-entry' },
      fontSize: 9,
      fontStyle: 'normal',
    },
    pageNumbers: {
      enabled: true,
      position: 'bottom-center',
      style: 'arabic',
      firstPageHidden: false,
    },
    features: {
      footnotes: true,
      marginNotes: true,
      figures: false,
      tables: false,
      pullQuotes: false,
      sidebars: false,
    },
  },

  'magazine': {
    id: 'magazine',
    name: 'Magazine Style',
    description: 'Modern magazine layout with pull quotes, sidebars, and flexible image placement',
    category: 'non-fiction',
    columns: {
      count: 3,
      gap: 16,
      balance: false,
      spanElements: ['h1', '.hero-image', '.pull-quote', '.sidebar'],
    },
    typography: {
      bodyFontFamily: '"Lato", "Helvetica Neue", sans-serif',
      headingFontFamily: '"Playfair Display", Georgia, serif',
      bodyFontSize: 10,
      lineHeight: 1.4,
      dropCap: true,
      dropCapLines: 4,
      dropCapFont: '"Playfair Display", serif',
      textAlign: 'justify',
      hyphenate: true,
    },
    page: {
      size: 'letter',
      orientation: 'portrait',
      margins: {
        top: '0.5in',
        bottom: '0.5in',
        inside: '0.5in',
        outside: '0.5in',
      },
      bleed: '0.125in',
    },
    chapter: {
      startOnRecto: false,
      dropFromTop: '0',
      numberStyle: 'hidden',
      titleAlignment: 'left',
      ornament: null,
    },
    runningHeaders: {
      enabled: true,
      leftPage: { left: 'section', center: 'none', right: 'none' },
      rightPage: { left: 'none', center: 'none', right: 'title' },
      fontSize: 8,
      fontStyle: 'normal',
    },
    pageNumbers: {
      enabled: true,
      position: 'bottom-outside',
      style: 'arabic',
      firstPageHidden: false,
    },
    features: {
      footnotes: false,
      marginNotes: false,
      figures: true,
      tables: true,
      pullQuotes: true,
      sidebars: true,
    },
  },

  'poetry': {
    id: 'poetry',
    name: 'Poetry Collection',
    description: 'Clean layout optimized for verse with generous white space',
    category: 'fiction',
    columns: {
      count: 1,
      gap: 0,
      balance: false,
      spanElements: [],
    },
    typography: {
      bodyFontFamily: '"EB Garamond", Garamond, serif',
      headingFontFamily: '"EB Garamond", Garamond, serif',
      bodyFontSize: 11,
      lineHeight: 1.6,
      dropCap: false,
      dropCapLines: 0,
      textAlign: 'left',
      hyphenate: false,
    },
    page: {
      size: '5in 8in',
      orientation: 'portrait',
      margins: {
        top: '1.25in',
        bottom: '1.25in',
        inside: '1in',
        outside: '1in',
      },
    },
    chapter: {
      startOnRecto: true,
      dropFromTop: '2in',
      numberStyle: 'hidden',
      titleAlignment: 'center',
      ornament: '✦',
    },
    runningHeaders: {
      enabled: false,
      leftPage: { left: 'none', center: 'none', right: 'none' },
      rightPage: { left: 'none', center: 'none', right: 'none' },
      fontSize: 9,
      fontStyle: 'italic',
    },
    pageNumbers: {
      enabled: true,
      position: 'bottom-center',
      style: 'arabic',
      firstPageHidden: true,
    },
    features: {
      footnotes: false,
      marginNotes: false,
      figures: false,
      tables: false,
      pullQuotes: false,
      sidebars: false,
    },
  },

  'picture-book': {
    id: 'picture-book',
    name: 'Picture Book',
    description: 'Large format with full-bleed images and minimal text placement',
    category: 'specialty',
    columns: {
      count: 1,
      gap: 0,
      balance: false,
      spanElements: [],
    },
    typography: {
      bodyFontFamily: '"Open Sans", "Helvetica Neue", sans-serif',
      headingFontFamily: '"Fredoka One", "Comic Sans MS", cursive',
      bodyFontSize: 16,
      lineHeight: 1.8,
      dropCap: false,
      dropCapLines: 0,
      textAlign: 'left',
      hyphenate: false,
    },
    page: {
      size: '10in 8in',
      orientation: 'landscape',
      margins: {
        top: '0.75in',
        bottom: '0.75in',
        inside: '0.75in',
        outside: '0.75in',
      },
      bleed: '0.25in',
    },
    chapter: {
      startOnRecto: false,
      dropFromTop: '0',
      numberStyle: 'hidden',
      titleAlignment: 'left',
      ornament: null,
    },
    runningHeaders: {
      enabled: false,
      leftPage: { left: 'none', center: 'none', right: 'none' },
      rightPage: { left: 'none', center: 'none', right: 'none' },
      fontSize: 10,
      fontStyle: 'normal',
    },
    pageNumbers: {
      enabled: false,
      position: 'bottom-center',
      style: 'arabic',
      firstPageHidden: true,
    },
    features: {
      footnotes: false,
      marginNotes: false,
      figures: true,
      tables: false,
      pullQuotes: false,
      sidebars: false,
    },
  },

  'coffee-table': {
    id: 'coffee-table',
    name: 'Coffee Table Book',
    description: 'Large format art/photography book with elegant typography',
    category: 'specialty',
    columns: {
      count: 1,
      gap: 0,
      balance: false,
      spanElements: [],
    },
    typography: {
      bodyFontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      headingFontFamily: '"Playfair Display", Georgia, serif',
      bodyFontSize: 10,
      lineHeight: 1.6,
      dropCap: false,
      dropCapLines: 0,
      textAlign: 'left',
      hyphenate: false,
    },
    page: {
      size: '12in 10in',
      orientation: 'landscape',
      margins: {
        top: '1in',
        bottom: '1in',
        inside: '1.25in',
        outside: '1in',
      },
      bleed: '0.125in',
    },
    chapter: {
      startOnRecto: true,
      dropFromTop: '2in',
      numberStyle: 'hidden',
      titleAlignment: 'center',
      ornament: null,
    },
    runningHeaders: {
      enabled: false,
      leftPage: { left: 'none', center: 'none', right: 'none' },
      rightPage: { left: 'none', center: 'none', right: 'none' },
      fontSize: 9,
      fontStyle: 'normal',
    },
    pageNumbers: {
      enabled: true,
      position: 'bottom-center',
      style: 'arabic',
      firstPageHidden: true,
    },
    features: {
      footnotes: false,
      marginNotes: false,
      figures: true,
      tables: false,
      pullQuotes: true,
      sidebars: false,
    },
  },

  'textbook': {
    id: 'textbook',
    name: 'Educational Textbook',
    description: 'Structured layout with sidebars, callouts, and learning objectives',
    category: 'academic',
    columns: {
      count: 1,
      gap: 0,
      balance: false,
      spanElements: [],
    },
    typography: {
      bodyFontFamily: '"Source Sans Pro", "Helvetica Neue", sans-serif',
      headingFontFamily: '"Source Sans Pro", "Helvetica Neue", sans-serif',
      bodyFontSize: 10,
      lineHeight: 1.5,
      dropCap: false,
      dropCapLines: 0,
      textAlign: 'left',
      hyphenate: false,
    },
    page: {
      size: 'letter',
      orientation: 'portrait',
      margins: {
        top: '0.75in',
        bottom: '0.75in',
        inside: '1in',
        outside: '2.5in',  // Wide margin for notes
      },
    },
    chapter: {
      startOnRecto: true,
      dropFromTop: '0.5in',
      numberStyle: 'numeric',
      titleAlignment: 'left',
      ornament: null,
    },
    runningHeaders: {
      enabled: true,
      leftPage: { left: 'chapter', center: 'none', right: 'none' },
      rightPage: { left: 'none', center: 'none', right: 'section' },
      fontSize: 9,
      fontStyle: 'normal',
    },
    pageNumbers: {
      enabled: true,
      position: 'bottom-outside',
      style: 'arabic',
      firstPageHidden: false,
    },
    features: {
      footnotes: true,
      marginNotes: true,
      figures: true,
      tables: true,
      pullQuotes: false,
      sidebars: true,
    },
  },

  'cookbook': {
    id: 'cookbook',
    name: 'Cookbook/Recipe Book',
    description: 'Recipe-optimized layout with ingredient lists and step-by-step instructions',
    category: 'specialty',
    columns: {
      count: 2,
      gap: 24,
      balance: false,
      spanElements: ['h1', '.recipe-image', '.section-divider'],
    },
    typography: {
      bodyFontFamily: '"Lora", Georgia, serif',
      headingFontFamily: '"Playfair Display", Georgia, serif',
      bodyFontSize: 10,
      lineHeight: 1.5,
      dropCap: false,
      dropCapLines: 0,
      textAlign: 'left',
      hyphenate: false,
    },
    page: {
      size: '7in 10in',
      orientation: 'portrait',
      margins: {
        top: '0.75in',
        bottom: '0.75in',
        inside: '0.875in',
        outside: '0.625in',
      },
    },
    chapter: {
      startOnRecto: true,
      dropFromTop: '1in',
      numberStyle: 'hidden',
      titleAlignment: 'center',
      ornament: '❦',
    },
    runningHeaders: {
      enabled: true,
      leftPage: { left: 'section', center: 'none', right: 'none' },
      rightPage: { left: 'none', center: 'none', right: 'recipe-name' },
      fontSize: 9,
      fontStyle: 'italic',
    },
    pageNumbers: {
      enabled: true,
      position: 'bottom-center',
      style: 'arabic',
      firstPageHidden: true,
    },
    features: {
      footnotes: false,
      marginNotes: true,
      figures: true,
      tables: true,
      pullQuotes: false,
      sidebars: true,
    },
  },

  'custom': {
    id: 'custom',
    name: 'Custom Layout',
    description: 'Fully customizable layout based on user preferences',
    category: 'specialty',
    columns: {
      count: 1,
      gap: 0,
      balance: false,
      spanElements: [],
    },
    typography: {
      bodyFontFamily: 'Georgia, serif',
      headingFontFamily: 'Georgia, serif',
      bodyFontSize: 11,
      lineHeight: 1.5,
      dropCap: false,
      dropCapLines: 0,
      textAlign: 'justify',
      hyphenate: true,
    },
    page: {
      size: '5.5in 8.5in',
      orientation: 'portrait',
      margins: {
        top: '1in',
        bottom: '1in',
        inside: '1in',
        outside: '0.75in',
      },
    },
    chapter: {
      startOnRecto: true,
      dropFromTop: '2in',
      numberStyle: 'numeric',
      titleAlignment: 'center',
      ornament: null,
    },
    runningHeaders: {
      enabled: true,
      leftPage: { left: 'author', center: 'none', right: 'none' },
      rightPage: { left: 'none', center: 'none', right: 'title' },
      fontSize: 9,
      fontStyle: 'small-caps',
    },
    pageNumbers: {
      enabled: true,
      position: 'bottom-center',
      style: 'arabic',
      firstPageHidden: true,
    },
    features: {
      footnotes: false,
      marginNotes: false,
      figures: false,
      tables: false,
      pullQuotes: false,
      sidebars: false,
    },
  },
};

// Get layout by ID
export function getLayout(id: BookLayoutType): LayoutConfig {
  return BOOK_LAYOUTS[id] || BOOK_LAYOUTS['novel-classic'];
}

// Get layouts by category
export function getLayoutsByCategory(category: string): LayoutConfig[] {
  return Object.values(BOOK_LAYOUTS).filter(l => l.category === category);
}

// Get all layout options for UI
export function getLayoutOptions(): Array<{ id: BookLayoutType; name: string; description: string }> {
  return Object.values(BOOK_LAYOUTS).map(l => ({
    id: l.id,
    name: l.name,
    description: l.description,
  }));
}
















