# Book Categories Reference Guide

## Quick Overview

All 25 book categories are fully functional and fetch relevant books from the Google Books API.

## Category List

### Popular Categories (Quick Access)

These appear as tabs on desktop:

| Category | ID | Search Term | Description |
|----------|-------|-------------|-------------|
| 🏆 Bestsellers | `bestsellers` | Special query | Top-selling books across all genres |
| 🆕 New Releases | `new-releases` | Special query | Recently published books |
| 📚 Fiction | `fiction` | `fiction` | Fiction books |
| 📖 Non-Fiction | `non-fiction` | `nonfiction` | Non-fiction books |

### All Categories (Dropdown)

Available in the "All Categories" dropdown:

| Category | ID | Search Term | Description |
|----------|-------|-------------|-------------|
| 🔍 Mystery & Thriller | `mystery` | `mystery` | Mystery and thriller novels |
| 💕 Romance | `romance` | `romance` | Romance novels |
| 🚀 Science Fiction | `science-fiction` | `science fiction` | Sci-fi books |
| 🧙 Fantasy | `fantasy` | `fantasy` | Fantasy novels |
| 👻 Horror | `horror` | `horror` | Horror books |
| 👤 Biography | `biography` | `biography` | Biographies and memoirs |
| 🏛️ History | `history` | `history` | Historical books |
| 💪 Self-Help | `self-help` | `self-help` | Self-improvement books |
| 💼 Business | `business` | `business` | Business and economics |
| 💻 Technology | `technology` | `technology` | Technology books |
| 🔬 Science | `science` | `science` | Science books |
| 🍳 Cooking | `cooking` | `cooking` | Cookbooks and recipes |
| ✈️ Travel | `travel` | `travel` | Travel guides |
| 📝 Poetry | `poetry` | `poetry` | Poetry collections |
| 🎓 Young Adult | `young-adult` | `young adult` | YA books |
| 👶 Children | `children` | `children` | Children's books |
| 🎨 Graphic Novels | `graphic-novels` | `graphic novels` | Comics and graphic novels |
| 🏥 Health & Wellness | `health` | `health` | Health and wellness books |
| 🤔 Philosophy | `philosophy` | `philosophy` | Philosophy books |
| 🕊️ Religion & Spirituality | `religion` | `religion` | Religious and spiritual books |
| 🔪 True Crime | `true-crime` | `true crime` | True crime books |

## API Usage

### Endpoint

```
GET /api/books/search?category={category_id}
```

### Examples

```bash
# Fetch bestsellers
curl http://localhost:3000/api/books/search?category=bestsellers

# Fetch mystery books
curl http://localhost:3000/api/books/search?category=mystery

# Fetch science fiction
curl http://localhost:3000/api/books/search?category=science-fiction
```

### Response Format

```json
{
  "books": [
    {
      "id": "book_id",
      "title": "Book Title",
      "authors": ["Author Name"],
      "description": "Book description...",
      "publishedDate": "2024-01-01",
      "pageCount": 350,
      "categories": ["Fiction"],
      "imageLinks": {
        "thumbnail": "https://...",
        "small": "https://...",
        "medium": "https://...",
        "large": "https://...",
        "extraLarge": "https://..."
      },
      "averageRating": 4.5,
      "ratingsCount": 1234,
      "language": "en",
      "publisher": "Publisher Name",
      "isbn": "1234567890",
      "source": "google_books"
    }
  ]
}
```

## Book Sorting Algorithm

Each category returns books sorted by:

1. **Popularity Score** = (ratingsCount × averageRating)
2. **Recency Bonus** = (year - 2000) × weight
3. **Final Score** = Popularity + Recency Bonus

### Weights by Category

- **Bestsellers**: Heavy popularity weight, moderate recency (×10)
- **New Releases**: Heavy recency weight, moderate popularity
- **Genre Categories**: Balanced popularity and recency (×5)

## Adding New Categories

To add a new category:

1. **Add to frontend** (`app/page.tsx`):
```typescript
const categories = [
  // ... existing categories
  { id: 'new-category', label: '🎭 New Category' },
];
```

2. **Add to API mapping** (`app/api/books/search/route.ts`):
```typescript
const CATEGORY_TO_GENRE_MAP: Record<string, string> = {
  // ... existing mappings
  'new-category': 'new category search term',
};
```

3. **Test the category**:
```bash
node test-categories.js
```

## Performance

- **Cache**: Results are cached in the database for faster subsequent loads
- **Rate Limiting**: Small delays between API calls to avoid rate limits
- **Deduplication**: Books are deduplicated by ID
- **Image Filtering**: Only books with images are returned

## Troubleshooting

### Category Returns No Books

1. Check console logs: `[API] Fetching category 'mystery' as genre 'mystery'`
2. Verify the genre search term in `CATEGORY_TO_GENRE_MAP`
3. Try the Google Books API directly:
   ```
   https://www.googleapis.com/books/v1/volumes?q=subject:mystery&maxResults=40
   ```

### Books Have No Images

- The API automatically filters out books without images
- If a category returns few books, the genre might need a better search term

### Category Not Working

1. Check if it's in `CATEGORY_TO_GENRE_MAP`
2. Check browser console for errors
3. Check server logs for API errors
4. Run `node test-categories.js` to test all categories

## Best Practices

### For Users
- Use **Popular Categories** for quick browsing
- Use **All Categories** dropdown for specific genres
- Use **Search** for specific titles or authors

### For Developers
- Always add new categories to both frontend and API mapping
- Use descriptive search terms that match Google Books categories
- Test new categories with `test-categories.js`
- Keep category IDs lowercase with hyphens (kebab-case)

## Related Files

- `app/page.tsx` - Frontend category list and UI
- `app/api/books/search/route.ts` - API category mapping
- `lib/services/google-books.ts` - Google Books API integration
- `lib/store/book-store.ts` - Category state management
- `test-categories.js` - Category testing script

---

**Last Updated**: November 14, 2025
**Total Categories**: 25
**Status**: ✅ All working



