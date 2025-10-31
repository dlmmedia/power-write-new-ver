/**
 * Utility script to generate covers for all books in the library
 * Run this with: npm run generate-covers
 */

import { db } from '../lib/db';
import { generatedBooks } from '../lib/db/schema';
import { aiService } from '../lib/services/ai-service';
import { isNull } from 'drizzle-orm';

async function generateCoversForAllBooks() {
  console.log('🎨 Starting cover generation for all books...\n');

  try {
    // Get all books without covers
    const booksWithoutCovers = await db
      .select()
      .from(generatedBooks)
      .where(isNull(generatedBooks.coverUrl));

    console.log(`Found ${booksWithoutCovers.length} books without covers\n`);

    if (booksWithoutCovers.length === 0) {
      console.log('✅ All books already have covers!');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const book of booksWithoutCovers) {
      try {
        console.log(`\n📖 Generating cover for: "${book.title}"`);
        console.log(`   Author: ${book.author || 'Unknown'}`);
        console.log(`   Genre: ${book.genre || 'Fiction'}`);

        const coverUrl = await aiService.generateCoverImage(
          book.title,
          book.author || 'Unknown Author',
          book.genre || 'Fiction',
          book.summary || book.title,
          'vivid'
        );

        // Update book with cover
        await db
          .update(generatedBooks)
          .set({ 
            coverUrl: coverUrl,
            updatedAt: new Date()
          })
          .where(eq(generatedBooks.id, book.id));

        console.log(`   ✅ Cover generated successfully!`);
        console.log(`   URL: ${coverUrl.substring(0, 50)}...`);
        successCount++;

        // Add a small delay between generations to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`   ❌ Failed to generate cover:`, error);
        failCount++;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Successfully generated: ${successCount} covers`);
    if (failCount > 0) {
      console.log(`❌ Failed: ${failCount} covers`);
    }
    console.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Import eq after db setup
import { eq } from 'drizzle-orm';

// Run the script
generateCoversForAllBooks()
  .then(() => {
    console.log('🎉 Cover generation complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
