'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { PWAProvider } from './PWAProvider';
import { PWALayout } from '@/components/layout/PWALayout';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PWAProvider>
      <ThemeProvider>
        <PWALayout>{children}</PWALayout>
      </ThemeProvider>
    </PWAProvider>
  );
}
