# Edge Config Quick Start

## What Changed?

Your book caching now uses **Vercel Edge Config** instead of the database for:
- ⚡ **10-100x faster reads** - Sub-millisecond globally
- 🌍 **Edge distribution** - Cached close to users worldwide  
- 💰 **Reduced costs** - No database load for book searches
- 🔄 **Simple management** - Update via API or Vercel dashboard

## How It Works

1. **Fetch books** from Goodreads API (~30 requests max)
2. **Store in Edge Config** (one-time setup)
3. **Read instantly** from edge network (no DB queries)

```
User Search → Edge Config (cached books) + Google Books API → Combined Results
              ↓ <1ms read time
```

## Setup (3 Steps)

### 1. Edge Config is Already Configured ✓

Your `.env.local` already has:
```bash
EDGE_CONFIG=https://edge-config.vercel.com/ecfg_vrbccwwqmylae9vpbkcuvaldrmmg?token=...
```

### 2. Fetch Books from Goodreads

Start dev server and fetch books:

```bash
npm run dev --webpack

# In another terminal:
curl -X POST http://localhost:3000/api/books/seed > books.json
```

This fetches ~30 popular books from Goodreads and saves the data.

### 3. Upload to Edge Config

Get a Vercel token from https://vercel.com/account/tokens, then:

```bash
export VERCEL_TOKEN=your_token_here
npx tsx scripts/update-edge-config.ts books.json
```

Done! Books are now cached globally.

## Usage

Books automatically appear in searches:

```bash
# Search across Google Books + cached Goodreads books
curl "http://localhost:3000/api/books/search?q=harry+potter"
```

## Check Status

```bash
curl "http://localhost:3000/api/books/seed?action=status"

# Returns:
{
  "totalBooks": 25,
  "goodreadsBooks": 25,
  "lastUpdated": "2025-10-29T..."
}
```

## Why Edge Config?

| Feature | Database | Edge Config |
|---------|----------|-------------|
| Read Speed | ~50-200ms | <1ms |
| Global Distribution | Single region | Worldwide |
| Database Load | High for searches | Zero |
| Cost | Per query | Flat rate |
| Best For | User data | Static/cache data |

Perfect for books that rarely change but are read frequently!

## Updating Books

To add more books later:

```bash
# Fetch new books
curl -X POST http://localhost:3000/api/books/seed \
  -H "Content-Type: application/json" \
  -d '{"bookIds": ["100", "101", "102"]}' > new-books.json

# Update Edge Config
VERCEL_TOKEN=xxx npx tsx scripts/update-edge-config.ts new-books.json
```

## Troubleshooting

**"No books in cache"**
→ Run step 2 & 3 above

**"VERCEL_TOKEN not set"**  
→ Get token: https://vercel.com/account/tokens

**"Rate limit exceeded"**
→ Goodreads API is limited. Use what's cached, no need to fetch again.

---

For full documentation, see `GOODREADS_INTEGRATION.md`
