# Export System Testing Guide

## Quick Start Testing

### Prerequisites
1. Start the development server: `npm run dev --webpack`
2. Have at least one book with chapters in your library
3. Ensure the book has a cover image (or test without one for fallback behavior)

## Testing Steps

### 1. Test Book Detail Page Cover Display

**Steps:**
1. Navigate to `/library`
2. Click on any book to open the detail page
3. Look at the cover section on the left side

**Expected Results:**
- ✅ If book has `coverUrl`: Displays the actual cover image
- ✅ If no `coverUrl`: Shows gradient placeholder with book emoji

**Screenshot Location:** Top-left of Overview tab

---

### 2. Test PDF Export (export-service.ts)

**Steps:**
1. From book detail page, click "Export ▼"
2. Select "Export as PDF"
3. Open downloaded PDF

**Expected Results:**
- ✅ **Page 1 (Cover):** 
  - If book has cover image: Full-page cover image
  - If no cover: Text-based title page centered
  - NO page number on cover
- ✅ **Page 2+:**
  - Page numbers centered at bottom (starting from page 1)
  - Gray color (subtle)
- ✅ **Chapter Pages:**
  - Chapter heading: "Chapter X: Title" (only once)
  - Chapter content: No duplicate title at the start
  - Proper formatting and line breaks

**Test Cases:**
- [ ] PDF with cover image
- [ ] PDF without cover image
- [ ] PDF with 1 chapter
- [ ] PDF with multiple chapters (5+)
- [ ] PDF with long content (triggers page breaks)

---

### 3. Test DOCX Export

**Steps:**
1. From book detail page, click "Export ▼"
2. Select "Export as DOCX"
3. Open downloaded DOCX in Microsoft Word or Google Docs

**Expected Results:**
- ✅ **Page Numbers:** In footer, centered on all pages
- ✅ **Chapter Titles:** Only appear once (not duplicated in content)
- ✅ **Table of Contents:** All chapters listed
- ✅ **Legal Page:** PowerWrite branding and copyright info
- ✅ **Formatting:** Justified text, proper spacing

**Test Cases:**
- [ ] DOCX with multiple chapters
- [ ] Open in Microsoft Word
- [ ] Open in Google Docs
- [ ] Verify no duplicate chapter titles

---

### 4. Test HTML Export

**Steps:**
1. From book detail page, click "Export ▼"
2. Select "Export as HTML"
3. Open downloaded HTML in browser

**Expected Results:**
- ✅ **Cover Image:** Displayed at top if book has coverUrl
- ✅ **Styling:** Professional typography (Georgia serif)
- ✅ **Chapter Titles:** Only appear once
- ✅ **Content:** Properly formatted with justified text
- ✅ **Print Preview:** Page numbers visible in print mode (Ctrl/Cmd + P)

**Test Cases:**
- [ ] HTML with cover image
- [ ] HTML without cover image
- [ ] Print preview (Ctrl/Cmd + P)
- [ ] Responsive on mobile/tablet

---

### 5. Test Markdown Export

**Steps:**
1. From book detail page, click "Export ▼"
2. Select "Export as Markdown"
3. Open downloaded .md file in markdown editor

**Expected Results:**
- ✅ **Title:** H1 heading
- ✅ **Author:** H3 heading
- ✅ **Chapters:** H2 headings ("## Chapter X: Title")
- ✅ **Content:** No duplicate chapter titles
- ✅ **Formatting:** Valid markdown syntax

**Test Cases:**
- [ ] View in VSCode
- [ ] View in GitHub (if applicable)
- [ ] View in Notion or other markdown editor

---

### 6. Test TXT Export

**Steps:**
1. From book detail page, click "Export ▼"
2. Select "Export as TXT"
3. Open downloaded .txt file in text editor

**Expected Results:**
- ✅ **Title & Author:** At top with separator line
- ✅ **Chapters:** Clearly separated with lines
- ✅ **Content:** No duplicate chapter titles
- ✅ **Formatting:** Readable plain text

**Test Cases:**
- [ ] View in Notepad/TextEdit
- [ ] Check line breaks and separators
- [ ] Verify readability

---

## Edge Cases to Test

### Duplicate Title Patterns

