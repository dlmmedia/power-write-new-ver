# Cover Generation - Quick Start

## 🚀 5-Minute Integration

### Step 1: Add to Studio Page

```tsx
// app/studio/page.tsx or your book configuration page
import CoverGenerator from '@/components/studio/CoverGenerator';

// Inside your component, add the CoverGenerator
<CoverGenerator
  title="My Awesome Book"
  author="John Doe"
  genre="Fantasy"
  description="An epic tale of adventure..."
  targetAudience="adult"
  themes={["adventure", "magic"]}
  onCoverGenerated={(coverUrl, metadata) => {
    console.log("Cover generated:", coverUrl);
    // Save to your book state/database
  }}
/>
```

### Step 2: Update PDF Export

```tsx
// When exporting, pass the coverUrl
import { ExportService } from '@/lib/services/export-service';

const handleExport = async () => {
  await ExportService.exportBook({
    title: book.title,
    author: book.author,
    coverUrl: book.coverUrl,  // ← Add this
    chapters: book.chapters
  }, 'pdf');
};
```

### Step 3: Display in Library

Already done! The library page now shows covers automatically if `coverUrl` is present in the book data.

## ✅ That's It!

The system is ready to use. For advanced customization, see:
- **Full Guide**: `COVER_GENERATION_GUIDE.md`
- **Implementation Details**: `COVER_SYSTEM_SUMMARY.md`

## 🎨 Quick Test

```bash
# 1. Start the dev server
npm run dev --webpack

# 2. Navigate to /studio
# 3. Fill in book details
# 4. Look for the CoverGenerator component
# 5. Click "Generate Cover"
# 6. Watch the magic happen! ✨
```

## 💡 Tips

- **AI takes 20-60s**: Be patient!
- **Try different styles**: Each genre has smart defaults
- **Regenerate anytime**: No limits
- **Download covers**: Click download button after generation
- **Covers in PDF**: Automatic first page

## 🆘 Troubleshooting

**Cover generation fails?**
- Check OPENAI_API_KEY in .env.local
- Verify API has credits
- Try "Template" method as fallback

**Cover not in PDF?**
- Ensure coverUrl is passed to exportBook()
- Check console for errors
- Verify image URL is accessible

**Preview not showing?**
- Check browser console
- Verify image URL loads
- Try refreshing the page

## 📞 Need Help?

See detailed troubleshooting in `COVER_GENERATION_GUIDE.md` section "Troubleshooting"
