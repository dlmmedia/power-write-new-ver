import { BookResult } from '../services/google-books';
import { SelectedBook } from '../types/book';

export function convertToSelectedBook(book: BookResult): SelectedBook {
  return {
    id: book.id,
    title: book.title,
    authors: book.authors,
    genre: book.categories?.[0],
    description: book.description,
    imageUrl: book.imageLinks?.medium || book.imageLinks?.thumbnail,
    publishedDate: book.publishedDate,
    pageCount: book.pageCount,
    averageRating: book.averageRating,
    language: book.language,
    publisher: book.publisher,
    categories: book.categories,
  };
}
