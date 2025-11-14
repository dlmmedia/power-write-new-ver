// PowerWrite Service Worker
// Handles caching, offline functionality, and background sync

const CACHE_VERSION = 'v1';
const CACHE_NAME = `powerwrite-${CACHE_VERSION}`;
const BOOKS_CACHE_NAME = `powerwrite-books-${CACHE_VERSION}`;
const MAX_BOOKS_CACHED = 10;

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/library',
  '/studio',
  '/landing',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
  '/offline.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
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
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Delete old caches
              return name.startsWith('powerwrite-') && name !== CACHE_NAME && name !== BOOKS_CACHE_NAME;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network first, then cache
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

  // API requests - network first, no cache for generation endpoints
  if (url.pathname.startsWith('/api/')) {
    // Don't cache generation endpoints
    if (url.pathname.includes('/generate/')) {
      return;
    }

    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful book/library API responses
          if (response.ok && (url.pathname.includes('/books') || url.pathname.includes('/library'))) {
            const responseClone = response.clone();
            caches.open(BOOKS_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if available
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - cache first, then network
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version and update in background
          fetch(request)
            .then((response) => {
              if (response.ok) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, response);
                });
              }
            })
            .catch(() => {/* Ignore network errors */});
          
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch((error) => {
            console.log('[SW] Fetch failed:', error);
            
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            
            throw error;
          });
      })
  );
});

// Message event - handle cache management from client
self.addEventListener('message', (event) => {
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
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// Background sync for failed requests (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-books') {
    event.waitUntil(
      // Implement sync logic here
      Promise.resolve()
    );
  }
});

console.log('[SW] Service worker loaded');

