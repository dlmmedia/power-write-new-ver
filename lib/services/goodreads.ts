import { BookResult } from './google-books';

const RAPIDAPI_KEY = '1697032c90msh3015e13cf0a9efep1edd18jsn004474f89c45';
const RAPIDAPI_HOST = 'goodreads12.p.rapidapi.com';

interface GoodreadsBookResponse {
  legacyId: number;
  title: string;
  description?: string;
  imageUrl?: string;
  stats?: {
    averageRating?: number;
    ratingsCount?: number;
  };
  details?: {
    publicationTime?: number;
    numPages?: number;
    isbn?: string;
  };
  primaryContributorEdge?: {
    node?: {
      name?: string;
    };
  };
  bookGenres?: Array<{
    name: string;
  }>;
}

export class GoodreadsService {
  private readonly baseUrl = 'https://goodreads12.p.rapidapi.com';
  
  async getBookByID(bookId: string): Promise<BookResult | null> {
    try {
      console.log('Fetching Goodreads book:', bookId);
      
      const response = await fetch(`${this.baseUrl}/getBookByID?bookID=${bookId}`, {
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': RAPIDAPI_KEY,
        },
      });

      if (!response.ok) {
        console.error(`Goodreads API error: ${response.status}`);
        return null;
      }

      const data: GoodreadsBookResponse = await response.json();
      
      return this.transformToBookResult(data);
    } catch (error) {
      console.error('Error fetching from Goodreads:', error);
      return null;
    }
  }

  async searchBooks(query: string): Promise<BookResult[]> {
    try {
      console.log('Searching Goodreads:', query);
      
      const response = await fetch(`${this.baseUrl}/searchBooks?keyword=${encodeURIComponent(query)}`, {
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': RAPIDAPI_KEY,
        },
      });

      if (!response.ok) {
        console.error(`Goodreads search error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      if (!data || !Array.isArray(data)) {
        return [];
      }

      return data.map(book => this.transformToBookResult(book)).filter(book => book !== null) as BookResult[];
    } catch (error) {
      console.error('Error searching Goodreads:', error);
      return [];
    }
  }

  private transformToBookResult(data: GoodreadsBookResponse): BookResult | null {
    if (!data.legacyId || !data.title) {
      return null;
    }

    const author = data.primaryContributorEdge?.node?.name;
    const genres = data.bookGenres?.map(g => g.name) || [];
    const publishDate = data.details?.publicationTime 
      ? new Date(data.details.publicationTime * 1000).getFullYear().toString()
      : undefined;

    return {
      id: `goodreads_${data.legacyId}`,
      title: data.title,
      authors: author ? [author] : [],
      description: data.description,
      publishedDate: publishDate,
      pageCount: data.details?.numPages,
      categories: genres,
      imageLinks: data.imageUrl ? {
        thumbnail: data.imageUrl,
        small: data.imageUrl,
        medium: data.imageUrl,
        large: data.imageUrl,
        extraLarge: data.imageUrl,
      } : undefined,
      averageRating: data.stats?.averageRating,
      ratingsCount: data.stats?.ratingsCount,
      language: 'en',
      isbn: data.details?.isbn,
      source: 'goodreads' as any,
    };
  }
}

export const goodreadsService = new GoodreadsService();
