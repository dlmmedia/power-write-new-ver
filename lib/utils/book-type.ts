import { BookResult } from '../services/google-books';
import { SelectedBook } from '../types/book';

/**
 * Type for books that can be checked for non-fiction status
 */
type BookWithCategories = {
  categories?: string[];
  genre?: string;
};

/**
 * Determine if a book is non-fiction based on its categories and genre
 */
export function isNonFiction(book: BookResult | SelectedBook | BookWithCategories): boolean {
  const categories = book.categories || [];
  const genre = 'genre' in book ? book.genre : undefined;
  
  // Combine all text to search
  const searchText = [
    ...categories.map(c => c.toLowerCase()),
    genre?.toLowerCase() || '',
  ].join(' ');
  
  // Non-fiction indicators
  const nonFictionKeywords = [
    'non-fiction',
    'nonfiction',
    'biography',
    'autobiography',
    'memoir',
    'history',
    'self-help',
    'self help',
    'business',
    'science',
    'technology',
    'philosophy',
    'psychology',
    'reference',
    'textbook',
    'education',
    'academic',
    'true crime',
    'cooking',
    'health',
    'fitness',
    'travel',
    'guide',
    'manual',
    'how-to',
    'politics',
    'economics',
    'religion',
    'spirituality',
    'art',
    'music',
    'photography',
    'sports',
    'nature',
    'environment',
  ];
  
  // Fiction indicators (less weight)
  const fictionKeywords = [
    'fiction',
    'novel',
    'fantasy',
    'science fiction',
    'sci-fi',
    'romance',
    'thriller',
    'mystery',
    'horror',
    'adventure',
    'crime fiction',
    'detective',
    'dystopian',
    'young adult fiction',
    'literary fiction',
  ];
  
  // Check for non-fiction keywords
  const hasNonFictionKeyword = nonFictionKeywords.some(keyword => 
    searchText.includes(keyword)
  );
  
  // Check for fiction keywords
  const hasFictionKeyword = fictionKeywords.some(keyword => 
    searchText.includes(keyword)
  );
  
  // If has explicit non-fiction keyword and no fiction keyword, it's non-fiction
  if (hasNonFictionKeyword && !hasFictionKeyword) {
    return true;
  }
  
  // If has fiction keyword and no non-fiction keyword, it's fiction
  if (hasFictionKeyword && !hasNonFictionKeyword) {
    return false;
  }
  
  // If both or neither, default to fiction (safer for book generation)
  return false;
}

/**
 * Get a descriptive book type label
 */
export function getBookType(book: BookResult | SelectedBook | BookWithCategories): 'Fiction' | 'Non-Fiction' {
  return isNonFiction(book) ? 'Non-Fiction' : 'Fiction';
}

/**
 * Get detailed book type information
 */
export function getBookTypeInfo(book: BookResult | SelectedBook | BookWithCategories): {
  isNonFiction: boolean;
  type: 'Fiction' | 'Non-Fiction';
  primaryCategory?: string;
  subCategory?: string;
} {
  const nonFiction = isNonFiction(book);
  const categories = book.categories || [];
  
  return {
    isNonFiction: nonFiction,
    type: nonFiction ? 'Non-Fiction' : 'Fiction',
    primaryCategory: categories[0],
    subCategory: categories[1],
  };
}

/**
 * Determine if a book should be labeled as "A Novel By" based on its genre and book type
 * Used for export services to conditionally show the author label
 * 
 * @param genre - The book's genre string
 * @param bookType - The book type from publishing settings (e.g., 'novel', 'memoir', 'textbook')
 * @returns true if the book is a novel/fiction and should show "A Novel By"
 */
export function isNovel(genre?: string, bookType?: string): boolean {
  // Check explicit book types that are novels
  const novelBookTypes = ['novel', 'novella', 'short-story-collection', 'young-adult', 'middle-grade'];
  if (bookType && novelBookTypes.includes(bookType)) {
    return true;
  }
  
  // Check explicit book types that are NOT novels
  const nonNovelBookTypes = [
    'textbook', 'workbook', 'cookbook', 'coffee-table-book', 'art-book',
    'memoir', 'biography', 'self-help', 'business', 'technical', 'poetry',
    'journal', 'devotional', 'travel-guide', 'magazine', 'academic'
  ];
  if (bookType && nonNovelBookTypes.includes(bookType)) {
    return false;
  }
  
  // Check genre keywords for fiction/novel indicators
  const searchText = (genre || '').toLowerCase();
  const novelKeywords = [
    'novel', 'fiction', 'thriller', 'mystery', 'romance', 'fantasy', 
    'sci-fi', 'science fiction', 'horror', 'adventure', 'dystopian',
    'literary fiction', 'crime fiction', 'detective', 'suspense'
  ];
  
  return novelKeywords.some(keyword => searchText.includes(keyword));
}
