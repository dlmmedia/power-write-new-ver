# PWA Fix - Testing Guide

## Quick Test Checklist

### ✅ Test 1: Web Version (Not Installed)

1. **Open in Browser** (not installed as PWA)
   ```
   Open: http://localhost:3000
   ```

2. **Check Console**
   - Should see: `"Running in browser - skipping service worker registration"`
   - Should NOT see: `"Running as PWA"`

3. **Generate First Book**
   - Go to Studio
   - Generate an outline
   - Generate the full book
   - Note the book ID

4. **Verify Fresh Data**
   - Go to Library
   - Should see the newly generated book
   - Click on the book to view details
   - All data should be fresh

5. **Generate Second Book**
   - Go back to Studio
   - Generate a different book
   - Go to Library
   - **VERIFY**: Should see the NEW book, not the old one
   - **VERIFY**: No cached data from previous book

### ✅ Test 2: PWA Version (Installed)

1. **Install as PWA**
   - In browser, look for install prompt
   - Or use browser menu: "Install PowerWrite"
   - Launch the installed app

2. **Check Console**
   - Should see: `"Running as PWA - registering service worker"`
   - Should see: `"Service Worker registered"`

3. **Test Online Functionality**
   - Generate a book
   - Go to Library
   - Should see fresh data
   - Click on book details
   - All data should be current

4. **Test Offline Functionality**
   - Go to Library while online
   - Open DevTools > Network tab
   - Set to "Offline" mode
   - Refresh the page
   - **VERIFY**: Library list should still work (cached)
   - **VERIFY**: Individual book details will need network

5. **Test Cache Clearing**
   - Go back online
   - Generate a new book
   - Check console: should see `"Cleared book caches after generation"`
   - Go to Library
   - **VERIFY**: New book appears immediately
   - **VERIFY**: No stale data

### ✅ Test 3: Cache Busting

1. **Check Network Requests**
   - Open DevTools > Network tab
   - Go to Library
   - Look at the `/api/books` request
   - **VERIFY**: URL includes `?userId=...&_t=<timestamp>`
   - **VERIFY**: Request headers include `Cache-Control: no-cache`

2. **Check Individual Book Requests**
   - Click on a book
   - Look at `/api/books/[id]` request
   - **VERIFY**: URL includes `?_t=<timestamp>`
   - **VERIFY**: Request headers include `Cache-Control: no-cache`

### ✅ Test 4: Service Worker Behavior

1. **Check Service Worker Registration**
   - Open DevTools > Application tab
   - Click "Service Workers" in sidebar
   - **For Web Users**: Should see no service worker or "Stopped"
   - **For PWA Users**: Should see "Activated and running"

2. **Check Cache Storage**
   - Open DevTools > Application tab
   - Click "Cache Storage" in sidebar
   - **For Web Users**: Should be empty or minimal
   - **For PWA Users**: Should see `powerwrite-v2` cache

3. **Verify Cache Contents**
   - For PWA users, open the cache
   - Should contain static assets (/, /library, /studio, etc.)
   - Should NOT contain `/api/books/[id]` endpoints
   - Should contain `/api/books` (list only)

## Expected Console Messages

### Web Version
```
Running in browser - skipping service worker registration
Unregistering service worker for web version
```

### PWA Version
```
Running as PWA - registering service worker
Service Worker registered: ServiceWorkerRegistration {...}
[SW] Installing service worker...
[SW] Caching static assets
[SW] Activating service worker...
```

### After Book Generation
```
Cleared book caches after generation
Book caches cleared
```

## Common Issues & Solutions

### Issue: Old book data still showing
**Solution**: 
1. Clear browser cache completely
2. Unregister service worker manually
3. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
4. Check that cache version is `v2` in sw.js

### Issue: Service worker not unregistering for web users
**Solution**:
1. Open DevTools > Application > Service Workers
2. Click "Unregister" manually
3. Refresh the page
4. Should now work correctly

### Issue: PWA not caching anything
**Solution**:
1. Make sure app is actually installed as PWA
2. Check console for service worker registration
3. Check Application > Cache Storage for `powerwrite-v2`
4. Verify network requests are being intercepted

## Manual Cache Clearing

If you need to manually clear caches for testing:

### Clear All Caches (DevTools)
```javascript
// In browser console
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
  console.log('All caches cleared');
});
```

### Clear Book Caches Only
```javascript
// In browser console
caches.keys().then(names => {
  const bookCaches = names.filter(n => n.includes('books'));
  bookCaches.forEach(name => caches.delete(name));
  console.log('Book caches cleared');
});
```

### Unregister Service Worker
```javascript
// In browser console
navigator.serviceWorker.getRegistration().then(reg => {
  if (reg) {
    reg.unregister();
    console.log('Service worker unregistered');
  }
});
```

## Success Criteria

✅ Web version does NOT register service worker
✅ PWA version DOES register service worker
✅ No old book data appears when generating new books
✅ All book fetches include cache-busting parameters
✅ Cache is cleared automatically after book generation
✅ PWA works offline for library list
✅ Individual book details always fetch fresh data
✅ No stale data in any scenario

## Notes

- The service worker cache version is now `v2`
- Web users should never see service worker messages
- PWA users should see offline functionality
- All book API calls include timestamps for cache busting
- Cache is automatically managed by the system

