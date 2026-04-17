import type { BookConfiguration } from '@/lib/types/studio';
import {
  type LockableSeriesField,
  type SeriesSharedConfig,
} from '@/lib/types/series';

/**
 * Read a value at a dot-path (e.g. "writingStyle.tone") from any object.
 */
function getAtPath(obj: any, path: string): unknown {
  return path.split('.').reduce<any>((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

/**
 * Set a value at a dot-path on a draft object, creating intermediate
 * objects as needed. Mutates `target`.
 */
function setAtPath(target: any, path: string, value: unknown): void {
  const keys = path.split('.');
  let cursor = target;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (cursor[key] == null || typeof cursor[key] !== 'object') {
      cursor[key] = {};
    }
    cursor = cursor[key];
  }
  cursor[keys[keys.length - 1]] = value;
}

/**
 * Map of `SeriesSharedConfig` source path to the corresponding
 * `BookConfiguration` destination dot-path. Top-level keys mirror
 * `LOCKABLE_SERIES_FIELDS` so the same paths can be used for locking.
 */
const FIELD_TO_BOOK_PATH: Record<string, string> = {
  'author': 'basicInfo.author',
  'genre': 'basicInfo.genre',
  'subGenre': 'basicInfo.subGenre',
  'writingStyle.style': 'writingStyle.style',
  'writingStyle.tone': 'writingStyle.tone',
  'writingStyle.pov': 'writingStyle.pov',
  'writingStyle.tense': 'writingStyle.tense',
  'writingStyle.narrativeVoice': 'writingStyle.narrativeVoice',
  'setting.timePeriod': 'setting.timePeriod',
  'setting.location': 'setting.location',
  'setting.worldBuildingDepth': 'setting.worldBuildingDepth',
  'setting.culturalElements': 'setting.culturalElements',
  'themes.primary': 'themes.primary',
  'themes.secondary': 'themes.secondary',
  'themes.motifs': 'themes.motifs',
  'visuals.coverStyle': 'visuals.coverStyle',
  'visuals.coverColorScheme': 'visuals.coverColorScheme',
  'visuals.coverTypography': 'visuals.coverTypography',
};

const ALL_FIELD_PATHS = Object.keys(FIELD_TO_BOOK_PATH);

/**
 * Merge a series' shared config into a book configuration.
 *
 * - For locked fields: the series value always wins (overrides the book).
 * - For unlocked fields: the series value is used only if the book hasn't
 *   set its own value (book overrides allowed).
 *
 * Returns a new `BookConfiguration`; `config` is not mutated.
 */
export function applySeriesDefaults(
  config: BookConfiguration,
  shared: SeriesSharedConfig | null | undefined,
  lockedFields: readonly LockableSeriesField[] = []
): BookConfiguration {
  if (!shared) return config;

  // Deep clone via structuredClone (Node 18+) with JSON fallback.
  const next: BookConfiguration =
    typeof structuredClone === 'function'
      ? structuredClone(config)
      : JSON.parse(JSON.stringify(config));

  const lockedSet = new Set<string>(lockedFields);

  for (const path of ALL_FIELD_PATHS) {
    const seriesValue = getAtPath(shared, path);
    if (seriesValue === undefined || seriesValue === null) continue;

    const bookPath = FIELD_TO_BOOK_PATH[path];
    const bookValue = getAtPath(next, bookPath);
    const isLocked = lockedSet.has(path);
    const bookEmpty =
      bookValue === undefined ||
      bookValue === null ||
      bookValue === '' ||
      (Array.isArray(bookValue) && bookValue.length === 0);

    if (isLocked || bookEmpty) {
      setAtPath(next, bookPath, seriesValue);
    }
  }

  return next;
}

/**
 * Server-side enforcement: for every locked field, copy the series value
 * onto the book config (regardless of what the client sent). Returns a
 * new `BookConfiguration`.
 *
 * Use this in book-creation API routes as defense-in-depth so a malicious
 * client can't bypass the studio UI's read-only fields.
 */
export function enforceSeriesLocks(
  config: BookConfiguration,
  shared: SeriesSharedConfig | null | undefined,
  lockedFields: readonly LockableSeriesField[] = []
): BookConfiguration {
  if (!shared || lockedFields.length === 0) return config;

  const next: BookConfiguration =
    typeof structuredClone === 'function'
      ? structuredClone(config)
      : JSON.parse(JSON.stringify(config));

  for (const path of lockedFields) {
    const seriesValue = getAtPath(shared, path);
    if (seriesValue === undefined) continue;
    const bookPath = FIELD_TO_BOOK_PATH[path];
    if (!bookPath) continue;
    setAtPath(next, bookPath, seriesValue);
  }
  return next;
}

/**
 * Build a `SeriesSharedConfig` snapshot from an existing book's configuration.
 * Used by "Promote to new series" so the new series inherits the source book's
 * style/world/themes.
 */
export function buildSharedConfigFromBook(config: BookConfiguration): SeriesSharedConfig {
  return {
    author: config.basicInfo?.author,
    genre: config.basicInfo?.genre,
    subGenre: config.basicInfo?.subGenre,
    writingStyle: config.writingStyle,
    setting: config.setting,
    themes: config.themes,
    visuals: {
      coverStyle: config.visuals?.coverStyle,
      coverColorScheme: config.visuals?.coverColorScheme,
      coverTypography: config.visuals?.coverTypography,
    },
  };
}

export { FIELD_TO_BOOK_PATH as SERIES_FIELD_TO_BOOK_PATH };
