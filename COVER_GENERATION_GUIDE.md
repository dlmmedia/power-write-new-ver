# Cover Generation System - Complete Guide

## Overview

PowerWrite now includes a world-class cover generation system that creates professional book covers using AI and template-based design. The system supports multiple generation methods and automatically includes covers in PDF exports.

## Architecture

### Components

1. **Type Definitions** (`lib/types/cover.ts`)
   - `CoverDesignOptions` - Cover style, colors, typography, layout
   - `CoverMetadata` - Generation metadata and tracking
   - `CoverGenerationRequest` - API request interface
   - `GENRE_COVER_DEFAULTS` - Genre-specific design presets
   - `COVER_DIMENSIONS` - Standard book dimensions (300 DPI)

2. **Cover Service** (`lib/services/cover-service.ts`)
   - AI prompt generation for DALL-E 3
   - Visual keyword extraction from descriptions
   - Design option management
   - HTML/CSS template generation for covers
   - Preview generation

3. **API Endpoint** (`app/api/generate/cover/route.ts`)
   - AI cover generation using DALL-E 3
   - Design option processing
   - Error handling and fallbacks
   - Integration with demo account system

4. **UI Component** (`components/studio/CoverGenerator.tsx`)
   - Interactive cover preview (flat and 3D mockup)
   - Design customization controls
   - Generation progress tracking
   - Cover download functionality

5. **Export Integration** (`lib/services/export-service.ts`)
   - Cover as first page in PDF exports
   - Cross-origin image handling
   - Format detection (PNG/JPEG)
   - Fallback to title page if no cover

6. **Database Schema** (`lib/db/schema.ts`)
   - `coverUrl` - Stores cover image URL
   - `coverMetadata` - Stores design options and generation data

## Generation Methods

### 1. AI Generated (DALL-E 3)
```typescript
{
  generationMethod: 'ai'
}
```
- Full AI image generation using OpenAI's DALL-E 3
- High-quality, unique, genre-appropriate imagery
- Portrait orientation (1024x1792px)
- HD quality with natural or vivid style options
- Best for: Photographic, illustrative, and abstract styles

### 2. Template-Based
```typescript
{
  generationMethod: 'template'
}
```
- Professional HTML/CSS templates
- Customizable typography and colors
- Genre-specific layouts
- No AI costs, instant generation
- Best for: Typographic and minimalist styles

### 3. Hybrid (Recommended)
```typescript
{
  generationMethod: 'hybrid'
}
```
- AI-generated background imagery
- Professional typography overlay
- Best of both worlds
- Consistently high-quality results
- Best for: Most genres and styles

## Design Options

### Cover Styles
- **Minimalist** - Clean, simple, lots of negative space
- **Illustrative** - Artistic, hand-drawn aesthetic
- **Photographic** - Realistic imagery, editorial look
- **Abstract** - Conceptual, symbolic elements
- **Typographic** - Typography as main visual element

### Color Schemes
- **Warm** - Browns, oranges, earth tones
- **Cool** - Blues, teals, cold colors
- **Monochrome** - Black, white, grays
- **Vibrant** - Bold, saturated colors
- **Pastel** - Soft, muted colors
- **Dark** - Deep blacks, dramatic contrast

### Typography Options
```typescript
{
  titleFont: 'serif' | 'sans-serif' | 'display' | 'script',
  authorFont: 'serif' | 'sans-serif',
  fontSize: 'small' | 'medium' | 'large',
  alignment: 'top' | 'center' | 'bottom'
}
```

### Layout Styles
- **Classic** - Traditional, symmetrical, decorative lines
- **Modern** - Clean, asymmetric, contemporary
- **Bold** - Strong typography, high contrast
- **Elegant** - Refined, sophisticated, subtle
- **Dramatic** - High impact, emotional

## Genre-Specific Presets

The system includes intelligent defaults for each genre:

| Genre | Style | Color Scheme | Typography |
|-------|-------|--------------|------------|
| Fantasy | Illustrative | Vibrant | Display + Serif |
| Science Fiction | Abstract | Cool | Sans-serif |
| Romance | Photographic | Pastel | Script + Serif |
| Thriller | Photographic | Dark | Sans-serif |
| Mystery | Abstract | Monochrome | Serif |
| Horror | Abstract | Dark | Display |
| Literary Fiction | Minimalist | Monochrome | Serif |
| Non-Fiction | Typographic | Vibrant | Sans-serif |
| Biography | Photographic | Warm | Serif |
| Self-Help | Minimalist | Vibrant | Sans-serif |
| Young Adult | Illustrative | Vibrant | Display |

## Usage

### In Studio Component

```tsx
import CoverGenerator from '@/components/studio/CoverGenerator';

<CoverGenerator
  bookId={book.id}
  title={book.title}
  author={book.author}
  genre={book.genre}
  description={book.description}
  targetAudience={book.targetAudience}
  themes={book.themes}
  currentCoverUrl={book.coverUrl}
  onCoverGenerated={(coverUrl, metadata) => {
    // Save to book state/database
    updateBook({ coverUrl, coverMetadata: metadata });
  }}
/>
```

### Programmatic Generation

