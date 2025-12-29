# HTML-to-PDF Export System

## Overview

The PowerWrite export system now uses **HTML with CSS Paged Media** as the primary method for generating professional book PDFs. This approach provides:

- **Multi-column layouts** (dictionary, academic journal, magazine)
- **Drop caps** with configurable font and line count
- **Running headers/footers** with author, title, chapter info
- **CSS Paged Media features** (@page rules, page breaks, footnotes)
- **Professional typography** (widow/orphan control, hyphenation)
- **Flexible templates** for different book types

## Architecture

```
User Request → Export API → PDF HTML Service → Puppeteer → PDF
                                   ↓
                        Layout Config + CSS Generator
```

### Key Files

| File | Purpose |
|------|---------|
| `lib/types/book-layouts.ts` | Layout type definitions and presets |
| `lib/utils/css-paged-media.ts` | CSS Paged Media stylesheet generator |
| `lib/services/pdf-html-service.ts` | HTML-to-PDF conversion service |
| `lib/services/export-service-advanced.ts` | Main export service (orchestrates PDF methods) |
| `app/api/books/export/route.ts` | Export API endpoint |
| `app/api/layouts/route.ts` | Layouts listing API |

## Available Layouts

### Fiction
| ID | Name | Description |
|----|------|-------------|
| `novel-classic` | Classic Novel | Traditional layout with drop caps, justified text, elegant typography |
| `novel-modern` | Modern Novel | Clean, contemporary design with ragged-right text |
| `poetry` | Poetry Collection | Generous white space optimized for verse |

### Non-Fiction
| ID | Name | Description |
|----|------|-------------|
| `dictionary` | Dictionary/Reference | Two-column reference layout with entries and drop caps |
| `magazine` | Magazine Style | Three-column layout with pull quotes and sidebars |
| `cookbook` | Cookbook/Recipe | Two-column recipe layout |

### Academic
| ID | Name | Description |
|----|------|-------------|
| `academic-single` | Academic Paper | Single-column with footnotes, double-spaced |
| `academic-twocolumn` | Academic Journal | Two-column journal format with figures |
| `textbook` | Educational Textbook | Wide margins for notes, sidebars |

### Specialty
| ID | Name | Description |
|----|------|-------------|
| `picture-book` | Picture Book | Large landscape format with full-bleed images |
| `coffee-table` | Coffee Table Book | Large format art/photography book |

## API Usage

### Export with Layout

```javascript
POST /api/books/export
{
  "userId": "user-id",
  "bookId": 123,
  "format": "pdf",
  "layoutType": "academic-twocolumn"  // Optional: defaults to novel-classic
}
```

### List Available Layouts

```javascript
GET /api/layouts

// Response
{
  "success": true,
  "layouts": [
    { "id": "novel-classic", "name": "Classic Novel", "description": "..." },
    { "id": "dictionary", "name": "Dictionary/Reference", "description": "..." },
    ...
  ],
  "byCategory": {
    "fiction": [...],
    "non-fiction": [...],
    "academic": [...],
    "specialty": [...]
  }
}
```

### Set Layout in Publishing Settings

```javascript
PUT /api/books/{id}/publishing
{
  "publishingSettings": {
    "layoutType": "dictionary",
    "bookType": "textbook",
    ...
  }
}
```

## Layout Configuration

Each layout includes:

```typescript
interface LayoutConfig {
  id: BookLayoutType;
  name: string;
  description: string;
  category: 'fiction' | 'non-fiction' | 'academic' | 'specialty';
  
  columns: {
    count: 1 | 2 | 3;
    gap: number;           // in points
    balance: boolean;      // Balance column heights
    spanElements: string[];// Elements spanning all columns
  };
  
  typography: {
    bodyFontFamily: string;
    headingFontFamily: string;
    bodyFontSize: number;
    lineHeight: number;
    dropCap: boolean;
    dropCapLines: number;
    textAlign: 'left' | 'justify' | 'center';
    hyphenate: boolean;
  };
  
  page: {
    size: string;          // e.g., '5.5in 8.5in', 'letter'
    orientation: 'portrait' | 'landscape';
    margins: { top, bottom, inside, outside };
    bleed?: string;
  };
  
  chapter: {
    startOnRecto: boolean;
    dropFromTop: string;
    numberStyle: 'numeric' | 'roman' | 'word' | 'hidden';
    titleAlignment: 'left' | 'center' | 'right';
    ornament: string | null;
  };
  
  runningHeaders: {
    enabled: boolean;
    leftPage: { left, center, right };
    rightPage: { left, center, right };
    fontSize: number;
    fontStyle: 'normal' | 'italic' | 'small-caps';
  };
  
  pageNumbers: {
    enabled: boolean;
    position: 'bottom-center' | 'bottom-outside' | 'top-outside';
    style: 'arabic' | 'roman-lower' | 'roman-upper';
    firstPageHidden: boolean;
  };
  
  features: {
    footnotes: boolean;
    marginNotes: boolean;
    figures: boolean;
    tables: boolean;
    pullQuotes: boolean;
    sidebars: boolean;
  };
}
```

