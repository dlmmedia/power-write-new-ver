// Bibliography Store - Zustand store for managing references and citations

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Reference,
  InTextCitation,
  BibliographyConfig,
  BookBibliography,
  ChapterReferences,
  defaultBibliographyConfig,
  ReferenceType,
  CitationStyle,
} from '@/lib/types/bibliography';

interface BibliographyState {
  // Current book's bibliography
  bookId: number | null;
  config: BibliographyConfig;
  references: Reference[];
  citations: InTextCitation[];
  chapterReferences: ChapterReferences[];

  // Actions
  setBookId: (bookId: number) => void;
  updateConfig: (config: Partial<BibliographyConfig>) => void;
  
  // Reference management
  addReference: (reference: Reference) => void;
  updateReference: (id: string, updates: Partial<Reference>) => void;
  deleteReference: (id: string) => void;
  getReference: (id: string) => Reference | undefined;
  getReferencesByType: (type: ReferenceType) => Reference[];
  
  // Citation management
  addCitation: (citation: InTextCitation) => void;
  updateCitation: (id: string, updates: Partial<InTextCitation>) => void;
  deleteCitation: (id: string) => void;
  getCitationsByChapter: (chapterId: number) => InTextCitation[];
  getCitationsForReference: (referenceId: string) => InTextCitation[];
  
  // Chapter references
  getChapterReferences: (chapterId: number) => ChapterReferences | undefined;
  updateChapterReferences: (chapterId: number, references: ChapterReferences) => void;
  
  // Bulk operations
  importReferences: (references: Reference[]) => void;
  exportReferences: () => Reference[];
  clearAll: () => void;
  
  // Load from database
  loadBibliography: (bibliography: BookBibliography) => void;
  
  // Get bibliography for export
  getBibliography: () => BookBibliography;
}