```typescript
import { CoverService } from '@/lib/services/cover-service';

// Generate design options
const designOptions = CoverService.getDesignOptions({
  genre: 'Fantasy',
  designOptions: {
    style: 'illustrative',
    colorScheme: 'vibrant',
  }
});

// Generate AI prompt
const prompt = CoverService.generateAIPrompt(request, designOptions);

// Generate HTML cover template
const html = CoverService.buildCoverHTML(
  request,
  designOptions,
  backgroundImageUrl,
  'ebook'
);
```

### API Call

```typescript
const response = await fetch('/api/generate/cover', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'demo_user',
    title: 'The Dragon\'s Tale',
    author: 'Jane Smith',
    genre: 'Fantasy',
    description: 'An epic journey through magical realms...',
    targetAudience: 'young-adult',
    themes: ['adventure', 'magic', 'coming-of-age'],
    designOptions: {
      style: 'illustrative',
      colorScheme: 'vibrant',
      generationMethod: 'ai'
    }
  })
});

const data = await response.json();
// data.coverUrl contains the generated cover URL
```

### PDF Export with Cover

```typescript
import { ExportService } from '@/lib/services/export-service';

await ExportService.exportBook(
  {
    title: book.title,
    author: book.author,
    coverUrl: book.coverUrl, // Cover will be first page
    chapters: book.chapters
  },
  'pdf'
);
```

## Best Practices

### 1. Cover Generation Timing
- Generate cover **after** completing book outline
- Wait until title, author, and description are finalized
- Regenerate if book details change significantly

### 2. Design Selection
- Use genre defaults as starting point
- Adjust based on target audience
- Consider book's mood and themes
- Test multiple variations

### 3. AI Prompt Optimization
- The system automatically extracts visual keywords
- Detailed descriptions generate better covers
- Include setting, atmosphere, and key visual elements
- Avoid overly specific requests

### 4. Performance
- AI generation takes 20-60 seconds
- Template generation is instant
- Hybrid method takes 20-60 seconds
- Cache covers in database to avoid regeneration

### 5. Image Storage
- Store coverUrl in database
- Save coverMetadata for regeneration
- Use CDN for production deployments
- Implement image optimization/compression

## Cover Dimensions

All covers are generated at 300 DPI for print quality:

```typescript
const COVER_DIMENSIONS = {
  '6x9': { width: 1800, height: 2700 },      // Standard paperback
  '5x8': { width: 1500, height: 2400 },      // Small paperback
  '8.5x11': { width: 2550, height: 3300 },   // Textbook
  'ebook': { width: 1600, height: 2400 },    // eBook (default)
  'large': { width: 2100, height: 2800 },    // Large format
};
```

## Database Schema Updates

Run after implementing:

```bash
npm run db:push
```

This adds the `coverMetadata` field to `generatedBooks` table.

## Environment Variables

Required:
```env
OPENAI_API_KEY=sk-...
```

The system uses DALL-E 3 for AI generation. Ensure your OpenAI account has access to image generation.

## Error Handling

The system includes comprehensive error handling:

1. **AI Generation Fails**: Falls back to template method
2. **Invalid Parameters**: Returns validation error
3. **Image Load Fails**: PDF export continues without cover
4. **Network Issues**: User-friendly error messages
5. **CORS Issues**: Handled for external image URLs

## Troubleshooting

### Cover not appearing in PDF
- Check that `coverUrl` is set in book object
- Verify image URL is accessible
- Check browser console for CORS errors
- Ensure image format is PNG or JPEG

### AI generation failing
- Verify OPENAI_API_KEY is set
- Check API quota/billing
- Review error messages in console
- Try template method as fallback

### Design options not applying
- Ensure options match TypeScript types
- Check GENRE_COVER_DEFAULTS for valid values
- Verify API request body structure

### Cover quality issues
- Use 'ebook' or larger dimension presets
- Ensure original images are high resolution
- Avoid excessive compression
- Use HD quality setting for AI generation

## Future Enhancements

Potential additions:
1. **HTML-to-Image Conversion** - Server-side rendering with Puppeteer/Sharp
2. **Cover Editing** - Fine-tune generated covers
3. **Custom Templates** - User-uploadable templates
4. **A/B Testing** - Generate multiple variations
5. **Cover Analytics** - Track which designs perform best
6. **Spine Generation** - For print books with spine
7. **Back Cover** - Complete book cover system
8. **Template Library** - Pre-designed professional templates

## Cost Considerations

### DALL-E 3 Pricing (as of 2024)
- HD 1024x1792: ~$0.120 per image
- Budget accordingly for high-volume use
- Consider template method for cost savings
- Implement cover caching to avoid regeneration

## Credits

- AI Generation: OpenAI DALL-E 3
- Typography: Google Fonts (Playfair Display, Inter, Bebas Neue, Dancing Script)
- PDF Generation: jsPDF
- Image Processing: HTML5 Canvas API

---

## Quick Start Checklist

- [x] Type definitions created
- [x] Cover service implemented
- [x] API endpoint ready
- [x] UI component built
- [x] PDF integration complete
- [x] Database schema updated
- [x] Library view supports covers
- [ ] Run `npm run db:push` to update database
- [ ] Add CoverGenerator to studio workflow
- [ ] Test end-to-end cover generation
- [ ] Deploy and enjoy professional book covers!
