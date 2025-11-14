'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/utils/pwa-utils';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker();
    }

    // Log PWA status
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      
      if (isStandalone || isIOSStandalone) {
        console.log('Running as PWA');
      } else {
        console.log('Running in browser');
      }
    }
  }, []);

  return <>{children}</>;
}

