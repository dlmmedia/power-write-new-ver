// PowerWrite Service Worker
// Handles caching, offline functionality, and background sync
// IMPORTANT: Service worker is now active for both PWA and web versions

// Build timestamp for automatic cache busting on deployment
// This gets updated during build process by scripts/update-sw-version.js
const BUILD_TIME = '1768468191125';
const CACHE_VERSION = `v3-${BUILD_TIME}`;
const CACHE_NAME = `powerwrite-${CACHE_VERSION}`;
const BOOKS_CACHE_NAME = `powerwrite-books-${CACHE_VERSION}`;
const MAX_BOOKS_CACHED = 10;

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
];

// Install event - cache static assets and skip waiting
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        // Cache assets that exist, ignore errors for missing ones
        return Promise.allSettled(
          STATIC_ASSETS.map(url => 
            cache.add(url).catch(err => console.log(`[SW] Failed to cache ${url}:`, err))
          )
        );
      })
      .then(() => {
        console.log('[SW] Installation complete, skipping waiting');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Delete ALL old powerwrite caches
              const isOldCache = name.startsWith('powerwrite-') && 
                                 name !== CACHE_NAME && 
                                 name !== BOOKS_CACHE_NAME;
              if (isOldCache) {
                console.log('[SW] Deleting old cache:', name);
              }
              return isOldCache;
            })
            .map((name) => caches.delete(name))
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
      .then(() => {
        // Notify all clients that the service worker has been updated
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SW_ACTIVATED',
              version: CACHE_VERSION
            });
          });
        });
      })
  );
});

// Fetch event - Network first for HTML, stale-while-revalidate for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip development hot reload
  if (url.pathname.includes('_next/webpack-hmr') || 
      url.pathname.includes('__nextjs') ||
      url.pathname.includes('_next/static/development')) {
    return;
  }

  // API requests - network only (no caching for API responses)
  if (url.pathname.startsWith('/api/')) {
    // Don't interfere with API requests at all
    return;
  }

  // Navigation requests (HTML pages) - Network first, fallback to cache, then offline page
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // No cache, return offline page
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }

  // Static assets (JS, CSS, images) - Network first with cache fallback
  // This ensures users always get fresh content while still having offline support
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return a generic fallback for images if not cached
          if (request.destination === 'image') {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#888">Offline</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
          throw new Error('Resource not cached and network unavailable');
        });
      })
  );
});

// Message event - handle cache management from client
self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data?.type);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting requested');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: CACHE_VERSION });
  }
  
  if (event.data && event.data.type === 'CACHE_BOOK') {
    const { bookId, bookData } = event.data;
    
    caches.open(BOOKS_CACHE_NAME).then((cache) => {
      // Store book data
      const bookUrl = `/api/books/${bookId}`;
      const response = new Response(JSON.stringify(bookData), {
        headers: { 'Content-Type': 'application/json' }
      });
      
      cache.put(bookUrl, response).then(() => {
        console.log(`[SW] Cached book ${bookId}`);
        
        // Manage cache size - keep only last 10 books
        cache.keys().then((keys) => {
          if (keys.length > MAX_BOOKS_CACHED) {
            const toDelete = keys.slice(0, keys.length - MAX_BOOKS_CACHED);
            toDelete.forEach((key) => cache.delete(key));
          }
        });
      });
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] Clearing all caches');
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
    }).then(() => {
      if (event.ports[0]) {
        event.ports[0].postMessage({ success: true });
      }
    });
  }
  
  if (event.data && event.data.type === 'FORCE_UPDATE') {
    console.log('[SW] Force update requested');
    // Clear all caches and skip waiting
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
    }).then(() => {
      self.skipWaiting();
    });
  }
});

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-books') {
    event.waitUntil(
      // Implement sync logic here
      Promise.resolve()
    );
  }
});

console.log('[SW] Service worker loaded, version:', CACHE_VERSION);
