'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/utils/pwa-utils';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker for all users (both PWA and web)
    // This ensures everyone gets the latest version with proper cache management
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      console.log('[PWA] Registering service worker...');
      registerServiceWorker();
    }
  }, []);

  return <>{children}</>;
}



