# Auto-Populate Feature Documentation

## Overview

The Auto-Populate feature allows users to automatically generate sample book configurations in the Studio based on selected reference books. When a user selects a reference book, the system intelligently analyzes the book's metadata and generates appropriate sample values for title, description, genre, themes, writing style, target audience, and more.

## Features

### 1. Reference Book Selection
- Users can select one or more reference books from the Browse Books page
- Selected books appear in the Studio with a dedicated selector dropdown
- The dropdown shows book titles and authors for easy identification

### 2. Auto-Population
- **Sample Title Generation**: Creates genre-appropriate sample titles
  - Fantasy: "Realm of Shadows", "The Dragon's Legacy", etc.
  - Science Fiction: "The Quantum Paradox", "Stellar Convergence", etc.
  - Mystery: "The Hidden Truth", "Shadow of Doubt", etc.
  - Romance: "Hearts Entwined", "A Second Chance", etc.
  - Thriller: "The Final Hour", "Point of No Return", etc.

- **Sample Description**: Generates engaging book descriptions based on:
  - Reference book's genre
  - Extracted themes
  - Reference book's title (for inspiration)

- **Genre Mapping**: Automatically maps reference book genres to studio options:
  - Fiction, Fantasy, Science Fiction, Romance, Thriller, Mystery, Horror
  - Historical Fiction, Contemporary, Young Adult, Literary Fiction
  - Biography, Memoir, Self-Help, Business, Non-Fiction

- **Writing Style Inference**: Sets appropriate writing style based on genre:
  - Academic/Business → Formal, serious tone
  - Fantasy → Poetic, descriptive
  - Romance → Conversational, light-hearted
  - Thriller/Mystery → Casual, dark/serious tone

- **Target Audience**: Automatically determines:
  - Children (ages 8-12, elementary level)
  - Young Adult (ages 13-18, high school level)
  - Adult (general audience)
  - Academic/Professional (college level)

- **Content Settings**: Calculates based on reference book:
  - Word Count: ~250 words per page from reference book
  - Number of Chapters: ~25 pages per chapter
  - Themes: Extracted from categories and metadata

- **Setting & World-Building**:
  - Historical fiction → Historical time period
  - Science Fiction → Future time period
  - Fantasy → Fantasy setting with fictional location
  - Contemporary → Contemporary, real-world setting

## User Flow

1. **Select Reference Books**
   - User browses books on the home page
   - Clicks checkboxes to select books they want to use as references
   - Selected books appear in bottom panel

2. **Navigate to Studio**
   - Click "Generate Book" button in the bottom panel
   - Or navigate directly to Studio from the header

3. **Choose Reference Book**
   - In Studio, a new section appears: "🎯 Auto-Populate From:"
   - Select a reference book from the dropdown
   - Only visible when reference books are selected

4. **Auto-Populate**
   - Click the "✨ Auto-Populate" button
   - System generates configuration based on selected reference book
   - Success banner appears confirming the action

5. **Review & Customize**
   - All fields are populated with sample data
   - Review the "Basic Info" tab for title, author, genre
   - Check "Content Settings" for description, word count, chapters
   - Visit "Style Preferences" to see writing style settings
   - Manually edit any field as needed

6. **Generate Outline & Book**
   - Click "Generate Outline" to create chapter structure
   - Review and edit the outline
   - Click "Generate Book" to create the full manuscript

## Technical Implementation

### Files Created/Modified

1. **`lib/utils/auto-populate.ts`** (New)
   - Core auto-population logic
   - Functions for title generation, description creation, genre mapping
   - Writing style and audience inference
   - Main `autoPopulateFromBook()` function

2. **`app/studio/page.tsx`** (Modified)
   - Added reference book selector dropdown
   - Added auto-populate button and handler
   - Added success banner for user feedback
   - Integration with store for config updates

### Key Functions

```typescript
// Generate sample title based on genre
generateSampleTitle(referenceBook: SelectedBook): string

// Generate sample description
generateSampleDescription(referenceBook: SelectedBook): string

// Map genre from reference book to studio options
mapGenre(referenceBook: SelectedBook): string

// Infer writing style from book metadata
inferWritingStyle(referenceBook: SelectedBook): WritingStyle

// Determine target audience
inferAudience(referenceBook: SelectedBook): Audience

// Main auto-populate function
autoPopulateFromBook(
  referenceBook: SelectedBook,
  currentConfig: BookConfiguration,
  authorName: string
): BookConfiguration
```

## User Benefits

1. **Saves Time**: No need to manually fill in all configuration fields
2. **Smart Defaults**: System provides intelligent, genre-appropriate suggestions
3. **Inspiration**: Sample titles and descriptions provide creative starting points
4. **Consistency**: Settings match the style of reference books
5. **Flexibility**: All auto-populated fields can be manually edited
6. **Learning Tool**: Users can see what configurations work for different genres

## Future Enhancements

- **Multiple Book Analysis**: Analyze multiple reference books to create blended styles
- **AI-Powered Analysis**: Use LLM to analyze actual book content for deeper insights
- **Custom Templates**: Save user's favorite configurations as templates
- **Preview Mode**: Show what will be populated before confirming
- **Undo Feature**: Allow reverting to previous configuration
- **Smart Suggestions**: Suggest similar books based on current configuration

## Example Usage

### Example 1: Fantasy Novel
**Reference Book**: "Harry Potter and the Sorcerer's Stone"

**Auto-Populated Values**:
- Title: "Realm of Shadows"
- Genre: Fantasy
- Writing Style: Poetic, Descriptive
- POV: Third-person Limited
- Target Audience: Young Adult (13-18)
- Word Count: ~75,000 (based on ~300 pages)
- Chapters: 12
- Setting: Fantasy world, Fictional location

### Example 2: Thriller
**Reference Book**: "The Girl with the Dragon Tattoo"

**Auto-Populated Values**:
- Title: "The Final Hour"
- Genre: Thriller
- Writing Style: Casual, Dark tone
- POV: Third-person Limited
- Tense: Present
- Target Audience: Adult
- Word Count: ~120,000 (based on ~480 pages)
- Chapters: 20
- Setting: Contemporary, Real-world

### Example 3: Romance
**Reference Book**: "Pride and Prejudice"

**Auto-Populated Values**:
- Title: "Hearts Entwined"
- Genre: Romance
- Writing Style: Conversational, Light-hearted
- POV: First-person
- Target Audience: Adult
- Word Count: ~80,000 (based on ~320 pages)
- Chapters: 15
- Setting: Historical or Contemporary

## Troubleshooting

### No Auto-Populate Button Visible
- **Solution**: Make sure you've selected at least one reference book from the Browse Books page

### Auto-Populate Not Working
- **Solution**: Ensure a reference book is selected in the dropdown before clicking the button

### Want to Change Auto-Populated Values
- **Solution**: Simply edit any field manually after auto-population

### Lost Auto-Populated Configuration
- **Solution**: Configuration is saved in browser storage. Click auto-populate again to regenerate.

## Support

For issues or feature requests related to the auto-populate feature, please:
1. Check this documentation first
2. Review the browser console for any error messages
3. Try selecting a different reference book
4. Clear browser cache and try again
