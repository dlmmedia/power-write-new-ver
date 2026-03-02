import { db } from '../lib/db';
import { generatedBooks, bookChapters } from '../lib/db/schema';
import { eq, ilike, desc } from 'drizzle-orm';

async function checkSlimeball() {
  // Search for any book with "slime" in the title
  const slimeBooks = await db
    .select()
    .from(generatedBooks)
    .where(ilike(generatedBooks.title, '%slime%'))
    .orderBy(desc(generatedBooks.createdAt));

  console.log(`=== SLIMEBALL BOOKS FOUND: ${slimeBooks.length} ===\n`);

  for (const book of slimeBooks) {
    console.log(`--- Book ID: ${book.id} ---`);
    console.log(`  Title: ${book.title}`);
    console.log(`  Author: ${book.author}`);
    console.log(`  Genre: ${book.genre}`);
    console.log(`  Status: ${book.status}`);
    console.log(`  Production Status: ${book.productionStatus}`);
    console.log(`  Cover URL: ${book.coverUrl || 'NONE'}`);
    console.log(`  PDF URL: ${book.pdfUrl || 'NONE'}`);
    console.log(`  Audio URL: ${book.audioUrl || 'NONE'}`);
    console.log(`  Created: ${book.createdAt}`);
    console.log(`  Updated: ${book.updatedAt}`);
    console.log(`  Summary: ${(book.summary || '').substring(0, 200)}...`);
    console.log(`  Content length: ${(book.content || '').length} chars`);
    console.log(`  Has outline: ${!!book.outline}`);
    console.log(`  Has chapters (jsonb): ${!!book.chapters}`);
    console.log(`  Has config: ${!!book.config}`);
    console.log(`  Metadata: ${JSON.stringify(book.metadata)}`);
    console.log(`  Source book data: ${book.sourceBookData ? 'YES' : 'NO'}`);
    console.log(`  Reference books: ${book.referenceBooks ? 'YES' : 'NO'}`);
    console.log(`  Generation type: ${book.generationType}`);
    console.log(`  Is public: ${book.isPublic}`);

    // Check chapters
    const chapters = await db
      .select()
      .from(bookChapters)
      .where(eq(bookChapters.bookId, book.id))
      .orderBy(bookChapters.chapterNumber);

    console.log(`\n  Chapters in book_chapters table: ${chapters.length}`);
    for (const ch of chapters) {
      console.log(`    Ch ${ch.chapterNumber}: "${ch.title}" | ${ch.wordCount} words | audio: ${ch.audioUrl ? 'YES' : 'NO'} | edited: ${ch.isEdited}`);
    }
    console.log('');
  }

  // Also search for "epstein" in case there are related books
  const epsteinBooks = await db
    .select({
      id: generatedBooks.id,
      title: generatedBooks.title,
      author: generatedBooks.author,
      status: generatedBooks.status,
    })
    .from(generatedBooks)
    .where(ilike(generatedBooks.title, '%epstein%'));

  if (epsteinBooks.length > slimeBooks.length) {
    console.log(`=== OTHER EPSTEIN-RELATED BOOKS ===`);
    for (const book of epsteinBooks) {
      if (!slimeBooks.find(s => s.id === book.id)) {
        console.log(`  [${book.id}] "${book.title}" by ${book.author} | status=${book.status}`);
      }
    }
  }

  // Show all books by DL Mabey (the slimeball author) to see if versions exist under different titles
  const mabeyBooks = await db
    .select({
      id: generatedBooks.id,
      title: generatedBooks.title,
      author: generatedBooks.author,
      status: generatedBooks.status,
      productionStatus: generatedBooks.productionStatus,
      createdAt: generatedBooks.createdAt,
    })
    .from(generatedBooks)
    .where(ilike(generatedBooks.author, '%mabey%'))
    .orderBy(desc(generatedBooks.createdAt));

  console.log(`\n=== ALL BOOKS BY MABEY: ${mabeyBooks.length} ===`);
  for (const book of mabeyBooks) {
    console.log(`  [${book.id}] "${book.title}" by ${book.author} | status=${book.status} | production=${book.productionStatus} | created=${book.createdAt}`);
  }
}

checkSlimeball()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
