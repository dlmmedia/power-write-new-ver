import type { BookSeries, GeneratedBook } from '@/lib/db/schema';
import type { SeriesSharedConfig } from '@/lib/types/series';

/**
 * Build a "Series context" prompt block that the LLM can use to keep
 * style, world, and themes consistent across books in a series.
 *
 * Includes:
 * - Series name, this book's number, and total prior books
 * - Prior books' titles + 1-line summaries (in series order)
 * - Shared writing style / setting / themes from `sharedConfig`
 *
 * Returns an empty string if there's nothing meaningful to say
 * (no shared config and no prior books).
 */
export function buildSeriesContextBlock(args: {
  series: Pick<BookSeries, 'name' | 'description' | 'sharedConfig'>;
  thisBookNumber?: number | null;
  priorBooks: Array<Pick<GeneratedBook, 'title' | 'summary' | 'seriesNumber'>>;
}): string {
  const { series, thisBookNumber, priorBooks } = args;
  const shared = (series.sharedConfig || null) as SeriesSharedConfig | null;
  const lines: string[] = [];

  lines.push('--- SERIES CONTEXT ---');
  lines.push(`Series: "${series.name}"`);
  if (typeof thisBookNumber === 'number' && thisBookNumber > 0) {
    lines.push(`This book is #${thisBookNumber} in the series.`);
  }
  if (series.description) {
    lines.push(`Series description: ${series.description}`);
  }

  if (priorBooks.length > 0) {
    lines.push('');
    lines.push('Prior books in the series (maintain continuity with these):');
    const ordered = [...priorBooks].sort(
      (a, b) => (a.seriesNumber ?? 9999) - (b.seriesNumber ?? 9999),
    );
    for (const b of ordered) {
      const num = b.seriesNumber ? `#${b.seriesNumber}` : '';
      const title = b.title || 'Untitled';
      const summary = (b.summary || '').replace(/\s+/g, ' ').trim().slice(0, 280);
      lines.push(`- ${num} "${title}"${summary ? `: ${summary}` : ''}`.trim());
    }
  }

  if (shared) {
    const stylish: string[] = [];

    if (shared.writingStyle) {
      const ws = shared.writingStyle;
      const parts = [ws.style, ws.tone, ws.pov, ws.tense, ws.narrativeVoice].filter(Boolean);
      if (parts.length > 0) stylish.push(`Writing style: ${parts.join(', ')}`);
    }
    if (shared.setting) {
      const s = shared.setting;
      const parts = [s.timePeriod, s.location, s.worldBuildingDepth, s.culturalElements].filter(Boolean);
      if (parts.length > 0) stylish.push(`Setting: ${parts.join(', ')}`);
    }
    if (shared.themes) {
      const t = shared.themes;
      const parts = [
        Array.isArray(t.primary) && t.primary.length ? `primary themes: ${t.primary.join(', ')}` : null,
        Array.isArray(t.secondary) && t.secondary.length ? `secondary themes: ${t.secondary.join(', ')}` : null,
        Array.isArray(t.motifs) && t.motifs.length ? `motifs: ${t.motifs.join(', ')}` : null,
      ].filter(Boolean);
      if (parts.length > 0) stylish.push(`Themes: ${parts.join('; ')}`);
    }
    if (shared.author) stylish.push(`Series author: ${shared.author}`);
    if (shared.genre) stylish.push(`Genre: ${shared.genre}${shared.subGenre ? ` / ${shared.subGenre}` : ''}`);

    if (stylish.length > 0) {
      lines.push('');
      lines.push('Shared series style/world/themes (preserve these for consistency):');
      for (const s of stylish) lines.push(`- ${s}`);
    }
  }

  lines.push('');
  lines.push(
    'Maintain consistent voice, world, and themes with the series above. New plot/story is fine; the feel must stay continuous.',
  );
  lines.push('--- END SERIES CONTEXT ---');

  return lines.join('\n');
}
