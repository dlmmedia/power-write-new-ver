'use client';

import * as React from 'react';
import { ClerkProvider } from '@clerk/nextjs';

/**
 * Thin wrapper around Clerk's `ClerkProvider`. Previously this component
 * disabled Clerk on `/render/*` pages used by the (now-deleted) video export
 * Puppeteer pipeline; that branch is gone, so this is essentially a passthrough
 * but we keep it as the single client-side mount point for Clerk so layout.tsx
 * can remain a server component.
 */
export function ConditionalClerkProvider({ children }: { children: React.ReactNode }) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
