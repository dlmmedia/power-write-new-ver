# Restart Required

The Next.js configuration has been updated to fix PDF export compatibility with pdfkit.

## Steps to Apply the Fix:

1. **Stop the current dev server** (press Ctrl+C in the terminal where it's running)

2. **Restart the dev server:**
   ```bash
   npm run dev --webpack
   ```

3. **Test the PDF export:**
   - Navigate to a book in your library
   - Click "Export ▼" 
   - Select "Export as PDF"

## What Changed:

1. **next.config.ts** - Added webpack configuration to:
   - Externalize pdfkit for server-side rendering
   - Disable canvas dependency (not needed for basic PDF generation)

2. **export-service-advanced.ts** - Changed to use dynamic `require()` instead of ES6 import for pdfkit compatibility with Next.js

## If PDF Export Still Fails:

Check the terminal logs for the specific error message and share it. Common issues:

- Font loading errors (pdfkit uses built-in fonts, should work)
- Memory issues with large books (should be fine for normal-sized books)
- Missing dependencies (all should be installed already)
