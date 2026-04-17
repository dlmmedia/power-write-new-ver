'use client';

import { useEffect } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SoundProvider } from '@/contexts/SoundContext';
import { UserTierProvider } from '@/contexts/UserTierContext';
// BooksProvider was previously here. It is now mounted per-segment in
// app/library/layout.tsx and app/studio/layout.tsx so that:
//   1) marketing / auth / showcase pages don't pay for a provider they
//      never read, and
//   2) the library segment can hydrate the provider with server-rendered
//      books, eliminating the first-paint fetch waterfall.
import { PWAProvider } from './PWAProvider';
import { PWALayout } from '@/components/layout/PWALayout';
import { GlobalUpgradeModal } from '@/components/modals/GlobalUpgradeModal';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';

export function Providers({ children }: { children: React.ReactNode }) {
  // Suppress Next.js 15+ async params/searchParams warnings in development
  // These are triggered by React DevTools inspecting Promise-based props
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const originalConsoleError = console.error;
      console.error = (...args: unknown[]) => {
        const message = args[0];
        if (
          typeof message === 'string' &&
          (message.includes('params') || message.includes('searchParams')) &&
          message.includes('Promise')
        ) {
          // Suppress async params/searchParams warnings from Next.js 15+
          return;
        }
        originalConsoleError.apply(console, args);
      };

      return () => {
        console.error = originalConsoleError;
      };
    }
  }, []);

  return (
    <ErrorBoundary>
      <PWAProvider>
        <ThemeProvider>
          <SoundProvider>
            <UserTierProvider>
              <PWALayout>{children}</PWALayout>
              <GlobalUpgradeModal />
            </UserTierProvider>
          </SoundProvider>
        </ThemeProvider>
      </PWAProvider>
    </ErrorBoundary>
  );
}
