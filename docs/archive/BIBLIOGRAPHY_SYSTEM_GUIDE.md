# Comprehensive Bibliography System Guide

## Overview

The bibliography system provides a complete reference management solution for non-fiction books, supporting multiple citation styles, reference types, and export formats. It follows academic standards and conventions from major research institutions.

## Features

### ✅ Supported Reference Types (20+)

1. **Books** - Complete book citations with publisher, edition, ISBN
2. **Journal Articles** - Academic journals with volume, issue, pages
3. **Websites** - Online sources with URLs and access dates
4. **Newspapers** - News articles with publication dates
5. **Magazines** - Magazine articles with issue information
6. **Conference Papers** - Conference proceedings and presentations
7. **Theses/Dissertations** - PhD, Masters, and other academic theses
8. **Reports** - Technical and research reports
9. **Patents** - Patent documents with filing information
10. **Videos** - YouTube, Vimeo, and other video sources
11. **Podcasts** - Podcast episodes with hosts and guests
12. **Interviews** - Personal, telephone, and email interviews
13. **Government Documents** - Official government publications
14. **Legal Documents** - Court cases and legal materials
15. **Software** - Software packages and applications
16. **Datasets** - Research datasets and data repositories
17. **Presentations** - Conference presentations and lectures
18. **Manuscripts** - Unpublished manuscripts
19. **Archival Materials** - Archive and special collections
20. **Personal Communications** - Emails, letters, conversations

### ✅ Citation Styles Supported

- **APA** (American Psychological Association) - 7th Edition
- **MLA** (Modern Language Association) - 9th Edition
- **Chicago** (Chicago Manual of Style) - 17th Edition
- **Harvard** - Harvard Referencing System
- **IEEE** (Institute of Electrical and Electronics Engineers)
- **Vancouver** - Vancouver System (Medical)
- **AMA** (American Medical Association)

### ✅ Reference Locations

- **In-text citations** - (Author, Year) style citations within text
- **Footnotes** - Citations at the bottom of each page
- **Endnotes** - Citations at the end of each chapter
- **Bibliography** - Complete reference list at book end

## System Architecture

### 1. Data Models (`lib/types/bibliography.ts`)

Complete TypeScript interfaces for:
- All 20+ reference types with specific fields
- Author information (first, middle, last names, suffixes, organizations)
- Citation configurations
- In-text citation metadata
- Chapter references tracking

### 2. Citation Service (`lib/services/citation-service.ts`)

Handles:
- Formatting references in all citation styles
- Author name formatting per style guidelines
- In-text citation generation
- Reference sorting and organization

### 3. Bibliography Store (`lib/store/bibliography-store.ts`)

Zustand-based state management:
- Reference CRUD operations
- Citation tracking
- Chapter-specific references
- Import/Export functionality (JSON, BibTeX, RIS)

### 4. Database Schema (`lib/db/schema.ts`)

Three new tables:
- `bibliography_references` - Stores all references
- `citations` - Tracks in-text citations
- `bibliography_configs` - Per-book configuration

### 5. UI Components

#### BibliographyManager (`components/library/BibliographyManager.tsx`)
- Main interface for managing references
- Search and filter capabilities
- Import/Export functionality
- Settings configuration

#### ReferenceEditor (`components/library/ReferenceEditor.tsx`)
- Form-based reference creation/editing
- Type-specific fields
- Validation and error handling

#### CitationInserter (`components/library/CitationInserter.tsx`)
- Insert citations while editing
- Search references
- Add page numbers and prefixes
- Live preview of citation format

#### BibliographySection (`components/library/BibliographySection.tsx`)
- Display bibliography at book end
- Chapter-end references
- Inline citations
- Configurable formatting

## Usage Guide

### 1. Enable Bibliography for a Book

```typescript
import { useBibliographyStore } from '@/lib/store/bibliography-store';

const { updateConfig } = useBibliographyStore();

updateConfig({
  enabled: true,
  citationStyle: 'APA',
  location: ['in-text', 'bibliography'],
  sortBy: 'author',
  sortDirection: 'asc',
});
```

### 2. Add a Reference

