'use client';

import * as React from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';

/**
 * Clerk can trigger redirects/session refresh on every page load.
 * For headless Puppeteer rendering (`/render/...`) we explicitly disable Clerk
 * to avoid auth redirects breaking screenshot capture.
 */
export function ConditionalClerkProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const disableClerk = pathname?.startsWith('/render/');

  if (disableClerk) return <>{children}</>;
  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  );
}

