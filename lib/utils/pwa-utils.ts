// PWA Utilities - Service Worker Registration and Install Prompt Management

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Type for update callback
export type UpdateCallback = (registration: ServiceWorkerRegistration) => void;

// Global store for update callbacks
let updateCallbacks: UpdateCallback[] = [];

// Register callback for service worker updates
export const onServiceWorkerUpdate = (callback: UpdateCallback) => {
  updateCallbacks.push(callback);
  return () => {
    updateCallbacks = updateCallbacks.filter(cb => cb !== callback);
  };
};

// Service Worker Registration with improved update handling
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none', // Always check for updates, don't use HTTP cache
    });

    console.log('[PWA] Service Worker registered:', registration.scope);

    // Check if there's already a waiting worker
    if (registration.waiting) {
      console.log('[PWA] Service worker already waiting');
      updateCallbacks.forEach(cb => cb(registration));
    }

    // Check for updates on registration
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('[PWA] New service worker installing...');
      
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          console.log('[PWA] New worker state:', newWorker.state);
          
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New service worker ready to activate
              console.log('[PWA] New version available');
              updateCallbacks.forEach(cb => cb(registration));
            } else {
              // First time install
              console.log('[PWA] Content cached for offline use');
            }
          }
        });
      }
    });

    // Listen for controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] Controller changed, reloading...');
      window.location.reload();
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('[PWA] Message from SW:', event.data);
      
      if (event.data?.type === 'SW_ACTIVATED') {
        console.log('[PWA] New service worker activated, version:', event.data.version);
      }
    });

    // Check for updates immediately and periodically
    registration.update();
    
    // Check for updates every 60 seconds
    setInterval(() => {
      console.log('[PWA] Checking for updates...');
      registration.update();
    }, 60 * 1000);

    return registration;
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
    return null;
  }
};

// Skip waiting and activate new service worker
export const skipWaitingAndReload = async (): Promise<void> => {
  const registration = await navigator.serviceWorker.getRegistration();
  
  if (registration?.waiting) {
    console.log('[PWA] Sending SKIP_WAITING message');
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  } else {
    // No waiting worker, just reload
    console.log('[PWA] No waiting worker, reloading directly');
    window.location.reload();
  }
};

// Force update - clear caches and reload
export const forceUpdate = async (): Promise<void> => {
  console.log('[PWA] Force update requested');
  
  const registration = await navigator.serviceWorker.getRegistration();
  
  if (registration?.active) {
    registration.active.postMessage({ type: 'FORCE_UPDATE' });
  }
  
  // Also clear caches from client side
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
  }
  
  // Unregister and re-register service worker
  if (registration) {
    await registration.unregister();
  }
  
  // Reload page
  window.location.reload();
};

// Unregister service worker (for development/testing)
export const unregisterServiceWorker = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const success = await registration.unregister();
      console.log('[PWA] Service Worker unregistered:', success);
      return success;
    }
    return false;
  } catch (error) {
    console.error('[PWA] Service Worker unregistration failed:', error);
    return false;
  }
};

// Check if app can be installed
export const canInstallPWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return false;
  }

  // Check if running as PWA
  if ((window.navigator as any).standalone === true) {
    return false;
  }

  return true;
};

// Check if app is already installed
export const isInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check display mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // Check iOS standalone mode
  if ((window.navigator as any).standalone === true) {
    return true;
  }

  return false;
};

// Get platform type
export const getPlatform = (): 'ios' | 'android' | 'desktop' | 'unknown' => {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  }
  
  if (/android/.test(userAgent)) {
    return 'android';
  }
  
  if (/windows|mac|linux/.test(userAgent)) {
    return 'desktop';
  }
  
  return 'unknown';
};

// Check if install prompt should be shown
export const shouldShowInstallPrompt = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Don't show if already installed
  if (isInstalled()) {
    console.log('[PWA] Not showing banner: App already installed');
    return false;
  }

  try {
    // Check if user dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed === 'true') {
      console.log('[PWA] Not showing banner: User dismissed');
      return false;
    }

    // Check if user chose "don't show again"
    const dontShowAgain = localStorage.getItem('pwa-install-dont-show');
    if (dontShowAgain === 'true') {
      console.log('[PWA] Not showing banner: User chose dont show again');
      return false;
    }

    // Check if prompt was shown in last 7 days
    const lastShown = localStorage.getItem('pwa-install-last-shown');
    if (lastShown) {
      const daysSinceShown = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
      if (daysSinceShown < 7) {
        console.log('[PWA] Not showing banner: Shown recently (', Math.round(daysSinceShown), 'days ago)');
        return false;
      }
    }
  } catch (error) {
    // localStorage might not be available (e.g., in some incognito modes)
    console.log('[PWA] localStorage access error (incognito?), showing banner anyway:', error);
    return true;
  }

  console.log('[PWA] Showing banner: All checks passed');
  return true;
};

// Mark install prompt as shown
export const markInstallPromptShown = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('pwa-install-last-shown', Date.now().toString());
  } catch (error) {
    console.log('[PWA] Could not save last-shown timestamp:', error);
  }
};

// Mark install prompt as dismissed
export const markInstallPromptDismissed = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('pwa-install-dismissed', 'true');
  } catch (error) {
    console.log('[PWA] Could not save dismissed preference:', error);
  }
};

// Mark install prompt as "don't show again"
export const markInstallPromptDontShow = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('pwa-install-dont-show', 'true');
  } catch (error) {
    console.log('[PWA] Could not save dont-show preference:', error);
  }
};

// Reset install prompt preferences (for testing)
export const resetInstallPromptPreferences = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('pwa-install-dismissed');
  localStorage.removeItem('pwa-install-dont-show');
  localStorage.removeItem('pwa-install-last-shown');
};

// Cache book for offline access
export const cacheBookForOffline = async (bookId: number, bookData: any) => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  if (registration.active) {
    registration.active.postMessage({
      type: 'CACHE_BOOK',
      bookId,
      bookData,
    });
  }
};

// Clear all caches
export const clearAllCaches = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return false;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[PWA] All caches cleared');
    return true;
  } catch (error) {
    console.error('[PWA] Failed to clear caches:', error);
    return false;
  }
};

// Clear book-related caches (useful after generating a new book)
export const clearBookCaches = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return false;
  }

  try {
    const cacheNames = await caches.keys();
    const bookCacheNames = cacheNames.filter(name => 
      name.includes('books') || name.includes('powerwrite-books')
    );
    await Promise.all(bookCacheNames.map(name => caches.delete(name)));
    console.log('[PWA] Book caches cleared');
    return true;
  } catch (error) {
    console.error('[PWA] Failed to clear book caches:', error);
    return false;
  }
};

// Get cache size (approximate)
export const getCacheSize = async (): Promise<number> => {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return 0;
  }

  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      
      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }

    return totalSize;
  } catch (error) {
    console.error('[PWA] Failed to calculate cache size:', error);
    return 0;
  }
};

// Format bytes to human readable
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Get service worker status
export const getServiceWorkerStatus = async (): Promise<{
  registered: boolean;
  active: boolean;
  waiting: boolean;
  installing: boolean;
}> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return { registered: false, active: false, waiting: false, installing: false };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return {
      registered: !!registration,
      active: !!registration?.active,
      waiting: !!registration?.waiting,
      installing: !!registration?.installing,
    };
  } catch (error) {
    console.error('[PWA] Failed to get SW status:', error);
    return { registered: false, active: false, waiting: false, installing: false };
  }
};