```typescript
import { createNewReference } from '@/lib/store/bibliography-store';
import { BookReference } from '@/lib/types/bibliography';

const newBook: BookReference = {
  ...createNewReference('book'),
  title: 'The Elements of Style',
  authors: [
    { firstName: 'William', lastName: 'Strunk', suffix: 'Jr.' },
    { firstName: 'E.B.', lastName: 'White' }
  ],
  year: 1999,
  publisher: 'Pearson',
  publisherLocation: 'New York, NY',
  edition: '4th ed.',
  isbn: '978-0205309023',
};

addReference(newBook);
```

### 3. Insert Citation in Text

```typescript
import { createNewCitation } from '@/lib/store/bibliography-store';

const citation = createNewCitation(referenceId, chapterId, position);
citation.pageNumber = '42';
citation.prefix = 'see';

addCitation(citation);
```

### 4. Display Bibliography

```tsx
import { BibliographySection } from '@/components/library/BibliographySection';

<BibliographySection
  references={references}
  config={config}
  title="References"
/>
```

### 5. Export with Bibliography

```typescript
import { ExportService } from '@/lib/services/export-service';

const bookData = {
  title: 'My Book',
  author: 'Author Name',
  chapters: [...],
  bibliography: {
    config: bibliographyConfig,
    references: allReferences,
    chapterReferences: chapterRefs,
  },
};

await ExportService.exportBook(bookData, 'pdf');
```

## Citation Style Examples

### APA Style
**In-text:** (Smith, 2020, p. 42)
**Bibliography:** Smith, J. (2020). *Book title*. Publisher.

### MLA Style
**In-text:** (Smith 42)
**Bibliography:** Smith, John. *Book Title*. Publisher, 2020.

### Chicago Style
**In-text:** <sup>1</sup>
**Footnote:** 1. John Smith, *Book Title* (City: Publisher, 2020), 42.

### Harvard Style
**In-text:** (Smith 2020, p. 42)
**Bibliography:** Smith, J. 2020. *Book title*. City: Publisher.

### IEEE Style
**In-text:** [1]
**Bibliography:** [1] J. Smith, *Book title*. City: Publisher, 2020.

## Import/Export Formats

### JSON Export
Complete bibliography data with all metadata:
```json
{
  "bookId": 1,
  "config": {...},
  "references": [...],
  "chapterReferences": [...]
}
```

### BibTeX Export
Standard BibTeX format for LaTeX:
```bibtex
@book{Smith2020,
  author = {John Smith},
  title = {Book Title},
  year = {2020},
  publisher = {Publisher},
  isbn = {978-1234567890}
}
```

### RIS Export
Research Information Systems format:
```
TY  - BOOK
AU  - Smith, John
TI  - Book Title
PY  - 2020
PB  - Publisher
SN  - 978-1234567890
ER  -
```

## Configuration Options

### Sort Options
- **By Author** - Alphabetical by last name
- **By Date** - Chronological order
- **By Title** - Alphabetical by title
- **By Type** - Grouped by reference type
- **By Appearance** - Order of first citation

### Display Options
- **Hanging Indent** - First line outdented
- **Line Spacing** - Single, 1.5, or double
- **Group by Type** - Separate sections per type
- **Numbering** - None, numeric, or alphabetic
- **Show DOI** - Display digital object identifiers
- **Show URL** - Display web addresses
- **Show Access Date** - For online sources

## Best Practices

### 1. Reference Entry
- Always include complete author information
- Use official publication titles
- Include DOI when available
- Record access dates for online sources
- Add notes for special circumstances

### 2. Citation Usage
- Cite sources as you write
- Use page numbers for direct quotes
- Add prefixes like "see" or "cf." when appropriate
- Keep citations consistent throughout

### 3. Bibliography Organization
- Choose one citation style and stick with it
- Sort references appropriately for your field
- Group by type for easier navigation
- Include all cited sources

### 4. Quality Control
- Verify all URLs are accessible
- Check publication dates and editions
- Ensure author names are spelled correctly
- Validate ISBN/ISSN numbers

## Database Schema

