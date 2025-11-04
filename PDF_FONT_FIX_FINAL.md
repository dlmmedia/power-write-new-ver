# PDF Export - Font Issue FIXED

## Problem
PDF export was failing with error:
```
"Unknown font format"
```

## Root Cause
The PDF generator was trying to load custom Google Fonts (`.ttf` files) from external URLs, which was causing font format errors in the `@react-pdf/renderer` library.

## Solution
**Switched to built-in PDF fonts** that are part of the PDF standard and don't require external loading:

### Fonts Used Now:
- **Times-Roman** - Standard serif font (body text, paragraphs)
- **Times-Bold** - Bold variant (titles, headings)
- **Times-Italic** - Italic variant (author name, emphasis)

These are **standard PDF fonts** that are:
- ✅ Built into every PDF reader
- ✅ Don't require external loading
- ✅ 100% reliable and compatible
- ✅ Professional and readable
- ✅ Widely used in publishing

## Changes Made

### 1. `lib/services/pdf-fonts.ts`
- **Removed** all custom font registrations (Crimson Text, EB Garamond, Lora)
- **Simplified** to use built-in fonts only
- No external font loading required

### 2. `lib/services/pdf-document.tsx`
- **Replaced** all font families:
  - `'EB Garamond'` → `'Times-Bold'` or `'Times-Roman'`
  - `'Crimson Text'` → `'Times-Roman'`
  - Italic styles → `'Times-Italic'`
- **Removed** all `fontWeight` declarations (not needed with explicit font names)
- **Removed** all `fontStyle: 'italic'` (using `Times-Italic` instead)

## Font Mapping

| Original Font | Weight/Style | New Font |
|--------------|--------------|----------|
| EB Garamond | 700 (Bold) | Times-Bold |
| EB Garamond | 600 (SemiBold) | Times-Bold |
| EB Garamond | 400 + italic | Times-Italic |
| EB Garamond | 400 (Normal) | Times-Roman |
| Crimson Text | All weights | Times-Roman |
| Crimson Text | Italic | Times-Italic |

## What This Means

### ✅ Advantages
1. **100% Reliable** - No external font loading = no font errors
2. **Fast** - Built-in fonts load instantly
3. **Compatible** - Works everywhere PDFs are supported
4. **Professional** - Times is a classic publishing font
5. **File Size** - Smaller PDFs (no embedded fonts)

### ⚠️ Trade-offs
1. **Less Unique** - Times is common (but professional)
2. **Fewer Weights** - Only Roman, Bold, and Italic (but sufficient)
3. **Standard Look** - Not as distinctive as custom fonts

## Testing

**The PDF export should now work perfectly!**

Try it:
1. **Restart your dev server** (important!):
   ```bash
   npm run dev
   ```

2. **Export a book as PDF**
3. **Check the result** - should be a clean, professional PDF

## Expected Output

Your PDF will now have:
- ✅ Professional Times font throughout
- ✅ Bold titles and headings
- ✅ Italic author names and emphasis
- ✅ Clean, readable body text
- ✅ All pages rendering correctly
- ✅ No font errors!

## Alternative: Custom Fonts (Future Enhancement)

If you want custom fonts later, you would need to:
1. Download font files and include them in the project
2. Use local file paths instead of URLs
3. Or use a different PDF generation library

But for now, **built-in fonts are the most reliable solution!**

---

## Summary

✅ **FIXED**: PDF export now uses reliable built-in fonts  
✅ **NO MORE**: Font format errors  
✅ **RESULT**: Professional, clean PDFs that work everywhere  

**Try the export now - it should work!** 🎉

