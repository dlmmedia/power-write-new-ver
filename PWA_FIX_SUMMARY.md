# PWA System Fixes - Summary

## Issues Fixed

### 1. Web Version Defaulting to PWA Behavior
**Problem**: The service worker was being registered for ALL users (both web and PWA), causing the web version to behave like a PWA with caching issues.

**Solution**: 
- Modified `PWAProvider.tsx` to only register the service worker when the app is **actually installed as a PWA**
- Added detection using `isInstalled()` function that checks:
  - `window.matchMedia('(display-mode: standalone)')` for general PWA detection
  - `window.navigator.standalone` for iOS PWA detection
- If user is on the web version, the service worker is **unregistered** to ensure clean behavior
- This ensures web users get fresh data every time, while PWA users still get offline functionality

### 2. Old Books Showing Up Due to Cache
**Problem**: When generating a new book, sometimes old book data from cache would appear instead of the fresh data.

**Solution**: 
- **Service Worker Changes** (`public/sw.js`):
  - Changed to NOT cache individual book details (`/api/books/[id]`)
  - Changed to NOT cache any book mutations (non-GET requests)
  - Only caches the books list (`/api/books`) for offline library viewing
  - Completely skips caching for all generation endpoints (`/api/generate/*`)
  - Bumped cache version from `v1` to `v2` to force refresh

- **API Call Changes**:
  - Added cache busting to book list fetches in `app/library/page.tsx`:
    - Adds timestamp query parameter (`?_t=${timestamp}`)
    - Sets `cache: 'no-store'` option
    - Adds `Cache-Control: no-cache` header
  
  - Added cache busting to individual book fetches in `app/library/[id]/page.tsx`:
    - Same cache-busting approach as above
  
  - Added cache clearing after book generation in `app/studio/page.tsx`:
    - Clears all book-related caches after successful generation
    - Ensures fresh data when redirecting to library

- **IndexedDB Cache Changes** (`lib/services/offline-cache.ts`):
  - Modified `cacheBook()` to delete old cached version before storing new one
  - Prevents stale data from persisting in IndexedDB

- **Utility Functions** (`lib/utils/pwa-utils.ts`):
  - Added `clearBookCaches()` function to selectively clear book-related caches
  - Keeps existing `clearAllCaches()` for complete cache clearing

## Files Modified

1. **components/providers/PWAProvider.tsx**
   - Added conditional service worker registration
   - Only registers when app is installed as PWA
   - Unregisters for web users

2. **public/sw.js**
   - Updated cache version to v2
   - Removed caching for individual book endpoints
   - Only caches books list for offline viewing
   - Added comment indicating it's only for PWA mode

3. **app/library/page.tsx**
   - Added cache busting to `fetchBooks()` function
   - Timestamp query parameter + cache headers

4. **app/library/[id]/page.tsx**
   - Added cache busting to `fetchBookDetail()` function
   - Timestamp query parameter + cache headers

5. **app/studio/page.tsx**
   - Added cache clearing after successful book generation
   - Ensures fresh data when navigating to library

6. **lib/services/offline-cache.ts**
   - Modified `cacheBook()` to remove old cached versions
   - Prevents stale data in IndexedDB

7. **lib/utils/pwa-utils.ts**
   - Added `clearBookCaches()` utility function
   - Selective cache clearing for book-related data

## How It Works Now

### For Web Users (Browser)
1. Service worker is **NOT registered**
2. No caching of any kind (except browser's default behavior)
3. Every page load fetches fresh data from the server
4. Cache-busting headers ensure no stale data
5. Users can still install the PWA if they want

### For PWA Users (Installed App)
1. Service worker **IS registered**
2. Static assets are cached for offline use
3. Books list is cached for offline library viewing
4. Individual book details are **NOT cached** (always fresh from server)
5. Generation endpoints are never cached
6. Cache is automatically cleared after generating new books

## Testing

### Test Web Version
1. Open the app in a browser (not installed)
2. Check console: should see "Running in browser - skipping service worker registration"
3. Generate a book
4. Navigate to library - should see the new book immediately
5. Generate another book - should not see the old book's data

### Test PWA Version
1. Install the app as a PWA
2. Check console: should see "Running as PWA - registering service worker"
3. Go offline
4. Should still be able to view the library (cached list)
5. Individual book details will require network
6. Generate a book (requires network) - cache is cleared automatically

## Benefits

1. **Web users** get a clean, cache-free experience
2. **PWA users** get offline functionality without stale data issues
3. **No more old books** appearing during generation
4. **Fresh data** guaranteed for all book operations
5. **Proper separation** between web and PWA modes

## Important Notes

- The service worker only activates when the app is **installed as a PWA**
- Web users will never be affected by PWA caching
- Cache is automatically managed and cleared when needed
- All book data fetches include cache-busting to prevent stale data
- The system is now much more reliable and predictable