Test with chapters that have these title patterns:
1. Chapter content starting with: "Chapter 1: The Beginning"
2. Chapter content starting with: "Chapter 1 The Beginning"
3. Chapter content starting with: "The Beginning"
4. Chapter content starting with: "Chapter 1:\n\nThe Beginning"

**Expected:** All patterns should be removed, content should start cleanly.

### Long Content

1. **Single Long Chapter** (50,000+ words)
   - ✅ Page numbers continue across all pages
   - ✅ No page number on cover
   - ✅ Content flows naturally

2. **Many Short Chapters** (20+ chapters)
   - ✅ Each chapter starts on new page
   - ✅ Page numbers increment correctly
   - ✅ Table of contents accurate (DOCX)

### Special Characters in Titles

Test with titles containing:
- Quotes: "Chapter 1: The "Final" Chapter"
- Apostrophes: "Chapter 1: Hero's Journey"
- Colons: "Chapter 1: Time: Past and Present"
- Special chars: "Chapter 1: Émigré's Tale"

**Expected:** Sanitization should handle special characters correctly.

---

## Troubleshooting

### Issue: Duplicate titles still appearing

**Check:**
1. Is the title exactly matching one of the 4 patterns?
2. Are there extra spaces or newlines?
3. Check browser console for sanitization logs

**Solution:** The regex patterns may need adjustment for specific edge cases.

---

### Issue: Page numbers not showing

**Check:**
1. Which export service is being used? (Check export API logs)
2. Is `pageNumber` variable incrementing?
3. Are margins sufficient?

**Solution:** Verify PDF generation flow and margin calculations.

---

### Issue: Cover image not displaying

**Check:**
1. Does book have `coverUrl` in database?
2. Check API response: `/api/books/[id]`
3. Check browser console for image load errors
4. Check CORS policy for image URL

**Solution:** 
- Ensure `coverUrl` is stored in DB
- Verify image URL is accessible
- Check for CORS issues

---

## Verification Checklist

Use this checklist after making changes:

- [ ] All export formats tested (PDF, DOCX, HTML, MD, TXT)
- [ ] No duplicate chapter titles in any format
- [ ] Page numbers appear in PDFs (export-service.ts)
- [ ] Page numbers don't appear on cover page
- [ ] Cover images display in HTML exports
- [ ] Cover images display in jsPDF exports
- [ ] Book detail page shows cover images
- [ ] Fallback placeholder works when no cover
- [ ] Special characters handled correctly
- [ ] Long content (30+ pages) works correctly
- [ ] Short content (1-2 chapters) works correctly
- [ ] Export API passes coverUrl correctly
- [ ] Database schema includes coverUrl field
- [ ] No console errors during export
- [ ] File downloads successfully
- [ ] File opens in appropriate software

---

## Automated Testing Commands

While there are no automated tests yet, here are commands for verification:

```bash
# Run the development server
npm run dev --webpack

# Check for TypeScript errors
npm run build --webpack

# Run linter (note: pre-existing errors are normal)
npm run lint

# Check database schema
npm run db:studio
```

---

## Report Issues

If you encounter any issues:

1. **Check Console:** Browser console and terminal logs
2. **Verify Data:** Use Drizzle Studio (`npm run db:studio`) to check book data
3. **Test Isolation:** Test with a simple 1-chapter book first
4. **Document:** Note exact steps to reproduce
5. **Compare:** Test with both `export-service.ts` and `export-service-advanced.ts`

---

## Success Indicators

Your export system is working correctly when:

✅ Users can download all 5 formats without errors  
✅ PDFs have page numbers on all pages except cover  
✅ No duplicate chapter titles in any export  
✅ Cover images display correctly when available  
✅ Fallback UI works when cover images are missing  
✅ Special characters and long content are handled gracefully  
✅ All exports are professionally formatted  
✅ File sizes are reasonable (not bloated)  

---

## Next Steps

After testing:

1. **Production Deploy:** Push changes to production
2. **User Feedback:** Monitor for user reports
3. **Analytics:** Track export usage by format
4. **Optimization:** Consider image compression for covers
5. **Enhancement:** Implement DOCX cover image support
6. **Documentation:** Update user-facing docs with new features
