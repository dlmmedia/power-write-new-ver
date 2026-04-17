import { auth, currentUser } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import { getDbUserIdFromClerk } from '@/lib/services/user-service';
import { loadBookDetail } from '@/lib/services/book-detail-loader';
import { createLogger } from '@/lib/log';
import BookDetailPageClient from './_components/BookDetailPageClient';

const log = createLogger('library/[id]/page');

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bookId = parseInt(id, 10);
  if (!Number.isFinite(bookId) || bookId <= 0) {
    notFound();
  }

  const { userId } = await auth();
  let clerkUserId: string | null = null;
  let effectiveUserId: string | null = null;
  if (userId) {
    clerkUserId = userId;
    let email: string | undefined;
    try {
      const u = await currentUser();
      email = u?.emailAddresses?.[0]?.emailAddress;
    } catch {
      // Best-effort email lookup; falls back to id-only resolution.
    }
    try {
      effectiveUserId = (await getDbUserIdFromClerk(userId, email)) ?? userId;
    } catch (err) {
      log.warn(
        { err, userId },
        'getDbUserIdFromClerk failed; using clerkUserId as effective id',
      );
      effectiveUserId = userId;
    }
  }

  let initialBook = null;
  try {
    initialBook = await loadBookDetail(bookId, { clerkUserId, effectiveUserId });
  } catch (err) {
    log.error(
      { err, bookId },
      'loadBookDetail failed; rendering with no initial data',
    );
  }

  if (!initialBook) {
    notFound();
  }

  return <BookDetailPageClient bookId={bookId} initialBook={initialBook} />;
}
