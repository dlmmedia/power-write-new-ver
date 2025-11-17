'use client';

import { useEffect } from 'react';
import { registerServiceWorker, isInstalled } from '@/lib/utils/pwa-utils';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only register service worker if app is installed as PWA
    // This prevents the web version from being affected by PWA caching
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const isPWA = isInstalled();
      
      if (isPWA) {
        console.log('Running as PWA - registering service worker');
        registerServiceWorker();
      } else {
        console.log('Running in browser - skipping service worker registration');
        // Unregister any existing service worker for web users
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration) {
            console.log('Unregistering service worker for web version');
            registration.unregister();
          }
        });
      }
    }
  }, []);

  return <>{children}</>;
}



