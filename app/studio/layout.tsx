/**
 * Server Component layout for /studio.
 *
 * Studio uses BooksContext only for cache invalidation (`refreshBooks`,
 * `addBookToList`) after a book is generated — it never reads the books
 * list. So we mount the provider with no initial data; the legacy
 * client-side fetch path remains in place for any code that does eventually
 * call `useBooks()` here, but on /studio nothing actually does.
 *
 * Having a per-segment provider lets us keep BooksProvider out of the root
 * layout (which would otherwise mount it on every route, including
 * marketing/auth pages that don't need it).
 */
import type { ReactNode } from 'react';
import { BooksProvider } from '@/contexts/BooksContext';

export default function StudioLayout({ children }: { children: ReactNode }) {
  return <BooksProvider>{children}</BooksProvider>;
}
