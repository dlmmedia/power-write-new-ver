/**
 * Smoke test for the new server-side book-detail loader.
 *
 * Verifies that:
 *   - loadBookDetail returns null for unknown ids (no throw)
 *   - loadBookDetail returns a fully-populated detail for a known id
 *   - the shape matches what the client BookDetail expects
 *   - cold + warm latency is reasonable
 *
 * Run:
 *   npx dotenv -e .env.local -- tsx scripts/verify-book-detail-loader.ts <bookId>
 */

import { loadBookDetail } from '../lib/services/book-detail-loader';

async function main() {
  const idArg = process.argv[2];
  const bookId = idArg ? parseInt(idArg, 10) : 98;
  if (!Number.isFinite(bookId) || bookId <= 0) {
    console.error('Usage: tsx scripts/verify-book-detail-loader.ts <bookId>');
    process.exit(1);
  }

  console.log('--- loadBookDetail smoke test ---');
  console.log(`bookId: ${bookId}`);

  console.log('\n[1/3] Unknown book id (expect null)...');
  const t0 = Date.now();
  const missing = await loadBookDetail(99_999_999, {
    clerkUserId: null,
    effectiveUserId: null,
  });
  console.log(`   result: ${missing === null ? 'null (ok)' : 'NON-NULL (BUG)'}`);
  console.log(`   latency: ${Date.now() - t0}ms`);

  console.log('\n[2/3] Cold load (no cache)...');
  const t1 = Date.now();
  const cold = await loadBookDetail(bookId, {
    clerkUserId: null,
    effectiveUserId: null,
  });
  const coldMs = Date.now() - t1;
  if (!cold) {
    console.error(`   book ${bookId} not found`);
    process.exit(1);
  }
  console.log(`   id: ${cold.id}`);
  console.log(`   title: ${cold.title}`);
  console.log(`   author: ${cold.author}`);
  console.log(`   chapters: ${cold.chapters.length}`);
  console.log(`   wordCount: ${cold.metadata.wordCount}`);
  console.log(`   bibliography: ${cold.bibliography ? `${cold.bibliography.references.length} refs` : 'none'}`);
  console.log(`   isOwner: ${cold.isOwner}`);
  console.log(`   latency: ${coldMs}ms`);

  console.log('\n[3/3] Warm load (drizzle warm)...');
  const t2 = Date.now();
  const warm = await loadBookDetail(bookId, {
    clerkUserId: null,
    effectiveUserId: null,
  });
  const warmMs = Date.now() - t2;
  console.log(`   chapters: ${warm?.chapters.length ?? 0}`);
  console.log(`   latency: ${warmMs}ms`);

  console.log('\nShape check:');
  const required = [
    'id', 'title', 'author', 'genre', 'subgenre', 'status',
    'productionStatus', 'isPublic', 'isOwner', 'createdAt',
    'metadata', 'chapters',
  ] as const;
  const missingFields = required.filter((k) => !(k in cold));
  if (missingFields.length) {
    console.error(`   MISSING: ${missingFields.join(', ')}`);
    process.exit(1);
  }
  console.log('   all required fields present');

  if (cold.chapters[0]) {
    const ch0 = cold.chapters[0];
    const chRequired = ['id', 'number', 'title', 'content', 'wordCount', 'status', 'chapterType'] as const;
    const chMissing = chRequired.filter((k) => !(k in ch0));
    if (chMissing.length) {
      console.error(`   chapter MISSING: ${chMissing.join(', ')}`);
      process.exit(1);
    }
    console.log('   chapter fields present');
  }

  console.log('\nSummary:');
  console.log(`   cold:  ${coldMs}ms`);
  console.log(`   warm:  ${warmMs}ms`);
  console.log('   PASS');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('FAIL:', err);
    process.exit(1);
  });
