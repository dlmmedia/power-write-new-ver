export interface BookResult {
  id: string;
  title: string;
  authors: string[];
  description?: string;
  publishedDate?: string;
  pageCount?: number;
  categories?: string[];
  imageLinks?: {
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    extraLarge?: string;
  };
  averageRating?: number;
  ratingsCount?: number;
  language?: string;
  publisher?: string;
  isbn?: string;
  source: 'google_books' | 'goodreads';
}

export class GoogleBooksService {
  private apiKey: string;

  constructor() {
    // Google Books API works without API key for basic searches
    // Only use API key if explicitly set and valid
    this.apiKey = '';
  }

  /**
   * Execute a single query against Google Books API
   */
  private async executeQuery(query: string, maxResults = 40, startIndex = 0): Promise<BookResult[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const apiKeyParam = this.apiKey ? `&key=${this.apiKey}` : '';
      const safeMaxResults = Math.min(maxResults, 40);
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&langRestrict=en&maxResults=${safeMaxResults}&startIndex=${startIndex}&orderBy=relevance${apiKeyParam}`;
      
      console.log('Google Books API query:', query, 'startIndex:', startIndex);
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Google Books API ${response.status} error:`, errorText);
        return [];
      }

      const data = await response.json();
      
      if (!data.items) {
        console.log('No Google Books results found for:', query);
        return [];
      }

      console.log(`Found ${data.items.length} Google Books results for:`, query);

      return data.items.map((item: any): BookResult => this.parseBookItem(item));
    } catch (error) {
      console.error('Error searching Google Books:', error);
      return [];
    }
  }

  /**
   * Parse a Google Books API item into a BookResult
   */
  private parseBookItem(item: any): BookResult {
    const volumeInfo = item.volumeInfo || {};
    let imageLinks = volumeInfo.imageLinks;
    
    if (imageLinks?.thumbnail) {
      let baseUrl = imageLinks.thumbnail
        .replace(/^http:/, 'https:')
        .replace('&edge=curl', '')
        .split('&zoom=')[0];
      
      if (!baseUrl.includes('source=gbs_api')) {
        baseUrl += '&source=gbs_api';
      }
      
      imageLinks = {
        thumbnail: `${baseUrl}&zoom=1`,
        small: `${baseUrl}&zoom=2`,
        medium: `${baseUrl}&zoom=3`,
        large: `${baseUrl}&zoom=4`,
        extraLarge: `${baseUrl}&zoom=5`,
      };
    }
    
    return {
      id: item.id,
      title: volumeInfo.title || 'Unknown Title',
      authors: volumeInfo.authors || [],
      description: volumeInfo.description,
      publishedDate: volumeInfo.publishedDate,
      pageCount: volumeInfo.pageCount,
      categories: volumeInfo.categories,
      imageLinks: imageLinks,
      averageRating: volumeInfo.averageRating,
      ratingsCount: volumeInfo.ratingsCount,
      language: volumeInfo.language,
      publisher: volumeInfo.publisher,
      isbn: volumeInfo.industryIdentifiers?.[0]?.identifier,
      source: 'google_books',
    };
  }

  /**
   * Calculate relevance score for a book based on search query
   */
  private calculateRelevance(book: BookResult, query: string): number {
    const lowerQuery = query.toLowerCase().trim();
    const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 1);
    let score = 0;
    
    const lowerTitle = book.title.toLowerCase();
    const lowerAuthors = book.authors.map(a => a.toLowerCase()).join(' ');
    const lowerCategories = (book.categories || []).map(c => c.toLowerCase()).join(' ');
    
    // Exact title match (highest priority)
    if (lowerTitle === lowerQuery) {
      score += 1000;
    }
    // Title starts with query
    else if (lowerTitle.startsWith(lowerQuery)) {
      score += 500;
    }
    // Title contains exact query phrase
    else if (lowerTitle.includes(lowerQuery)) {
      score += 300;
    }
    
    // Author exact match
    if (lowerAuthors.includes(lowerQuery)) {
      score += 400;
    }
    
    // Check individual query words
    for (const word of queryWords) {
      if (lowerTitle.includes(word)) {
        score += 50;
        // Bonus if word is at the start of a word in title
        if (lowerTitle.split(/\s+/).some(tw => tw.startsWith(word))) {
          score += 25;
        }
      }
      if (lowerAuthors.includes(word)) {
        score += 30;
      }
      if (lowerCategories.includes(word)) {
        score += 20;
      }
    }
    
    // Bonus for books with ratings (indicates popularity)
    if (book.ratingsCount && book.ratingsCount > 0) {
      score += Math.min(book.ratingsCount / 100, 50);
    }
    if (book.averageRating && book.averageRating >= 4) {
      score += 20;
    }
    
    // Bonus for having a cover image
    if (book.imageLinks?.thumbnail) {
      score += 10;
    }
    
    return score;
  }

  /**
   * Search books with multiple query strategies for better results
   */
  async searchBooks(query: string, maxResults = 40, startIndex = 0): Promise<BookResult[]> {
    try {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) return [];
      
      // Strategy: Run multiple query types in parallel for comprehensive results
      const queries: string[] = [];
      
      // 1. Basic query (general search)
      queries.push(trimmedQuery);
      
      // 2. Title-specific search
      queries.push(`intitle:${trimmedQuery}`);
      
      // 3. Author-specific search (if query looks like a name - 2+ words, no numbers)
      const looksLikeAuthor = /^[a-zA-Z\s.'-]+$/.test(trimmedQuery) && trimmedQuery.split(/\s+/).length >= 2;
      if (looksLikeAuthor) {
        queries.push(`inauthor:${trimmedQuery}`);
      }
      
      // 4. Subject/topic search
      queries.push(`subject:${trimmedQuery}`);
      
      console.log(`[GoogleBooks] Searching with ${queries.length} query strategies for: "${trimmedQuery}"`);
      
      // Execute queries with small delays to avoid rate limiting
      const allResults: BookResult[] = [];
      for (const q of queries) {
        const results = await this.executeQuery(q, 20, 0);
        allResults.push(...results);
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Deduplicate by ID
      const seenIds = new Set<string>();
      const uniqueResults = allResults.filter(book => {
        if (seenIds.has(book.id)) return false;
        seenIds.add(book.id);
        return true;
      });
      
      // Sort by relevance to the search query
      const scoredResults = uniqueResults.map(book => ({
        book,
        score: this.calculateRelevance(book, trimmedQuery)
      }));
      
      scoredResults.sort((a, b) => b.score - a.score);
      
      console.log(`[GoogleBooks] Found ${uniqueResults.length} unique results, returning top ${maxResults}`);
      if (scoredResults.length > 0) {
        console.log(`[GoogleBooks] Top result: "${scoredResults[0].book.title}" (score: ${scoredResults[0].score})`);
      }
      
      return scoredResults.slice(0, maxResults).map(r => r.book);
    } catch (error) {
      console.error('Error searching Google Books:', error);
      return [];
    }
  }

  async searchBestsellers(genre?: string): Promise<BookResult[]> {
    console.log(`Searching bestseller books for genre: ${genre || 'all'}`);
    
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    
    // Enhanced queries with better targeting for popular, newer books
    const queries = genre
      ? [
          { query: `subject:${genre}`, maxResults: 40, startIndex: 0 },
          { query: `subject:${genre}`, maxResults: 40, startIndex: 40 },
        ]
      : [
          { query: `bestseller fiction ${currentYear}`, maxResults: 40, startIndex: 0 },
          { query: `bestseller nonfiction ${currentYear}`, maxResults: 40, startIndex: 0 },
          { query: `popular books ${lastYear}`, maxResults: 40, startIndex: 0 },
        ];
    
    try {
      let allResults: BookResult[] = [];
      
      // Execute queries sequentially to avoid rate limiting
      for (const { query, maxResults, startIndex } of queries) {
        const results = await this.searchBooks(query, maxResults, startIndex);
        allResults.push(...results);
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      if (allResults.length === 0) {
        console.log('No results from Google Books, trying fallback query...');
        allResults = await this.searchBooks('popular books', 40, 0);
      }
      
      const booksWithImages = allResults.filter(book => book.imageLinks?.thumbnail);
      const uniqueBooks = booksWithImages.filter((book, index, self) => 
        index === self.findIndex(b => b.id === book.id)
      );
      
      // Enhanced sorting: prioritize newer books with good ratings
      const sortedBooks = uniqueBooks.sort((a, b) => {
        const aYear = parseInt(a.publishedDate?.substring(0, 4) || '2000');
        const bYear = parseInt(b.publishedDate?.substring(0, 4) || '2000');
        const aScore = (a.ratingsCount || 0) * (a.averageRating || 3) + (aYear - 2000) * 10;
        const bScore = (b.ratingsCount || 0) * (b.averageRating || 3) + (bYear - 2000) * 10;
        return bScore - aScore;
      });
      
      console.log(`Found ${sortedBooks.length} unique bestseller books`);
      return sortedBooks.slice(0, 60);
    } catch (error) {
      console.error('Error searching bestsellers:', error);
      return [];
    }
  }

  async searchNewReleases(genre?: string): Promise<BookResult[]> {
    console.log(`Searching new release books for genre: ${genre || 'all'}`);
    
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    const twoYearsAgo = currentYear - 2;
    
    const queries = genre
      ? [
          { query: `subject:${genre}+inpublisher:${currentYear}`, maxResults: 40, startIndex: 0 },
          { query: `subject:${genre}+inpublisher:${lastYear}`, maxResults: 40, startIndex: 0 },
        ]
      : [
          { query: `new release ${currentYear} fiction`, maxResults: 40, startIndex: 0 },
          { query: `new release ${currentYear} nonfiction`, maxResults: 40, startIndex: 0 },
          { query: `recent books ${lastYear}`, maxResults: 40, startIndex: 0 },
        ];
    
    try {
      let allResults: BookResult[] = [];
      
      // Execute queries sequentially for better rate limiting
      for (const { query, maxResults, startIndex } of queries) {
        const results = await this.searchBooks(query, maxResults, startIndex);
        allResults.push(...results);
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      const booksWithImages = allResults.filter(book => book.imageLinks?.thumbnail);
      const uniqueBooks = booksWithImages.filter((book, index, self) => 
        index === self.findIndex(b => b.id === book.id)
      );
      
      // Sort by publication date (newest first) and rating quality
      const sortedBooks = uniqueBooks.sort((a, b) => {
        const aYear = parseInt(a.publishedDate?.substring(0, 4) || '0');
        const bYear = parseInt(b.publishedDate?.substring(0, 4) || '0');
        if (bYear !== aYear) return bYear - aYear;
        // Secondary sort by rating score
        const aScore = (a.ratingsCount || 0) * (a.averageRating || 0);
        const bScore = (b.ratingsCount || 0) * (b.averageRating || 0);
        return bScore - aScore;
      });
      
      console.log(`Found ${sortedBooks.length} new release books`);
      return sortedBooks.slice(0, 60);
    } catch (error) {
      console.error('Error searching new releases:', error);
      return [];
    }
  }

  async searchByGenre(genre: string): Promise<BookResult[]> {
    console.log('Searching books by genre:', genre);
    
    const currentYear = new Date().getFullYear();
    
    const queries = [
      { query: `subject:${genre}`, maxResults: 40, startIndex: 0 },
      { query: `subject:${genre}`, maxResults: 40, startIndex: 40 },
      { query: `${genre} popular ${currentYear}`, maxResults: 40, startIndex: 0 },
    ];
    
    try {
      let allResults: BookResult[] = [];
      
      // Execute queries sequentially
      for (const { query, maxResults, startIndex } of queries) {
        const results = await this.searchBooks(query, maxResults, startIndex);
        allResults.push(...results);
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      const booksWithImages = allResults.filter(book => book.imageLinks?.thumbnail);
      const uniqueBooks = booksWithImages.filter((book, index, self) => 
        index === self.findIndex(b => b.id === book.id)
      );
      
      // Sort by popularity and recency
      const sortedBooks = uniqueBooks.sort((a, b) => {
        const aYear = parseInt(a.publishedDate?.substring(0, 4) || '2000');
        const bYear = parseInt(b.publishedDate?.substring(0, 4) || '2000');
        const aScore = (a.ratingsCount || 0) * (a.averageRating || 3) + (aYear - 2000) * 5;
        const bScore = (b.ratingsCount || 0) * (b.averageRating || 3) + (bYear - 2000) * 5;
        return bScore - aScore;
      });
      
      console.log(`Found ${sortedBooks.length} unique books for genre: ${genre}`);
      return sortedBooks.slice(0, 60);
    } catch (error) {
      console.error('Error searching by genre:', error);
      return [];
    }
  }

  async getBookDetails(bookId: string): Promise<BookResult | null> {
    try {
      const url = `https://www.googleapis.com/books/v1/volumes/${bookId}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const volumeInfo = data.volumeInfo || {};
      
      let imageLinks = volumeInfo.imageLinks;
      if (imageLinks?.thumbnail) {
        let baseUrl = imageLinks.thumbnail
          .replace(/^http:/, 'https:')
          .replace('&edge=curl', '')
          .split('&zoom=')[0];
        
        if (!baseUrl.includes('source=gbs_api')) {
          baseUrl += '&source=gbs_api';
        }
        
        imageLinks = {
          thumbnail: `${baseUrl}&zoom=1`,
          small: `${baseUrl}&zoom=2`,
          medium: `${baseUrl}&zoom=3`,
          large: `${baseUrl}&zoom=4`,
          extraLarge: `${baseUrl}&zoom=5`,
        };
      }
      
      return {
        id: data.id,
        title: volumeInfo.title || 'Unknown Title',
        authors: volumeInfo.authors || [],
        description: volumeInfo.description,
        publishedDate: volumeInfo.publishedDate,
        pageCount: volumeInfo.pageCount,
        categories: volumeInfo.categories,
        imageLinks: imageLinks,
        averageRating: volumeInfo.averageRating,
        ratingsCount: volumeInfo.ratingsCount,
        language: volumeInfo.language,
        publisher: volumeInfo.publisher,
        isbn: volumeInfo.industryIdentifiers?.[0]?.identifier,
        source: 'google_books',
      };
    } catch (error) {
      console.error('Error getting book details:', error);
      return null;
    }
  }
}

export const googleBooksService = new GoogleBooksService();
