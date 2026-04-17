/**
 * Shared helper that turns a book row + its chapters into the
 * `BookExport` payload that ExportServiceAdvanced expects.
 *
 * Used by:
 *   - Synchronous /api/books/export route (TXT/MD/HTML/DOCX path)
 *   - Asynchronous export-book queue processor (PDF/EPUB path)
 *
 * Keeping this in one place ensures both paths produce byte-identical
 * exports for the same book.
 */
import { getBookWithChaptersAndBibliography } from '@/lib/db/operations';
import type {
  BibliographyConfig,
  Reference,
  Author,
} from '@/lib/types/bibliography';
import {
  type PublishingSettings,
  DEFAULT_PUBLISHING_SETTINGS,
} from '@/lib/types/publishing';
import { type BookLayoutType } from '@/lib/types/book-layouts';

export interface BookExportPayload {
  title: string;
  author: string;
  description: string;
  genre: string;
  coverUrl?: string;
  backCoverUrl?: string;
  chapters: Array<{ number: number; title: string; content: string }>;
  frontMatter: Array<{
    number: number;
    title: string;
    content: string;
    slug: string | null;
  }>;
  backMatter: Array<{
    number: number;
    title: string;
    content: string;
    slug: string | null;
  }>;
  bibliography?: { config: BibliographyConfig; references: Reference[] };
  publishingSettings: PublishingSettings;
  layoutType: BookLayoutType;
}

export async function loadBookExportPayload(
  bookId: number | string,
  layoutTypeOverride?: BookLayoutType,
): Promise<{
  book: NonNullable<Awaited<ReturnType<typeof getBookWithChaptersAndBibliography>>>;
  payload: BookExportPayload;
} | null> {
  const book = await getBookWithChaptersAndBibliography(bookId);
  if (!book) return null;

  let bibliographyData: BookExportPayload['bibliography'] | undefined;
  if (book.bibliography?.config?.enabled && book.bibliography.references.length > 0) {
    const refs: Reference[] = book.bibliography.references.map((ref) => {
      const authors: Author[] = Array.isArray(ref.authors)
        ? (ref.authors as unknown as Array<Record<string, unknown>>).map((a) => ({
            firstName: typeof a.firstName === 'string' ? a.firstName : '',
            middleName: typeof a.middleName === 'string' ? a.middleName : undefined,
            lastName: typeof a.lastName === 'string' ? a.lastName : '',
            suffix: typeof a.suffix === 'string' ? a.suffix : undefined,
            organization:
              typeof a.organization === 'string' ? a.organization : undefined,
          }))
        : [];

      const typeData = (ref.typeSpecificData as Record<string, unknown>) || {};

      return {
        id: ref.id,
        type: ref.type as Reference['type'],
        title: ref.title,
        authors,
        year: ref.year ?? undefined,
        url: ref.url ?? undefined,
        doi: ref.doi ?? undefined,
        accessDate: ref.accessDate ?? undefined,
        notes: ref.notes ?? undefined,
        tags: Array.isArray(ref.tags) ? (ref.tags as string[]) : undefined,
        citationKey: ref.citationKey ?? undefined,
        createdAt: ref.createdAt ?? new Date(),
        updatedAt: ref.updatedAt ?? new Date(),
        ...typeData,
      } as Reference;
    });

    const cfg = book.bibliography.config;
    const config: BibliographyConfig = {
      enabled: cfg.enabled || false,
      citationStyle:
        (cfg.citationStyle as BibliographyConfig['citationStyle']) || 'APA',
      location: Array.isArray(cfg.location)
        ? (cfg.location as BibliographyConfig['location'])
        : ['bibliography'],
      sortBy: (cfg.sortBy as BibliographyConfig['sortBy']) || 'author',
      sortDirection:
        (cfg.sortDirection as BibliographyConfig['sortDirection']) || 'asc',
      includeAnnotations: cfg.includeAnnotations || false,
      includeAbstracts: cfg.includeAbstracts || false,
      hangingIndent: cfg.hangingIndent ?? true,
      lineSpacing:
        (cfg.lineSpacing as BibliographyConfig['lineSpacing']) || 'single',
      groupByType: cfg.groupByType || false,
      numberingStyle:
        (cfg.numberingStyle as BibliographyConfig['numberingStyle']) || 'none',
      showDOI: cfg.showDOI ?? true,
      showURL: cfg.showURL ?? true,
      showAccessDate: cfg.showAccessDate ?? true,
    };

    bibliographyData = { config, references: refs };
  }

  const meta = (book.metadata as Record<string, unknown>) || {};
  const publishingSettings: PublishingSettings =
    (meta.publishingSettings as PublishingSettings) ?? DEFAULT_PUBLISHING_SETTINGS;
  const effectiveLayoutType: BookLayoutType =
    layoutTypeOverride ?? publishingSettings.layoutType ?? 'novel-classic';

  const sorted = [...book.chapters].sort(
    (a, b) => a.chapterNumber - b.chapterNumber,
  );
  const frontMatter = sorted
    .filter((ch) => ch.chapterType === 'front_matter')
    .map((ch) => ({
      number: ch.chapterNumber,
      title: ch.title,
      content: ch.content,
      slug: ch.slug ?? null,
    }));
  const backMatter = sorted
    .filter((ch) => ch.chapterType === 'back_matter')
    .map((ch) => ({
      number: ch.chapterNumber,
      title: ch.title,
      content: ch.content,
      slug: ch.slug ?? null,
    }));
  const chapters = sorted
    .filter((ch) => (ch.chapterType ?? 'chapter') === 'chapter')
    .map((ch) => ({
      number: ch.chapterNumber,
      title: ch.title,
      content: ch.content,
    }));

  const payload: BookExportPayload = {
    title: book.title,
    author: book.author || 'Unknown Author',
    description: book.summary || '',
    genre: book.genre || 'Unknown Genre',
    coverUrl: book.coverUrl || undefined,
    backCoverUrl: (meta.backCoverUrl as string) || undefined,
    chapters,
    frontMatter,
    backMatter,
    bibliography: bibliographyData,
    publishingSettings,
    layoutType: effectiveLayoutType,
  };

  return { book, payload };
}
