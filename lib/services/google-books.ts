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

  async searchBooks(query: string, maxResults = 40, startIndex = 0): Promise<BookResult[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const apiKeyParam = this.apiKey ? `&key=${this.apiKey}` : '';
      // Limit maxResults to 40 (Google's max)
      const safeMaxResults = Math.min(maxResults, 40);
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&langRestrict=en&maxResults=${safeMaxResults}&startIndex=${startIndex}&orderBy=relevance${apiKeyParam}`;
      
      console.log('Google Books API query:', query, 'startIndex:', startIndex);
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Google Books API ${response.status} error:`, errorText);
        // Return empty array instead of throwing to gracefully handle API issues
        return [];
      }

      const data = await response.json();
      
      if (!data.items) {
        console.log('No Google Books results found for:', query);
        return [];
      }

      console.log(`Found ${data.items.length} Google Books results for:`, query);

      return data.items.map((item: any): BookResult => {
        const volumeInfo = item.volumeInfo || {};
        let imageLinks = volumeInfo.imageLinks;
        
        // Generate high-quality image URLs from Google Books thumbnail
        if (imageLinks?.thumbnail) {
          // Force HTTPS, remove edge=curl, and create zoom levels
          let baseUrl = imageLinks.thumbnail
            .replace(/^http:/, 'https:')  // Force HTTPS
            .replace('&edge=curl', '')     // Remove curl effect
            .split('&zoom=')[0];           // Remove existing zoom parameter
          
          // Ensure we have the gbs_api source parameter
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
      });
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
