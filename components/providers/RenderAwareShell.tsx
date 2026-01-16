'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Providers } from '@/components/providers/Providers';
import { MainNav } from '@/components/layout/MainNav';

/**
 * `/render/*` is a headless capture surface for Puppeteer.
 * Keep it minimal and avoid app chrome/providers that may trigger auth/redirects.
 */
export function RenderAwareShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRenderRoute = pathname?.startsWith('/render/');

  if (isRenderRoute) return <>{children}</>;

  return (
    <Providers>
      <MainNav />
      {children}
    </Providers>
  );
}

