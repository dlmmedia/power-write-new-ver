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

/**
 * Filter books to only include those with valid, high-quality images
 * Prioritizes books with ratings as they're more likely to have real cover images
 */
function filterBooksWithQualityImages(books: BookResult[]): BookResult[] {
  return books.filter(book => {
    // Must have image links
    if (!book.imageLinks) return false;
    
    // Must have at least a thumbnail
    const hasValidImage = book.imageLinks.thumbnail || 
                          book.imageLinks.small || 
                          book.imageLinks.medium || 
                          book.imageLinks.large;
    if (!hasValidImage) return false;
    
    // Check that the image URL looks valid (not a placeholder)
    const imageUrl = book.imageLinks.thumbnail || book.imageLinks.small || '';
    if (imageUrl.includes('no_cover') || imageUrl.includes('placeholder')) return false;
    
    return true;
  }).sort((a, b) => {
    // Prioritize books with ratings (more likely to have valid covers)
    const aScore = (a.ratingsCount || 0) + (a.averageRating ? 100 : 0);
    const bScore = (b.ratingsCount || 0) + (b.averageRating ? 100 : 0);
    return bScore - aScore;
  });
}

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
      // Search both Google Books and cache in parallel
      const [gResults, cResults] = await Promise.all([
        googleBooksService.searchBooks(query),
        bookCacheService.searchCachedBooks(query)
      ]);
      googleResults = gResults;
      cachedResults = cResults;
      console.log('[API] Google results:', googleResults.length);
      console.log('[API] Cached results:', cachedResults.length);
    }

    // Cache the Google Books results for faster future lookups
    if (googleResults.length > 0) {
      bookCacheService.cacheBooks(googleResults).catch(err => 
        console.error('[API] Error caching books:', err)
      );
    }

    // Combine and deduplicate results, prioritizing Google results (already sorted by relevance)
    const seenIds = new Set<string>();
    const uniqueResults: BookResult[] = [];
    
    // Add Google results first (they're already relevance-sorted)
    for (const book of googleResults) {
      if (!seenIds.has(book.id)) {
        seenIds.add(book.id);
        uniqueResults.push(book);
      }
    }
    
    // Add cached results that aren't duplicates
    for (const book of cachedResults) {
      if (!seenIds.has(book.id)) {
        seenIds.add(book.id);
        uniqueResults.push(book);
      }
    }
    
    // Apply quality image filtering to ensure only books with valid covers are returned
    const booksWithQualityImages = filterBooksWithQualityImages(uniqueResults);

    console.log(`[API] Returning ${booksWithQualityImages.length} books (filtered from ${uniqueResults.length})`);
    if (booksWithQualityImages.length > 0) {
      console.log('[API] First book:', booksWithQualityImages[0].title);
      console.log('[API] First book image:', booksWithQualityImages[0].imageLinks);  
    } else {
      console.log('[API] ⚠️  No books to return!');
    }

    return NextResponse.json({ books: booksWithQualityImages });
  } catch (error) {
    console.error('[API] ERROR in book search API:', error);
    return NextResponse.json(
      { error: 'Failed to search books' },
      { status: 500 }
    );
  }
}
