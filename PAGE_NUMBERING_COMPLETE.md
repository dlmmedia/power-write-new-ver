# Page Numbering - Complete Implementation

## Overview
PDF exports now have proper page numbering following standard book formatting conventions.

## Page Numbering System

### Front Matter (NO page numbers)
1. **Cover Page** - No page number
2. **Title Page** - No page number
3. **Copyright Page** - No page number
4. **Table of Contents** - No page number(s)

### Main Content (Page numbers start at 1)
- **Chapter Pages** - Start at page 1 and continue sequentially
- Page numbers appear at the **bottom center** of each chapter page
- Clean, professional typography

## How It Works

### Dynamic Calculation
The system automatically calculates where to start page numbering:
```typescript
const tocPages = Math.ceil(book.chapters.length / 25);
const frontMatterPages = 3 + tocPages;
```

- **Cover, Title, Copyright** = 3 pages
- **Table of Contents** = Dynamic (based on number of chapters)
- **First chapter page** = Page 1

### Page Number Formula
```typescript
const relativePageNumber = pageNumber - frontMatterPages;
return relativePageNumber > 0 ? `${relativePageNumber}` : '';
```

This ensures:
- Front matter pages show NO numbers
- First chapter page shows "1"
- Subsequent pages increment properly

## Example Structure

For a book with 10 chapters:

```
📄 Page (PDF)  | Page Number Shown | Content
---------------|-------------------|------------------
1              | (none)            | Cover
2              | (none)            | Title Page
3              | (none)            | Copyright
4              | (none)            | Table of Contents
5              | 1                 | Chapter 1
6              | 2                 | Chapter 1 (cont.)
7              | 3                 | Chapter 2
8              | 4                 | Chapter 2 (cont.)
...            | ...               | ...
```

## Table of Contents Page Numbers

The TOC shows chapter page numbers (1, 2, 3...) which correspond to the actual page numbers shown at the bottom of chapter pages.

Example TOC:
```
Table of Contents

Chapter 1: The Beginning ..................... 1
Chapter 2: The Journey ....................... 2
Chapter 3: The Destination ................... 3
```

## Visual Style

### Page Number Appearance
- **Position**: Bottom center of page
- **Font**: Times-Roman
- **Size**: 11pt
- **Color**: #666666 (medium gray)
- **Distance from bottom**: 40pt (0.56 inches)

### Styling
```typescript
pageNumber: {
  position: 'absolute',
  bottom: 40,
  left: 0,
  right: 0,
  textAlign: 'center',
  fontSize: 11,
  fontFamily: 'Times-Roman',
  color: '#666666',
}
```

## Standard Book Format

This follows **professional book publishing standards**:

✅ **Front matter has no page numbers** (or uses Roman numerals in traditional publishing)  
✅ **Main content starts at page 1** from the first chapter  
✅ **Sequential numbering** throughout all chapters  
✅ **Bottom center placement** is standard for novels and non-fiction  

## Testing

Export a book as PDF and verify:

1. ✅ Cover page - No page number
2. ✅ Title page - No page number  
3. ✅ Copyright page - No page number
4. ✅ Table of Contents - No page number
5. ✅ First chapter page - Shows "1"
6. ✅ Second chapter page - Shows "2"
7. ✅ Continues sequentially

## Benefits

- **Professional appearance** - Matches published books
- **Clean front matter** - No distracting numbers on cover/title pages
- **Easy navigation** - Readers can reference TOC page numbers
- **Automatic** - Works for any book length
- **Dynamic** - Adjusts for long TOCs automatically

## Future Enhancements (Optional)

If you want to add later:
- Roman numerals (i, ii, iii) for front matter
- Chapter name in page footer/header
- Different positioning (top corners, etc.)
- Alternating left/right positioning for print books

---

## Summary

✅ **DONE**: Professional page numbering system  
✅ **STANDARD**: Follows book publishing conventions  
✅ **CLEAN**: No numbers on front matter  
✅ **SEQUENTIAL**: Chapters start at page 1  

**Your PDFs now look like professionally published books!** 📚

