import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SelectedBook, BookFilters, BookSortOption } from '../types/book';

interface BookStore {
  // Selected books for reference
  selectedBooks: SelectedBook[];
  addBook: (book: SelectedBook) => void;
  removeBook: (id: string) => void;
  clearBooks: () => void;
  isBookSelected: (id: string) => boolean;

  // Search and filter state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  filters: BookFilters;
  setFilters: (filters: Partial<BookFilters>) => void;
  resetFilters: () => void;

  sortOption: BookSortOption;
  setSortOption: (option: BookSortOption) => void;

  // Active category
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

export const useBookStore = create<BookStore>()(
  persist(
    (set, get) => ({
      selectedBooks: [],
      
      addBook: (book) => {
        const { selectedBooks } = get();
        if (!selectedBooks.find((b) => b.id === book.id)) {
          set({ selectedBooks: [...selectedBooks, book] });
        }
      },

      removeBook: (id) => {
        set((state) => ({
          selectedBooks: state.selectedBooks.filter((book) => book.id !== id),
        }));
      },

      clearBooks: () => set({ selectedBooks: [] }),

      isBookSelected: (id) => {
        return get().selectedBooks.some((book) => book.id === id);
      },

      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),

      filters: {},
      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },
      resetFilters: () => set({ filters: {} }),

      sortOption: { field: 'relevance', direction: 'desc' },
      setSortOption: (option) => set({ sortOption: option }),

      activeCategory: 'bestsellers',
      setActiveCategory: (category) => set({ activeCategory: category }),
    }),
    {
      name: 'book-store',
      partialize: (state) => ({
        selectedBooks: state.selectedBooks,
      }),
    }
  )
);
