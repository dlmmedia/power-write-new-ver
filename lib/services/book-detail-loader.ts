/**
 * Shared loader for a single book + chapters + bibliography.
 *
 * Used by both:
 *   - /api/books/[id] GET (legacy client-fetch path, kept for mutations
 *     and any external consumers)
 *   - app/library/[id]/page.tsx (server-side first paint)
 *
 * Returns the same shape the client code already expects (the BookDetail
 * type defined in contexts/BooksContext.tsx, modulo a couple of optional
 * fields the API route was already adding ad hoc).
 */

import {
  getBookWithChaptersAndBibliography,
} from '@/lib/db/operations';
import type {
  BibliographyConfig,
  Reference,
  Author,
} from '@/lib/types/bibliography';

export interface DetailChapter {
  id: number;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  status: 'draft' | 'edited';
  chapterType: 'chapter' | 'front_matter' | 'back_matter';
  slug: string | null;
  audioUrl: string | null;
  audioDuration: number | null;
  audioMetadata: unknown | null;
  audioTimestamps: unknown | null;
}

export interface BookDetailLoad {
  id: number;
  title: string;
  author: string;
  genre: string;
  subgenre: string;
  status: string;
  productionStatus: string;
  coverUrl?: string;
  backCoverUrl?: string;
  isPublic: boolean;
  isOwner: boolean;
  createdAt: string;
  metadata: {
    wordCount: number;
    chapters: number;
    targetWordCount: number;
    description: string;
    backCoverUrl?: string;
    modelUsed?: string;
  };
  chapters: DetailChapter[];
  bibliography?: { config: BibliographyConfig; references: Reference[] };
}

export interface DetailUserContext {
  clerkUserId: string | null;
  effectiveUserId: string | null;
}

/**
 * Load + format a single book by id. Returns null when the book doesn't
 * exist (caller decides 404 vs other handling).
 */
export async function loadBookDetail(
  bookId: number,
  user: DetailUserContext,
): Promise<BookDetailLoad | null> {
  const bookWithChapters = await getBookWithChaptersAndBibliography(bookId);
  if (!bookWithChapters) return null;

  const metadata = (bookWithChapters.metadata as Record<string, unknown>) || {};

  let bibliographyData:
    | { config: BibliographyConfig; references: Reference[] }
    | undefined;

  if (
    bookWithChapters.bibliography?.config?.enabled &&
    bookWithChapters.bibliography.references.length > 0
  ) {
    const convertedReferences: Reference[] =
      bookWithChapters.bibliography.references.map((ref) => {
        const authors: Author[] = Array.isArray(ref.authors)
          ? (ref.authors as Array<Record<string, unknown>>).map((a) => ({
              firstName: (a.firstName as string) || '',
              middleName: a.middleName as string | undefined,
              lastName: (a.lastName as string) || '',
              suffix: a.suffix as string | undefined,
              organization: a.organization as string | undefined,
            }))
          : [];

        const typeData =
          (ref.typeSpecificData as Record<string, unknown>) || {};

        const baseRef = {
          id: ref.id,
          // Reference type is a discriminated union — cast intentional;
          // upstream DB column is a free-form string.
          type: ref.type as Reference['type'],
          title: ref.title,
          authors,
          year: ref.year || undefined,
          url: ref.url || undefined,
          doi: ref.doi || undefined,
          accessDate: ref.accessDate || undefined,
          notes: ref.notes || undefined,
          tags: Array.isArray(ref.tags) ? (ref.tags as string[]) : undefined,
          citationKey: ref.citationKey || undefined,
          createdAt: ref.createdAt || new Date(),
          updatedAt: ref.updatedAt || new Date(),
          ...typeData,
        };

        return baseRef as Reference;
      });

    const config = bookWithChapters.bibliography.config;
    const bibliographyConfig: BibliographyConfig = {
      enabled: config.enabled || false,
      citationStyle: (config.citationStyle as BibliographyConfig['citationStyle']) || 'APA',
      location: Array.isArray(config.location)
        ? (config.location as BibliographyConfig['location'])
        : ['bibliography'],
      sortBy: (config.sortBy as BibliographyConfig['sortBy']) || 'author',
      sortDirection:
        (config.sortDirection as BibliographyConfig['sortDirection']) || 'asc',
      includeAnnotations: config.includeAnnotations || false,
      includeAbstracts: config.includeAbstracts || false,
      hangingIndent: config.hangingIndent ?? true,
      lineSpacing:
        (config.lineSpacing as BibliographyConfig['lineSpacing']) || 'single',
      groupByType: config.groupByType || false,
      numberingStyle:
        (config.numberingStyle as BibliographyConfig['numberingStyle']) ||
        'none',
      showDOI: config.showDOI ?? true,
      showURL: config.showURL ?? true,
      showAccessDate: config.showAccessDate ?? true,
    };

    bibliographyData = { config: bibliographyConfig, references: convertedReferences };
  }

  const isOwner =
    user.clerkUserId !== null &&
    (bookWithChapters.userId === user.clerkUserId ||
      bookWithChapters.userId === user.effectiveUserId);

  return {
    id: bookWithChapters.id,
    title: bookWithChapters.title,
    // The DB columns are nullable for legacy reasons; coerce empty strings so
    // the UI consumers don't have to deal with `null`.
    author: bookWithChapters.author ?? '',
    genre: bookWithChapters.genre ?? '',
    subgenre: '',
    status: bookWithChapters.status ?? 'draft',
    productionStatus: bookWithChapters.productionStatus || 'draft',
    coverUrl: bookWithChapters.coverUrl || undefined,
    backCoverUrl: (metadata.backCoverUrl as string) || undefined,
    isPublic: bookWithChapters.isPublic || false,
    isOwner,
    createdAt:
      bookWithChapters.createdAt?.toISOString() || new Date().toISOString(),
    metadata: {
      wordCount: (metadata.wordCount as number) || 0,
      // Use the live chapter count (filtered to real chapters), not the
      // potentially-stale snapshot in metadata.
      chapters: bookWithChapters.chapters.filter(
        (ch) => (ch.chapterType ?? 'chapter') === 'chapter',
      ).length,
      targetWordCount: (metadata.targetWordCount as number) || 0,
      description: bookWithChapters.summary || '',
      backCoverUrl: (metadata.backCoverUrl as string) || undefined,
      modelUsed: (metadata.modelUsed as string) || undefined,
    },
    chapters: bookWithChapters.chapters.map((ch) => ({
      id: ch.id,
      number: ch.chapterNumber,
      title: ch.title,
      content: ch.content,
      wordCount: ch.wordCount || 0,
      status: ch.isEdited ? 'edited' : 'draft',
      // chapter_type is a free-form varchar in the DB; the discriminated
      // union here narrows it for downstream consumers. Anything outside
      // the known set falls back to 'chapter'.
      chapterType: ((): 'chapter' | 'front_matter' | 'back_matter' => {
        const raw = ch.chapterType ?? 'chapter';
        return raw === 'front_matter' || raw === 'back_matter' ? raw : 'chapter';
      })(),
      slug: ch.slug || null,
      audioUrl: ch.audioUrl || null,
      audioDuration: ch.audioDuration || null,
      audioMetadata: ch.audioMetadata || null,
      audioTimestamps: ch.audioTimestamps || null,
    })),
    bibliography: bibliographyData,
  };
}