export const useBibliographyStore = create<BibliographyState>()(
  persist(
    (set, get) => ({
      bookId: null,
      config: defaultBibliographyConfig,
      references: [],
      citations: [],
      chapterReferences: [],

      setBookId: (bookId) => set({ bookId }),

      updateConfig: (configUpdates) =>
        set((state) => ({
          config: { ...state.config, ...configUpdates },
        })),

      // Reference management
      addReference: (reference) =>
        set((state) => ({
          references: [...state.references, reference],
        })),

      updateReference: (id, updates) =>
        set((state) => ({
          references: state.references.map((ref) =>
            ref.id === id ? { ...ref, ...updates, updatedAt: new Date() } as Reference : ref
          ),
        })),

      deleteReference: (id) =>
        set((state) => ({
          references: state.references.filter((ref) => ref.id !== id),
          citations: state.citations.filter((cit) => cit.referenceId !== id),
        })),

      getReference: (id) => {
        return get().references.find((ref) => ref.id === id);
      },

      getReferencesByType: (type) => {
        return get().references.filter((ref) => ref.type === type);
      },

      // Citation management
      addCitation: (citation) =>
        set((state) => ({
          citations: [...state.citations, citation],
        })),

      updateCitation: (id, updates) =>
        set((state) => ({
          citations: state.citations.map((cit) =>
            cit.id === id ? { ...cit, ...updates } : cit
          ),
        })),

      deleteCitation: (id) =>
        set((state) => ({
          citations: state.citations.filter((cit) => cit.id !== id),
        })),

      getCitationsByChapter: (chapterId) => {
        return get().citations.filter((cit) => cit.chapterId === chapterId);
      },

      getCitationsForReference: (referenceId) => {
        return get().citations.filter((cit) => cit.referenceId === referenceId);
      },

      // Chapter references
      getChapterReferences: (chapterId) => {
        return get().chapterReferences.find((cr) => cr.chapterId === chapterId);
      },

      updateChapterReferences: (chapterId, references) =>
        set((state) => {
          const existing = state.chapterReferences.find(
            (cr) => cr.chapterId === chapterId
          );
          if (existing) {
            return {
              chapterReferences: state.chapterReferences.map((cr) =>
                cr.chapterId === chapterId ? references : cr
              ),
            };
          } else {
            return {
              chapterReferences: [...state.chapterReferences, references],
            };
          }
        }),

      // Bulk operations
      importReferences: (references) =>
        set((state) => ({
          references: [...state.references, ...references],
        })),

      exportReferences: () => {
        return get().references;
      },

      clearAll: () =>
        set({
          references: [],
          citations: [],
          chapterReferences: [],
        }),

      // Load from database
      loadBibliography: (bibliography) =>
        set({
          bookId: bibliography.bookId,
          config: bibliography.config,
          references: bibliography.references,
          chapterReferences: bibliography.chapterReferences,
          citations: bibliography.chapterReferences.flatMap((cr) => cr.citations),
        }),

      // Get bibliography for export
      getBibliography: () => {
        const state = get();
        return {
          bookId: state.bookId!,
          config: state.config,
          references: state.references,
          chapterReferences: state.chapterReferences,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      },
    }),
    {
      name: 'bibliography-storage',
      partialize: (state) => ({
        bookId: state.bookId,
        config: state.config,
        references: state.references,
        citations: state.citations,
        chapterReferences: state.chapterReferences,
      }),
    }
  )
);

// Helper functions for creating references
export function createReferenceId(): string {
  return `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createCitationId(): string {
  return `cit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to create a new reference with defaults
export function createNewReference(type: ReferenceType): Partial<Reference> {
  const now = new Date();
  return {
    id: createReferenceId(),
    type,
    title: '',
    authors: [],
    createdAt: now,
    updatedAt: now,
  };
}

// Helper to create a new citation
export function createNewCitation(
  referenceId: string,
  chapterId?: number,
  position: number = 0
): InTextCitation {
  return {
    id: createCitationId(),
    referenceId,
    chapterId,
    position,
    createdAt: new Date(),
  };
}

// Export/Import helpers
export function exportBibliographyToJSON(bibliography: BookBibliography): string {
  return JSON.stringify(bibliography, null, 2);
}

export function importBibliographyFromJSON(json: string): BookBibliography {
  const data = JSON.parse(json);
  // Convert date strings back to Date objects
  data.createdAt = new Date(data.createdAt);
  data.updatedAt = new Date(data.updatedAt);
  data.references = data.references.map((ref: any) => ({
    ...ref,
    createdAt: new Date(ref.createdAt),
    updatedAt: new Date(ref.updatedAt),
  }));
  data.chapterReferences = data.chapterReferences.map((cr: any) => ({
    ...cr,
    citations: cr.citations.map((cit: any) => ({
      ...cit,
      createdAt: new Date(cit.createdAt),
    })),
  }));
  return data;
}

// BibTeX export helper
export function exportToBibTeX(references: Reference[]): string {
  let bibtex = '';
  
  references.forEach((ref) => {
    const key = ref.citationKey || `${ref.authors[0]?.lastName || 'Unknown'}${ref.year || 'nd'}`;
    const authors = ref.authors
      .map((a) => `${a.firstName || ''} ${a.lastName}`.trim())
      .join(' and ');
    
    bibtex += `@${ref.type}{${key},\n`;
    bibtex += `  author = {${authors}},\n`;
    bibtex += `  title = {${ref.title}},\n`;
    if (ref.year) bibtex += `  year = {${ref.year}},\n`;
    
    // Type-specific fields
    if (ref.type === 'book') {
      const book = ref as any;
      if (book.publisher) bibtex += `  publisher = {${book.publisher}},\n`;
      if (book.isbn) bibtex += `  isbn = {${book.isbn}},\n`;
    } else if (ref.type === 'journal') {
      const journal = ref as any;
      if (journal.journalTitle) bibtex += `  journal = {${journal.journalTitle}},\n`;
      if (journal.volume) bibtex += `  volume = {${journal.volume}},\n`;
      if (journal.pages) bibtex += `  pages = {${journal.pages}},\n`;
    }
    
    if (ref.doi) bibtex += `  doi = {${ref.doi}},\n`;
    if (ref.url) bibtex += `  url = {${ref.url}},\n`;
    
    bibtex += '}\n\n';
  });
  
  return bibtex;
}

// RIS export helper
export function exportToRIS(references: Reference[]): string {
  let ris = '';
  
  references.forEach((ref) => {
    // Type mapping
    const typeMap: Record<string, string> = {
      book: 'BOOK',
      journal: 'JOUR',
      website: 'ELEC',
      conference: 'CONF',
      thesis: 'THES',
      report: 'RPRT',
      patent: 'PAT',
    };
    
    ris += `TY  - ${typeMap[ref.type] || 'GEN'}\n`;
    
    ref.authors.forEach((author) => {
      ris += `AU  - ${author.lastName}, ${author.firstName || ''}\n`;
    });
    
    ris += `TI  - ${ref.title}\n`;
    if (ref.year) ris += `PY  - ${ref.year}\n`;
    
    // Type-specific fields
    if (ref.type === 'book') {
      const book = ref as any;
      if (book.publisher) ris += `PB  - ${book.publisher}\n`;
      if (book.isbn) ris += `SN  - ${book.isbn}\n`;
    } else if (ref.type === 'journal') {
      const journal = ref as any;
      if (journal.journalTitle) ris += `JO  - ${journal.journalTitle}\n`;
      if (journal.volume) ris += `VL  - ${journal.volume}\n`;
      if (journal.pages) ris += `SP  - ${journal.pages.split('-')[0]}\n`;
    }
    
    if (ref.doi) ris += `DO  - ${ref.doi}\n`;
    if (ref.url) ris += `UR  - ${ref.url}\n`;
    
    ris += 'ER  - \n\n';
  });
  
  return ris;
}