## CSS Paged Media Features

### @page Rules

```css
@page {
  size: 5.5in 8.5in;
  margin: 0.875in 0.625in 1in 0.875in;
}

@page :left {
  /* Left (verso) page styles */
  @top-left { content: "Author Name"; }
}

@page :right {
  /* Right (recto) page styles */
  @top-right { content: "Book Title"; }
}

@page chapter-start {
  /* Chapter opening page - no headers */
  @top-left { content: none; }
}
```

### Drop Caps

```css
.chapter-content > p:first-of-type::first-letter {
  float: left;
  font-family: "Cormorant Garamond", serif;
  font-size: 3.45em;
  line-height: 0.85;
  padding-right: 0.1em;
}
```

### Multi-Column Layout

```css
.chapter-content {
  column-count: 2;
  column-gap: 20pt;
  column-fill: balance;
}

h1, .figure-full {
  column-span: all;
}
```

### Footnotes

```css
@page {
  @footnote {
    float: bottom;
    border-top: 0.5pt solid #666;
    padding-top: 0.5em;
  }
}

.footnote {
  float: footnote;
  font-size: 0.85em;
}
```

## PDF Generation Cascade

The export service uses a cascade of PDF generation methods:

1. **HTML/CSS Paged Media** (Puppeteer) - Primary, best quality
2. **PDFKit** - Fallback, robust
3. **React-PDF** - Last resort

```typescript
// In export-service-advanced.ts
static async exportBookAsPDF(book: BookExport): Promise<Buffer> {
  // Method 1: HTML/CSS (best features)
  try {
    return await PDFHTMLService.generateBookPDF(book);
  } catch {
    // Method 2: PDFKit (robust)
    try {
      return await PDFServicePDFKit.generateBookPDF(book);
    } catch {
      // Method 3: React-PDF (fallback)
      return await this.generateReactPDF(book);
    }
  }
}
```

## Adding New Layouts

1. Add layout type to `BookLayoutType` in `lib/types/book-layouts.ts`
2. Add configuration to `BOOK_LAYOUTS` object
3. Add any layout-specific CSS to `css-paged-media.ts`

Example:

```typescript
// In book-layouts.ts
'newspaper': {
  id: 'newspaper',
  name: 'Newspaper Style',
  description: 'Multi-column newspaper layout',
  category: 'specialty',
  columns: {
    count: 3,
    gap: 12,
    balance: false,
    spanElements: ['h1', '.headline'],
  },
  // ... rest of config
}
```

## Browser/Print Preview

Generate preview HTML without PDF conversion:

```typescript
import { PDFHTMLService } from '@/lib/services/pdf-html-service';

const html = PDFHTMLService.generatePreviewHTML(bookData);
// Use in iframe or new window for print preview
```

## Dependencies

```json
{
  "puppeteer": "^21.0.0"  // HTML to PDF conversion
}
```

## Performance Notes

- Puppeteer browser instance is reused across requests
- Fonts are loaded via Google Fonts in the HTML
- Complex layouts (3-column, many figures) may take longer
- Target: <10s for typical novels, <30s for complex academic papers

## Troubleshooting

### PDF Generation Fails
- Check Puppeteer installation: `npm ls puppeteer`
- Ensure Chrome/Chromium is available
- Check server memory (Puppeteer needs ~100MB+)

### Fonts Not Rendering
- Google Fonts may be blocked in some environments
- Consider embedding fonts as base64 for offline use

### Layout Issues
- Verify layout ID exists in `BOOK_LAYOUTS`
- Check console for CSS generation errors
- Test HTML preview before PDF generation















