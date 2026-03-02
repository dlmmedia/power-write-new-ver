import { db } from '../lib/db';
import { generatedBooks, cachedBooks } from '../lib/db/schema';
import { desc } from 'drizzle-orm';

async function checkBooks() {
  console.log('=== GENERATED BOOKS ===');
  const genBooks = await db
    .select({
      id: generatedBooks.id,
      title: generatedBooks.title,
      author: generatedBooks.author,
      genre: generatedBooks.genre,
      status: generatedBooks.status,
      productionStatus: generatedBooks.productionStatus,
      userId: generatedBooks.userId,
      createdAt: generatedBooks.createdAt,
    })
    .from(generatedBooks)
    .orderBy(desc(generatedBooks.createdAt));

  console.log(`Total generated books: ${genBooks.length}`);
  for (const book of genBooks) {
    console.log(`  [${book.id}] "${book.title}" by ${book.author} | status=${book.status} | production=${book.productionStatus} | genre=${book.genre} | created=${book.createdAt}`);
  }

  console.log('\n=== CACHED BOOKS ===');
  const cached = await db
    .select({
      id: cachedBooks.id,
      externalId: cachedBooks.externalId,
      source: cachedBooks.source,
      title: cachedBooks.title,
      authors: cachedBooks.authors,
      categories: cachedBooks.categories,
    })
    .from(cachedBooks);

  console.log(`Total cached books: ${cached.length}`);
  for (const book of cached) {
    console.log(`  [${book.id}] "${book.title}" by ${JSON.stringify(book.authors)} | source=${book.source} | extId=${book.externalId} | categories=${JSON.stringify(book.categories)}`);
  }
}

checkBooks()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
