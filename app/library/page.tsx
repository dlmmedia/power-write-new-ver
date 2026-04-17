/**
 * /library — Server Component shell.
 *
 * The full UI (filters, modals, mutations) lives in the client component
 * below. The data is loaded by `app/library/layout.tsx` and pushed into
 * BooksContext, so the first paint already has the books rendered without
 * any client-side fetch waterfall.
 */
import LibraryPageClient from './_components/LibraryPageClient';

export default function LibraryPage() {
  return <LibraryPageClient />;
}
