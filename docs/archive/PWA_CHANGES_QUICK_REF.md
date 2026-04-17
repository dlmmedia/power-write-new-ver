# PWA System Changes - Quick Reference

## What Changed?

### 🔧 Service Worker Registration (PWAProvider.tsx)

**Before:**
```typescript
// Always registered for everyone
registerServiceWorker();
```

**After:**
```typescript
// Only register if app is installed as PWA
const isPWA = isInstalled();
if (isPWA) {
  registerServiceWorker();
} else {
  // Unregister for web users
  navigator.serviceWorker.getRegistration().then(reg => {
    if (reg) reg.unregister();
  });
}
```

### 🗄️ Service Worker Caching (sw.js)

**Before:**
```javascript
// Cached all book endpoints
if (url.pathname.includes('/books') || url.pathname.includes('/library')) {
  cache.put(request, responseClone);
}
```

**After:**
```javascript
// Only cache books list, NOT individual books
if (url.pathname === '/api/books' && request.method === 'GET') {
  cache.put(request, responseClone);
}
// Individual books (/api/books/[id]) are NOT cached
```

### 📚 Book Fetching (library/page.tsx)

**Before:**
```typescript
const response = await fetch(`/api/books?userId=${userId}`);
```

**After:**
```typescript
const timestamp = Date.now();
const response = await fetch(
  `/api/books?userId=${userId}&_t=${timestamp}`,
  {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' }
  }
);
```

### 📖 Individual Book Fetching (library/[id]/page.tsx)

**Before:**
```typescript
const response = await fetch(`/api/books/${bookId}`);
```

**After:**
```typescript
const timestamp = Date.now();
const response = await fetch(
  `/api/books/${bookId}?_t=${timestamp}`,
  {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' }
  }
);
```

### 🎯 After Book Generation (studio/page.tsx)

**Before:**
```typescript
if (data.success && data.book) {
  alert('Book generated successfully!');
  router.push('/library');
}
```

**After:**
```typescript
if (data.success && data.book) {
  // Clear book caches
  const cacheNames = await caches.keys();
  const bookCaches = cacheNames.filter(n => 
    n.includes('books') || n.includes('powerwrite-books')
  );
  await Promise.all(bookCaches.map(n => caches.delete(n)));
  
  alert('Book generated successfully!');
  router.push('/library');
}
```

### 💾 IndexedDB Caching (offline-cache.ts)

**Before:**
```typescript
async cacheBook(bookData: any) {
  await this.db.put('books', bookCache);
}
```

**After:**
```typescript
async cacheBook(bookData: any) {
  // Remove old version first
  const existing = await this.db.get('books', bookData.id);
  if (existing) {
    await this.db.delete('books', bookData.id);
  }
  await this.db.put('books', bookCache);
}
```

## Key Differences

| Aspect | Before | After |
|--------|--------|-------|
| **Service Worker** | Always active | Only for PWA |
| **Web Version** | Cached responses | Fresh data always |
| **PWA Version** | Full caching | Selective caching |
| **Book Details** | Cached | Never cached |
| **Books List** | Cached | Cached (offline only) |
| **After Generation** | No cache clear | Auto cache clear |
| **Cache Busting** | None | Timestamp + headers |

## Cache Strategy

### Web Users (Browser)
- ❌ No service worker
- ❌ No caching
- ✅ Fresh data every time
- ✅ Can still install PWA

### PWA Users (Installed)
- ✅ Service worker active
- ✅ Static assets cached
- ✅ Books list cached (offline)
- ❌ Book details NOT cached
- ✅ Auto cache clearing

## API Endpoints Caching

| Endpoint | Cached? | Why |
|----------|---------|-----|
| `/api/books` (GET) | Yes | Offline library list |
| `/api/books/[id]` | No | Always fresh data |
| `/api/books` (POST/PATCH/DELETE) | No | Mutations need fresh data |
| `/api/generate/*` | No | Never cache generation |

## Console Messages

### Web Version
```
✅ Running in browser - skipping service worker registration
✅ Unregistering service worker for web version
```

### PWA Version
```
✅ Running as PWA - registering service worker
✅ Service Worker registered
✅ [SW] Installing service worker...
✅ [SW] Activating service worker...
```

### After Book Generation
```
✅ Cleared book caches after generation
✅ Book caches cleared
```

## Files Changed Summary

1. ✅ `components/providers/PWAProvider.tsx` - Conditional SW registration
2. ✅ `public/sw.js` - Selective caching (v1 → v2)
3. ✅ `app/library/page.tsx` - Cache busting
4. ✅ `app/library/[id]/page.tsx` - Cache busting
5. ✅ `app/studio/page.tsx` - Auto cache clearing
6. ✅ `lib/services/offline-cache.ts` - Remove old cached versions
7. ✅ `lib/utils/pwa-utils.ts` - New clearBookCaches() function

## Testing Commands

```bash
# Start dev server
npm run dev

# Test web version
# Open http://localhost:3000 in browser
# Check console for "Running in browser"

# Test PWA version
# Install app, then launch
# Check console for "Running as PWA"

# Clear all caches (browser console)
caches.keys().then(names => names.forEach(n => caches.delete(n)))

# Unregister service worker (browser console)
navigator.serviceWorker.getRegistration().then(r => r?.unregister())
```

## Quick Fixes

### If old data still appears:
```javascript
// 1. Clear all caches
await caches.keys().then(names => 
  Promise.all(names.map(n => caches.delete(n)))
);

// 2. Unregister service worker
await navigator.serviceWorker.getRegistration()
  .then(r => r?.unregister());

// 3. Hard refresh
location.reload(true);
```

### If service worker won't unregister:
1. DevTools > Application > Service Workers
2. Click "Unregister" for each worker
3. Close all tabs
4. Reopen the app

### If PWA not working offline:
1. Make sure app is installed (not just browser)
2. Check DevTools > Application > Service Workers
3. Should see "Activated and running"
4. Check Cache Storage for `powerwrite-v2`

## Important Notes

⚠️ **Service worker only activates for installed PWA**
⚠️ **Web users never affected by caching**
⚠️ **All book fetches include cache busting**
⚠️ **Cache auto-clears after generation**
⚠️ **Cache version is now v2**

✅ **Web version = Fresh data always**
✅ **PWA version = Offline capable + Fresh data**
✅ **No more stale book data**
✅ **Proper separation of concerns**

