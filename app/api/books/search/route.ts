import { NextRequest, NextResponse } from 'next/server';
import { googleBooksService } from '@/lib/services/google-books';
import { bookCacheService } from '@/lib/services/book-cache';
import { BookResult } from '@/lib/services/google-books';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const genre = searchParams.get('genre');

    console.log('[API] Request params:', { query, category, genre });

    if (!query && !category) {
      return NextResponse.json(
        { error: 'Query or category parameter is required' },
        { status: 400 }
      );
    }

    let googleResults: BookResult[] = [];
    let cachedResults: BookResult[] = [];

    // Fetch from Google Books
    console.log('[API] Calling googleBooksService...');
    if (category === 'bestsellers') {
      console.log('[API] Fetching bestsellers');
      googleResults = await googleBooksService.searchBestsellers(genre || undefined);
      console.log('[API] Bestsellers returned:', googleResults.length);
    } else if (category === 'new-releases') {
      googleResults = await googleBooksService.searchNewReleases(genre || undefined);
    } else if (category === 'fiction') {
      googleResults = await googleBooksService.searchByGenre('fiction');
    } else if (category === 'non-fiction') {
      googleResults = await googleBooksService.searchByGenre('nonfiction');
    } else if (genre) {
      googleResults = await googleBooksService.searchByGenre(genre);
    } else if (query) {
      googleResults = await googleBooksService.searchBooks(query);
    }

    // Fetch from cached Goodreads books
    if (query) {
      console.log('[API] Searching cached books...');
      cachedResults = await bookCacheService.searchCachedBooks(query);
      console.log('[API] Cached results:', cachedResults.length);
    }

    // Combine and deduplicate results
    const allResults = [...googleResults, ...cachedResults];
    const uniqueResults = allResults.filter(
      (book, index, self) => index === self.findIndex(b => b.id === book.id)
    );
    
    const results = uniqueResults;

    console.log(`[API] Returning ${results.length} books`);
    if (results.length > 0) {
      console.log('[API] First book:', results[0].title);
      console.log('[API] First book image:', results[0].imageLinks);  
    } else {
      console.log('[API] ⚠️  No books to return!');
    }

    return NextResponse.json({ books: results });
  } catch (error) {
    console.error('[API] ERROR in book search API:', error);
    return NextResponse.json(
      { error: 'Failed to search books' },
      { status: 500 }
    );
  }
}
