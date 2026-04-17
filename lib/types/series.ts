import type { BookConfiguration } from './studio';

/**
 * Status of a series.
 * - ongoing: actively adding new books
 * - completed: series is finished
 * - hiatus: paused but not finished
 */
export type SeriesStatus = 'ongoing' | 'completed' | 'hiatus';

/**
 * Subset of `BookConfiguration` that can be shared across all books in a series.
 * Books in the series inherit these as defaults; if listed in `lockedFields`,
 * the per-book overrides are ignored server-side.
 */
export interface SeriesSharedConfig {
  // Author/identity
  author?: string;

  // Genre
  genre?: string;
  subGenre?: string;

  // Writing style (full block from BookConfiguration.writingStyle)
  writingStyle?: BookConfiguration['writingStyle'];

  // Setting / world (full block from BookConfiguration.setting)
  setting?: BookConfiguration['setting'];

  // Themes (full block from BookConfiguration.themes)
  themes?: BookConfiguration['themes'];

  // Visuals (cover style/colors/typography)
  visuals?: {
    coverStyle?: BookConfiguration['visuals']['coverStyle'];
    coverColorScheme?: string;
    coverTypography?: string;
  };
}

/**
 * Dot-path keys of `SeriesSharedConfig` that can be locked.
 * Locking a field means the per-book config cannot override it.
 */
export const LOCKABLE_SERIES_FIELDS = [
  'author',
  'genre',
  'subGenre',
  'writingStyle.style',
  'writingStyle.tone',
  'writingStyle.pov',
  'writingStyle.tense',
  'writingStyle.narrativeVoice',
  'setting.timePeriod',
  'setting.location',
  'setting.worldBuildingDepth',
  'setting.culturalElements',
  'themes.primary',
  'themes.secondary',
  'themes.motifs',
  'visuals.coverStyle',
  'visuals.coverColorScheme',
  'visuals.coverTypography',
] as const;

export type LockableSeriesField = typeof LOCKABLE_SERIES_FIELDS[number];

/**
 * Human-readable labels for the lockable fields, used in the
 * Series editor "locked fields" checklist UI.
 */
export const LOCKABLE_SERIES_FIELD_LABELS: Record<LockableSeriesField, string> = {
  'author': 'Author',
  'genre': 'Genre',
  'subGenre': 'Sub-Genre',
  'writingStyle.style': 'Writing Style',
  'writingStyle.tone': 'Tone',
  'writingStyle.pov': 'Point of View',
  'writingStyle.tense': 'Tense',
  'writingStyle.narrativeVoice': 'Narrative Voice',
  'setting.timePeriod': 'Time Period',
  'setting.location': 'Location',
  'setting.worldBuildingDepth': 'World-Building Depth',
  'setting.culturalElements': 'Cultural Elements',
  'themes.primary': 'Primary Themes',
  'themes.secondary': 'Secondary Themes',
  'themes.motifs': 'Motifs',
  'visuals.coverStyle': 'Cover Style',
  'visuals.coverColorScheme': 'Cover Color Scheme',
  'visuals.coverTypography': 'Cover Typography',
};

export interface Series {
  id: number;
  userId: string;
  name: string;
  description?: string | null;
  coverUrl?: string | null;
  sharedConfig?: SeriesSharedConfig | null;
  lockedFields?: LockableSeriesField[] | null;
  status: SeriesStatus;
  isPublic: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Series with its books attached (for detail page / generation context).
 */
export interface SeriesWithBooks extends Series {
  books: SeriesBookSummary[];
}

export interface SeriesBookSummary {
  id: number;
  title: string;
  seriesNumber: number | null;
  summary?: string | null;
  coverUrl?: string | null;
  status?: string | null;
  productionStatus?: string | null;
  createdAt?: Date | string | null;
}

export interface SeriesListItem extends Series {
  bookCount: number;
}

/**
 * Payload for creating a new series.
 */
export interface CreateSeriesInput {
  name: string;
  description?: string;
  coverUrl?: string;
  sharedConfig?: SeriesSharedConfig;
  lockedFields?: LockableSeriesField[];
  status?: SeriesStatus;
  isPublic?: boolean;
}

export type UpdateSeriesInput = Partial<CreateSeriesInput>;
