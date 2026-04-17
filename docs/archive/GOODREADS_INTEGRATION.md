# Goodreads Integration

This document explains the Goodreads API integration that has been added to PowerWrite.

## Overview

The app now integrates with the Goodreads API (via RapidAPI) to fetch book data and cache it in **Vercel Edge Config** for fast global reads. This allows you to:
- Fetch books from Goodreads alongside Google Books
- Cache Goodreads books to avoid hitting API rate limits
- Search across both Google Books and cached Goodreads books
- Ultra-fast book lookups via Edge Config (no database queries needed)

## Architecture

### New Files Created

1. **`lib/services/goodreads.ts`** - Goodreads API service
   - Fetches books by ID
   - Searches for books
   - Transforms Goodreads data to match BookResult interface

2. **`lib/services/book-cache.ts`** - Book caching service
   - Saves books to database
   - Retrieves cached books
   - Searches cached books

3. **`app/api/books/seed/route.ts`** - Seeding endpoint
   - Seeds database with popular books from Goodreads
   - Provides cache status
   - Allows clearing cache

### Storage: Vercel Edge Config

Books are cached in **Vercel Edge Config** (not the database) for:
- ⚡ **Ultra-fast reads** - Sub-millisecond response times globally
- 🌍 **Global distribution** - Cached at the edge, close to users
- 💰 **Cost-effective** - No database load for read-heavy operations
- 🔄 **Easy updates** - Managed via Vercel API or dashboard

Edge Config structure:
```typescript
{
  "cached_books": {
    "books": BookResult[],  // Array of book objects
    "lastUpdated": "2025-10-29T..."
  }
}
```

## Setup

### 1. Configure Edge Config

Add your Edge Config connection string to `.env.local`:

```bash
EDGE_CONFIG=https://edge-config.vercel.com/ecfg_vrbccwwqmylae9vpbkcuvaldrmmg?token=YOUR_TOKEN
```

### 2. Fetch Books from Goodreads

The Goodreads API is rate-limited (~30 requests), so fetch books once and cache them in Edge Config.

**Step 1:** Start your dev server:

```bash
npm run dev --webpack
```

**Step 2:** Fetch books from Goodreads:

```bash
# Fetch default popular books (saves response to file)
curl -X POST http://localhost:3000/api/books/seed > books.json

# Or with custom limit
curl -X POST http://localhost:3000/api/books/seed \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}' > books.json
```

**Step 3:** Update Edge Config with fetched books:

```bash
# Get Vercel token from https://vercel.com/account/tokens
export VERCEL_TOKEN=your_vercel_token_here

# Update Edge Config with books data
npx tsx scripts/update-edge-config.ts books.json

# Or directly from API (one command)
npx tsx scripts/update-edge-config.ts --from-api
```

### 3. Verify Cache Status

```bash
# Check what's cached in Edge Config
curl http://localhost:3000/api/books/seed?action=status

# Response:
{
  "success": true,
  "totalBooks": 25,
  "goodreadsBooks": 25,
  "googleBooksBooks": 0,
  "lastUpdated": "2025-10-29T14:20:00.000Z"
}
```

## Usage

Once books are seeded, they'll automatically appear in search results alongside Google Books results.

### Book Search Flow

When users search for books:

1. **Google Books** - Fetches books from Google Books API
2. **Cached Goodreads** - Searches locally cached Goodreads books
3. **Combined Results** - Deduplicates and returns merged results

### Search Examples

```bash
# Search for "Harry Potter" - will return results from both sources
curl "http://localhost:3000/api/books/search?q=harry+potter"

# Category searches use Google Books only
curl "http://localhost:3000/api/books/search?category=bestsellers"
```

## API Endpoints

### `POST /api/books/seed`

Seeds the database with Goodreads books.

**Request body (optional):**
```json
{
  "bookIds": ["1", "2", "3"],  // Specific book IDs (optional)
  "limit": 30                  // Max books to fetch (optional)
}
```

**Response:**
```json
{
  "success": true,
  "message": "Seeded 25 books from Goodreads",
  "results": {
    "total": 25,
    "successful": 25,
    "failed": 0,
    "errors": []
  }
}
```

### `GET /api/books/seed?action=status`

Returns cache statistics.

### `GET /api/books/seed?action=clear`

Clears the entire book cache.

### `GET /api/books/search?q=query`

Searches both Google Books and cached Goodreads books.

## Popular Books Pre-configured

The seed endpoint includes these popular book IDs by default:

- Harry Potter series (IDs: 1-7)
- The Hobbit (11)
- Lord of the Rings series (18, 19)
- The Hunger Games (2657)
- The Midnight Library (7260188)
- Atomic Habits (40121378)
- 1984 (968)
- The Great Gatsby (4671)
- Pride and Prejudice (1885)
- And more...

## Rate Limiting

The Goodreads API (via RapidAPI) has limited requests. The integration includes:

- **Caching** - Books are stored locally to avoid repeat requests
- **Delay between requests** - 100ms delay between each book fetch during seeding
- **Deduplication** - Books are deduplicated by ID to avoid storage waste

## Troubleshooting

### "No books found in cache"

1. Fetch books: `curl -X POST http://localhost:3000/api/books/seed > books.json`
2. Update Edge Config: `VERCEL_TOKEN=xxx npx tsx scripts/update-edge-config.ts books.json`

### "EDGE_CONFIG not set"

Add to `.env.local`:
```
EDGE_CONFIG=https://edge-config.vercel.com/ecfg_xxx?token=xxx
```

### "API rate limit exceeded"

The Goodreads API has limited requests. If you hit the limit:
1. Wait for the rate limit to reset
2. Use cached books (they persist in the database)
3. Rely on Google Books for new searches

## Development Notes

- Books are stored in **Vercel Edge Config**, not the database
- Edge Config provides sub-millisecond global reads
- The Goodreads service uses the RapidAPI key in `lib/services/goodreads.ts`
- Book IDs are prefixed with `goodreads_` to distinguish from Google Books IDs
- The `source` field indicates "google_books" or "goodreads"
- Updates to Edge Config require Vercel API token

## Future Enhancements

Possible improvements:
- Add more book sources (Open Library, etc.)
- Implement smarter caching strategies (cache Google Books too)
- Add cache expiration/refresh logic
- UI to manually trigger seeding from admin panel
- Batch processing for large seed operations
