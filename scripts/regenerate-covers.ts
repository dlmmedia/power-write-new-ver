/**
 * Script to regenerate covers for specific books using Nano Banana Pro
 */

import { db } from '../lib/db';
import { generatedBooks } from '../lib/db/schema';
import { like, or } from 'drizzle-orm';

const BOOKS_TO_UPDATE = [
  'AI Disruption',
  'Battles Won and Lost',
  'History of Western Classical Music',
];

const IMAGE_MODEL = 'google/gemini-2.5-pro-preview-image'; // Nano Banana Pro
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function findBooks() {
  console.log('Finding books to update...\n');
  
  // Find books by title (partial match)
  const books = await db
    .select()
    .from(generatedBooks)
    .where(
      or(
        ...BOOKS_TO_UPDATE.map(title => like(generatedBooks.title, `%${title}%`))
      )
    );

  console.log(`Found ${books.length} books:`);
  books.forEach(book => {
    console.log(`  - ID: ${book.id}, Title: "${book.title}", Genre: ${book.genre}`);
    console.log(`    Current cover: ${book.coverUrl || 'None'}`);
  });
  
  return books;
}

async function regenerateCover(bookId: number, title: string) {
  console.log(`\nRegenerating cover for "${title}" (ID: ${bookId})...`);
  
  const response = await fetch(`${BASE_URL}/api/books/${bookId}/cover`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageModel: IMAGE_MODEL,
    }),
  });

  const data = await response.json();
  
  if (response.ok && data.success) {
    console.log(`✓ Cover generated successfully: ${data.coverUrl}`);
    return data.coverUrl;
  } else {
    console.error(`✗ Failed to generate cover: ${data.error || data.details}`);
    return null;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Cover Regeneration Script - Using Nano Banana Pro');
  console.log('='.repeat(60));
  console.log(`Image Model: ${IMAGE_MODEL}`);
  console.log(`Target books: ${BOOKS_TO_UPDATE.join(', ')}`);
  console.log('='.repeat(60));

  try {
    const books = await findBooks();
    
    if (books.length === 0) {
      console.log('\nNo matching books found!');
      process.exit(1);
    }

    console.log(`\nWill regenerate covers for ${books.length} book(s)...`);
    
    const results: { title: string; success: boolean; coverUrl?: string }[] = [];
    
    for (const book of books) {
      const coverUrl = await regenerateCover(book.id, book.title);
      results.push({
        title: book.title,
        success: !!coverUrl,
        coverUrl: coverUrl || undefined,
      });
      
      // Add a small delay between requests to avoid rate limiting
      if (books.indexOf(book) < books.length - 1) {
        console.log('Waiting 2 seconds before next cover...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Results Summary:');
    console.log('='.repeat(60));
    
    results.forEach(r => {
      const status = r.success ? '✓' : '✗';
      console.log(`${status} ${r.title}`);
      if (r.coverUrl) {
        console.log(`  New cover: ${r.coverUrl}`);
      }
    });

    const successCount = results.filter(r => r.success).length;
    console.log(`\n${successCount}/${results.length} covers regenerated successfully.`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();



