### bibliography_references
```sql
CREATE TABLE bibliography_references (
  id VARCHAR PRIMARY KEY,
  book_id INTEGER REFERENCES generated_books(id),
  type VARCHAR NOT NULL,
  title TEXT NOT NULL,
  authors JSONB NOT NULL,
  year INTEGER,
  publisher TEXT,
  url TEXT,
  doi TEXT,
  access_date VARCHAR,
  type_specific_data JSONB,
  notes TEXT,
  tags JSONB,
  citation_key VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### citations
```sql
CREATE TABLE citations (
  id VARCHAR PRIMARY KEY,
  reference_id VARCHAR REFERENCES bibliography_references(id),
  book_id INTEGER REFERENCES generated_books(id),
  chapter_id INTEGER REFERENCES book_chapters(id),
  position INTEGER NOT NULL,
  page_number VARCHAR,
  paragraph TEXT,
  quotation TEXT,
  prefix VARCHAR,
  suffix TEXT,
  suppress_author BOOLEAN,
  created_at TIMESTAMP
);
```

### bibliography_configs
```sql
CREATE TABLE bibliography_configs (
  id SERIAL PRIMARY KEY,
  book_id INTEGER UNIQUE REFERENCES generated_books(id),
  enabled BOOLEAN DEFAULT false,
  citation_style VARCHAR DEFAULT 'APA',
  location JSONB DEFAULT '["bibliography"]',
  sort_by VARCHAR DEFAULT 'author',
  sort_direction VARCHAR DEFAULT 'asc',
  hanging_indent BOOLEAN DEFAULT true,
  line_spacing VARCHAR DEFAULT 'single',
  group_by_type BOOLEAN DEFAULT false,
  numbering_style VARCHAR DEFAULT 'none',
  show_doi BOOLEAN DEFAULT true,
  show_url BOOLEAN DEFAULT true,
  show_access_date BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## API Integration

### Save References to Database
```typescript
// API endpoint: /api/books/[id]/bibliography/references
POST /api/books/1/bibliography/references
{
  "reference": {
    "type": "book",
    "title": "Book Title",
    "authors": [...],
    ...
  }
}
```

### Get Bibliography
```typescript
// API endpoint: /api/books/[id]/bibliography
GET /api/books/1/bibliography
```

### Update Configuration
```typescript
// API endpoint: /api/books/[id]/bibliography/config
PUT /api/books/1/bibliography/config
{
  "citationStyle": "MLA",
  "sortBy": "date",
  ...
}
```

## Keyboard Shortcuts (Planned)

- `Ctrl/Cmd + Shift + C` - Insert citation
- `Ctrl/Cmd + Shift + R` - Add new reference
- `Ctrl/Cmd + Shift + B` - Open bibliography manager

## Future Enhancements

1. **Auto-import from DOI** - Fetch reference data automatically
2. **Zotero Integration** - Import from Zotero library
3. **Mendeley Integration** - Sync with Mendeley
4. **Citation Network** - Visualize citation relationships
5. **Duplicate Detection** - Find and merge duplicate references
6. **Citation Suggestions** - AI-powered citation recommendations
7. **Reference Validation** - Check for completeness and accuracy
8. **Collaborative Editing** - Share bibliography with co-authors

## Troubleshooting

### Citations not appearing in PDF
- Ensure bibliography is enabled in config
- Check that references are properly linked to citations
- Verify citation style is set correctly

### References not sorting correctly
- Check sort configuration in settings
- Ensure author names are formatted properly
- Verify year fields are populated

### Import failing
- Validate JSON format
- Check for required fields
- Ensure IDs are unique

## Support

For issues or questions:
1. Check this documentation
2. Review example references in the system
3. Consult citation style guides
4. Contact support team

## Credits

Citation formatting based on official style guides:
- APA Publication Manual (7th ed.)
- MLA Handbook (9th ed.)
- Chicago Manual of Style (17th ed.)
- IEEE Editorial Style Manual
- National Library of Medicine (Vancouver)
- AMA Manual of Style (11th ed.)

---

**Version:** 1.0.0
**Last Updated:** November 2025
**Author:** PowerWrite Development Team



