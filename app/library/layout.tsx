/**
 * Server Component layout for the /library segment (and its nested routes:
 * /library/[id], /library/series, /library/series/[id]).
 *
 * Loads the user's library on the server in a single batched DB call (see
 * `loadLibrary`) and seeds BooksContext with the result. This eliminates the
 * "HTML → Clerk hydrate → fetch /api/books → render" waterfall that the
 * library was suffering from previously.
 *
 * The proxy.ts middleware already redirects unauthenticated requests away
 * from /library before this layout runs, but we still null-check defensively
 * so the build doesn't crash and the UX degrades gracefully.
 */
import type { ReactNode } from 'react';
import { auth, currentUser } from '@clerk/nextjs/server';
import { BooksProvider } from '@/contexts/BooksContext';
import { loadLibrary, type LibraryBook } from '@/lib/services/library-loader';
import { createLogger } from '@/lib/log';

const log = createLogger('library/layout');

export default async function LibraryLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { userId } = await auth();

  // No user — let the client-side AuthGuard handle the redirect. The provider
  // is still mounted (without seed data) so any descendant that calls
  // useBooks() during the redirect doesn't crash.
  if (!userId) {
    return <BooksProvider>{children}</BooksProvider>;
  }

  let email: string | undefined;
  try {
    const u = await currentUser();
    email = u?.emailAddresses?.[0]?.emailAddress;
  } catch (err) {
    log.warn({ err }, 'currentUser() failed; falling back to clerk-id-only lookup');
  }

  let books: LibraryBook[] = [];
  let tier: 'free' | 'pro' = 'free';
  try {
    const result = await loadLibrary(userId, email);
    books = result.books;
    tier = result.tier;
  } catch (err) {
    // Don't crash the page on a transient DB hiccup — render with empty
    // hydration so the client provider can do its retry/refresh dance.
    log.error({ err, userId }, 'loadLibrary failed; rendering with empty hydration');
  }

  return (
    <BooksProvider initialBooks={books} initialTier={tier}>
      {children}
    </BooksProvider>
  );
}
