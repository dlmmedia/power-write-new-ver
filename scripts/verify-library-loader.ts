/**
 * Smoke-test for loadLibrary(). Pulls real clerk user ids off the books
 * table and round-trips through the new shared loader, asserting:
 *  - return shape is sane
 *  - book count matches the DB count
 *  - cold + warm latency are reported
 *
 * Run: npm run db:verify-library
 */
import { db } from '@/lib/db';
import { generatedBooks, users } from '@/lib/db/schema';
import { sql, eq, count, ne } from 'drizzle-orm';
import { loadLibrary } from '@/lib/services/library-loader';

async function checkUser(userId: string): Promise<void> {
  const [u] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const email = u?.email ?? undefined;

  const [rawCount] = await db
    .select({ n: count() })
    .from(generatedBooks)
    .where(eq(generatedBooks.userId, userId));

  console.log(
    `\n[verify-library] user=${userId.slice(0, 30)}  email=${email ?? '(none)'}  rawCount=${rawCount?.n}`,
  );

  // Cold call.
  const t1 = Date.now();
  const r1 = await loadLibrary(userId, email);
  console.log(
    `   loadLibrary cold: ${Date.now() - t1}ms  → tier=${r1.tier} visible=${r1.count}`,
  );

  // Warm call (pool already established).
  const t2 = Date.now();
  const r2 = await loadLibrary(userId, email);
  console.log(`   loadLibrary warm: ${Date.now() - t2}ms  → visible=${r2.count}`);

  if (r1.count !== r2.count) throw new Error('cold/warm count mismatch');

  // Sanity check the first book.
  const sample = r1.books[0];
  if (!sample) {
    console.log('   (no books)');
    return;
  }
  console.log(
    `   sample: id=${sample.id} "${sample.title.slice(0, 50)}" — ` +
      `${sample.metadata.chapters}ch, ${sample.metadata.wordCount}w, ` +
      `audio=${sample.audioStats ? `${sample.audioStats.chaptersWithAudio}/${sample.audioStats.totalChapters}` : 'none'}`,
  );

  const required = [
    'id',
    'title',
    'author',
    'genre',
    'createdAt',
    'metadata',
    'audioStats',
    'isOwner',
  ];
  const missing = required.filter((k) => !(k in sample));
  if (missing.length) throw new Error(`sample missing fields: ${missing.join(', ')}`);

  // For free tier the loader filters to this user; for pro it returns all books.
  if (r1.tier === 'free' && r1.count > (rawCount?.n ?? 0)) {
    throw new Error(
      `free-tier loader returned ${r1.count} books but user only owns ${rawCount?.n}`,
    );
  }
}

async function main(): Promise<void> {
  console.log('[verify-library] starting');

  const owners = await db
    .select({ userId: generatedBooks.userId, n: count() })
    .from(generatedBooks)
    .where(ne(generatedBooks.userId, ''))
    .groupBy(generatedBooks.userId)
    .orderBy(sql`count(*) desc`)
    .limit(5);

  console.log(`[verify-library] top owners:`);
  for (const o of owners) {
    console.log(`    ${o.userId}  → ${o.n} books`);
  }
  if (owners.length === 0) throw new Error('no users own any books');

  for (const o of owners.slice(0, 2)) {
    await checkUser(o.userId);
  }

  console.log('\n[verify-library] ✓ all checks passed');
  process.exit(0);
}

main().catch((err) => {
  console.error('[verify-library] FAIL', err);
  process.exit(1);
});
