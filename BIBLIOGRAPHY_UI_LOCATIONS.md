# Bibliography System - UI Locations Guide

## 🎯 Where to Find Bibliography Features

The bibliography system is now fully integrated into the UI! Here's where you can access each feature:

## 1. 📝 Studio (Book Configuration)

**Location:** `/studio` page → **Bibliography** tab

### How to Access:
1. Go to the Studio page
2. Look at the left sidebar under "Configuration"
3. Click on **📚 Bibliography** tab (between "Characters & World" and "Advanced Settings")

### What You Can Do:
- ✅ Enable/Disable bibliography for your book
- ✅ Choose citation style (APA, MLA, Chicago, Harvard, IEEE, Vancouver, AMA)
- ✅ Select reference format (Footnotes, Endnotes, In-Text, Bibliography)
- ✅ Set source verification level
- ✅ View citation style guide
- ✅ See what features are available

### When to Use:
- **Before generating your book** - Configure bibliography settings
- **For non-fiction books** - Enable professional citations
- **Academic writing** - Choose appropriate citation style

---

## 2. 📚 Library (Book Detail Page)

**Location:** `/library/[id]` page → **📚 Bibliography** button

### How to Access:
1. Go to your Library
2. Click on any book to open its detail page
3. Look at the top-right header
4. Click the **📚 Bibliography** button

### What You Can Do:
- ✅ Add new references (20+ types supported)
- ✅ Edit existing references
- ✅ Delete references
- ✅ Search and filter references
- ✅ Import references (JSON format)
- ✅ Export references (JSON, BibTeX, RIS)
- ✅ Configure bibliography settings
- ✅ View formatted references

### When to Use:
- **After generating your book** - Add references to cite
- **While writing** - Manage your reference library
- **Before exporting** - Ensure all references are complete

---

## 3. ✏️ Book Editor (Citation Insertion)

**Location:** Book Editor → **📚 Cite** button in toolbar

### How to Access:
1. Open a book in the Library
2. Click **✏️ Edit** button
3. Look at the toolbar above the text editor
4. Click **📚 Cite** button

### What You Can Do:
- ✅ Insert citations while writing
- ✅ Search for references
- ✅ Add page numbers to citations
- ✅ Add prefixes/suffixes (e.g., "see", "cf.")
- ✅ Preview citation format
- ✅ Insert multiple citations

### When to Use:
- **While editing chapters** - Add citations to support your writing
- **For specific quotes** - Cite exact page numbers
- **Academic rigor** - Properly attribute sources

---

## 📖 Complete Workflow

### Step 1: Configure (Studio)
```
Studio → Bibliography Tab → Enable Bibliography → Choose Citation Style
```

### Step 2: Generate Book
```
Studio → Generate Outline → Generate Book
```

### Step 3: Add References (Library)
```
Library → Open Book → 📚 Bibliography → Add References
```

### Step 4: Insert Citations (Editor)
```
Library → Open Book → ✏️ Edit → 📚 Cite → Insert Citations
```

### Step 5: Export with Bibliography
```
Library → Open Book → Export → PDF (includes bibliography)
```

---

## 🎨 Visual Guide

### Studio Page
```
┌─────────────────────────────────────────┐
│ Studio                                   │
├─────────────┬───────────────────────────┤
│ Sidebar     │ Main Panel                │
│             │                           │
│ 📝 Basic    │                           │
│ 📖 Content  │                           │
│ ✍️ Style    │                           │
│ 🌍 Character│                           │
│ 📚 Bibliography ← NEW!                  │
│ ⚙️ Advanced │                           │
└─────────────┴───────────────────────────┘
```

### Library Book Detail Page
```
┌─────────────────────────────────────────┐
│ ← Library  PW  Book Title               │
│                                          │
│  📚 Bibliography  ✏️ Edit  📖 Read  Export│
│       ↑ NEW!                            │
├─────────────────────────────────────────┤
│ Book Content                            │
└─────────────────────────────────────────┘
```

### Book Editor
```
┌─────────────────────────────────────────┐
│ Editing: Book Title                     │
├─────────────────────────────────────────┤
│ B  I  U  " "  •••  ---  📚 Cite ← NEW! │
│                          ↑              │
├─────────────────────────────────────────┤
│ Chapter Content...                      │
└─────────────────────────────────────────┘
```

---

## 🚀 Quick Access Summary

| Feature | Location | Button/Tab |
|---------|----------|-----------|
| **Enable Bibliography** | Studio | 📚 Bibliography tab |
| **Manage References** | Library → Book Detail | 📚 Bibliography button |
| **Insert Citations** | Book Editor | 📚 Cite button |
| **Export with Bibliography** | Library → Book Detail | Export menu |

---

## 💡 Pro Tips

### 1. Enable Before Generating
✅ **Do:** Enable bibliography in Studio before generating your book
❌ **Don't:** Try to add bibliography after book is generated (you can, but it's easier to enable first)

### 2. Add References Early
✅ **Do:** Add your main references right after generating the book
❌ **Don't:** Wait until you're done writing to add references

### 3. Use Citation Keys
✅ **Do:** Add short citation keys (e.g., "Smith2020") for quick reference
❌ **Don't:** Rely only on searching by title

### 4. Export Regularly
✅ **Do:** Export your references as backup (JSON format)
❌ **Don't:** Lose all your references if something goes wrong

### 5. Check PDF Preview
✅ **Do:** Export to PDF to see how bibliography looks
❌ **Don't:** Assume it looks good without checking

---

## 🔍 Finding Features

### Can't Find Bibliography Tab in Studio?
- Make sure you're on the `/studio` page
- Look at the left sidebar
- It's between "Characters & World" and "Advanced Settings"
- Icon: 📚

### Can't Find Bibliography Button in Library?
- Make sure you've opened a specific book (not just the library list)
- Look at the top-right header area
- It's to the left of the "Edit" button
- Icon: 📚

### Can't Find Cite Button in Editor?
- Make sure you're in edit mode (clicked "Edit" button)
- Look at the toolbar above the text area
- It's after the formatting buttons (B, I, U, etc.)
- Icon: 📚

---

## 📱 Mobile/Responsive

The bibliography system works on all screen sizes:
- **Desktop:** Full features, side-by-side panels
- **Tablet:** Stacked panels, full functionality
- **Mobile:** Optimized for touch, scrollable modals

---

## 🆘 Troubleshooting

### "Bibliography tab not showing"
- **Solution:** Refresh the page, the tab should be there
- **Location:** Studio page, left sidebar, 6th item

### "Bibliography button not showing"
- **Solution:** Make sure the book has chapters generated
- **Location:** Library book detail page, top-right header

### "Cite button not showing"
- **Solution:** Make sure you're in edit mode and bibliography is enabled
- **Location:** Book editor toolbar

### "No references showing"
- **Solution:** You need to add references first via Bibliography Manager
- **Location:** Library → Book → 📚 Bibliography → Add Reference

---

## 📚 Documentation

For more detailed information:
- **Quick Start:** `BIBLIOGRAPHY_QUICKSTART.md`
- **Full Guide:** `BIBLIOGRAPHY_SYSTEM_GUIDE.md`
- **Implementation:** `BIBLIOGRAPHY_IMPLEMENTATION_SUMMARY.md`

---

**Last Updated:** November 2025
**Version:** 1.0.0
**Status:** ✅ Fully Integrated in UI

