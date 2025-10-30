import { NextRequest, NextResponse } from 'next/server';
import { goodreadsService } from '@/lib/services/goodreads';
import { bookCacheService } from '@/lib/services/book-cache';
import { BookResult } from '@/lib/services/google-books';

// Popular book IDs from Goodreads (best sellers, classics, etc.)
const POPULAR_BOOK_IDS = [
  '1', // Harry Potter and the Half-Blood Prince
  '2', // Harry Potter and the Order of the Phoenix  
  '3', // Harry Potter and the Chamber of Secrets
  '4', // Harry Potter and the Prisoner of Azkaban
  '5', // Harry Potter and the Goblet of Fire
  '6', // Harry Potter and the Deathly Hallows
  '7', // Harry Potter and the Sorcerer's Stone
  '11', // The Hobbit
  '18', // The Lord of the Rings
  '19', // The Fellowship of the Ring
  '5', // To Kill a Mockingbird
  '2657', // The Hunger Games
  '7260188', // The Midnight Library
  '40121378', // Atomic Habits
  '41865', // Twilight
  '968', // 1984
  '4667024', // The Subtle Art of Not Giving a F*ck
  '23129', // Gone Girl
  '4671', // The Great Gatsby
  '11588', // The Shining
  '13079982', // Fifty Shades of Grey
  '1885', // Pride and Prejudice
  '7624', // Jane Eyre
  '6', // The Da Vinci Code
  '41865', // The Girl on the Train
];

export async function POST(request: NextRequest) {
  try {
    const { bookIds, limit } = await request.json().catch(() => ({ bookIds: null, limit: 30 }));
    
    const idsToFetch = bookIds || POPULAR_BOOK_IDS.slice(0, limit || 30);
    
    console.log(`[SEED] Starting to seed ${idsToFetch.length} books from Goodreads...`);
    
    // Get existing cached books
    const existingBooks = await bookCacheService.getAllCachedBooks();
    const newBooks: BookResult[] = [];
    
    const results = {
      total: idsToFetch.length,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };
    
    for (const bookId of idsToFetch) {
      try {
        console.log(`[SEED] Fetching book ${bookId}...`);
        const book = await goodreadsService.getBookByID(bookId.toString());
        
        if (book) {
          // Check if book already exists
          const exists = existingBooks.find(b => b.id === book.id);
          if (!exists) {
            newBooks.push(book);
          }
          results.successful++;
          console.log(`[SEED] ✓ Fetched: ${book.title}`);
        } else {
          results.failed++;
          results.errors.push(`Book ${bookId} not found`);
          console.log(`[SEED] ✗ Book ${bookId} not found`);
        }
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Error fetching book ${bookId}: ${errorMsg}`);
        console.error(`[SEED] ✗ Error fetching book ${bookId}:`, error);
      }
    }
    
    console.log(`[SEED] Seeding complete: ${results.successful} successful, ${results.failed} failed`);
    console.log(`[SEED] ${newBooks.length} new books to add to Edge Config`);
    
    // Combine existing and new books
    const allBooks = [...existingBooks, ...newBooks];
    
    return NextResponse.json({
      success: true,
      message: `Fetched ${results.successful} books from Goodreads`,
      instructions: newBooks.length > 0 
        ? 'Update Edge Config with the books data below using Vercel dashboard or CLI'
        : 'No new books to add - all books already cached',
      results,
      edgeConfigData: newBooks.length > 0 ? {
        key: 'cached_books',
        value: {
          books: allBooks,
          lastUpdated: new Date().toISOString(),
        }
      } : null,
    });
  } catch (error) {
    console.error('[SEED] Error in seed endpoint:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to seed books',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    
    if (action === 'status') {
      const stats = await bookCacheService.getCacheStats();
      
      return NextResponse.json({
        success: true,
        ...stats,
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Seed endpoint is ready. Use POST to seed books or GET with ?action=status to check cache status.',
      note: 'Books are stored in Vercel Edge Config for fast global reads',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
