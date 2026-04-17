/**
 * Find a chapter in the live DB that already has audio generated, so we
 * can test the queue's idempotency path WITHOUT calling TTS or mutating
 * the chapter row.
 *
 * Usage:
 *   dotenv -e .env.local -- tsx scripts/find-audio-chapter.ts
 */
import { db } from '../lib/db/index';
import { bookChapters } from '../lib/db/schema';
import { isNotNull } from 'drizzle-orm';

async function main() {
  const rows = await db
    .select({
      id: bookChapters.id,
      bookId: bookChapters.bookId,
      chapterNumber: bookChapters.chapterNumber,
      audioUrl: bookChapters.audioUrl,
      audioMetadata: bookChapters.audioMetadata,
    })
    .from(bookChapters)
    .where(isNotNull(bookChapters.audioUrl))
    .limit(5);

  if (rows.length === 0) {
    console.log('No chapters have audio yet. Cannot run idempotency test.');
    process.exit(0);
  }

  console.log(`Found ${rows.length} chapters with existing audio:`);
  for (const r of rows) {
    const meta = r.audioMetadata as Record<string, unknown> | null;
    console.log(
      `  bookId=${r.bookId} chapterId=${r.id} ch#${r.chapterNumber}` +
        ` voice=${meta?.voice ?? '?'} provider=${meta?.provider ?? '?'}`,
    );
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
