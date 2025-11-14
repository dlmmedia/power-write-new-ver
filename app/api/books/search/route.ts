import { NextRequest, NextResponse } from 'next/server';
import { googleBooksService } from '@/lib/services/google-books';
import { bookCacheService } from '@/lib/services/book-cache';
import { BookResult } from '@/lib/services/google-books';

// Map category IDs to their corresponding genre search terms
const CATEGORY_TO_GENRE_MAP: Record<string, string> = {
  'fiction': 'fiction',
  'non-fiction': 'nonfiction',
  'mystery': 'mystery',
  'romance': 'romance',
  'science-fiction': 'science fiction',
  'fantasy': 'fantasy',
  'horror': 'horror',
  'biography': 'biography',
  'history': 'history',
  'self-help': 'self-help',
  'business': 'business',
  'technology': 'technology',
  'science': 'science',
  'cooking': 'cooking',
  'travel': 'travel',
  'poetry': 'poetry',
  'young-adult': 'young adult',
  'children': 'children',
  'graphic-novels': 'graphic novels',
  'health': 'health',
  'philosophy': 'philosophy',
  'religion': 'religion',
  'true-crime': 'true crime',
};

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
      console.log('[API] Fetching new releases');
      googleResults = await googleBooksService.searchNewReleases(genre || undefined);
      console.log('[API] New releases returned:', googleResults.length);
    } else if (category && CATEGORY_TO_GENRE_MAP[category]) {
      // Use the mapping for all standard categories
      const genreQuery = CATEGORY_TO_GENRE_MAP[category];
      console.log(`[API] Fetching category '${category}' as genre '${genreQuery}'`);
      googleResults = await googleBooksService.searchByGenre(genreQuery);
      console.log(`[API] ${category} returned:`, googleResults.length);
    } else if (genre) {
      console.log('[API] Fetching by genre:', genre);
      googleResults = await googleBooksService.searchByGenre(genre);
    } else if (query) {
      console.log('[API] Searching for:', query);
      googleResults = await googleBooksService.searchBooks(query);
    }

    // Cache the Google Books results for faster future lookups
    if (googleResults.length > 0) {
      bookCacheService.cacheBooks(googleResults).catch(err => 
        console.error('[API] Error caching books:', err)
      );
    }

    // Fetch from cached books database
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
