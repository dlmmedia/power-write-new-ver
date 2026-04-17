/**
 * Backfill Series from existing books.
 *
 * For every user, group their books by `config.basicInfo.series.name`.
 * Any group with a non-empty name and at least one book becomes a real Series:
 *   - The series is created (with sharedConfig seeded from the earliest book)
 *   - Each book is linked to the series via `seriesId`
 *   - `seriesNumber` is filled from `config.basicInfo.series.bookNumber` when present,
 *     otherwise assigned in createdAt order.
 *
 * Skips books that are already linked to a series.
 *
 * Usage:
 *   npx tsx scripts/backfill-series.ts            # dry-run (preview only)
 *   npx tsx scripts/backfill-series.ts --apply    # actually write changes
 */

import { db } from '../lib/db';
import { generatedBooks, bookSeries } from '../lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { buildSharedConfigFromBook } from '../lib/utils/apply-series-defaults';
import type { BookConfiguration } from '../lib/types/studio';

const APPLY = process.argv.includes('--apply');

interface CandidateBook {
  id: number;
  userId: string;
  title: string;
  coverUrl: string | null;
  config: BookConfiguration | null;
  createdAt: Date | null;
  seriesNumberFromConfig: number | null;
  seriesName: string;
}

function getSeriesNameFromConfig(cfg: any): string | null {
  const name = cfg?.basicInfo?.series?.name;
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getBookNumberFromConfig(cfg: any): number | null {
  const n = cfg?.basicInfo?.series?.bookNumber;
  const parsed = typeof n === 'number' ? n : Number(n);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

async function main() {
  console.log(`=== Backfill Series ===`);
  console.log(APPLY ? 'Mode: APPLY (writes will be performed)' : 'Mode: DRY-RUN (no writes)');
  console.log('');

  const rows = await db
    .select({
      id: generatedBooks.id,
      userId: generatedBooks.userId,
      title: generatedBooks.title,
      coverUrl: generatedBooks.coverUrl,
      config: generatedBooks.config,
      createdAt: generatedBooks.createdAt,
      seriesId: generatedBooks.seriesId,
    })
    .from(generatedBooks)
    .where(isNull(generatedBooks.seriesId));

  const candidates: CandidateBook[] = [];
  for (const row of rows) {
    const seriesName = getSeriesNameFromConfig(row.config);
    if (!seriesName) continue;
    candidates.push({
      id: row.id,
      userId: row.userId,
      title: row.title,
      coverUrl: row.coverUrl,
      config: (row.config as BookConfiguration | null) || null,
      createdAt: row.createdAt,
      seriesNumberFromConfig: getBookNumberFromConfig(row.config),
      seriesName,
    });
  }

  console.log(`Found ${candidates.length} unlinked book(s) with a series name in config.`);

  // Group by (userId, lowercase seriesName) so trivial casing differences merge.
  const groups = new Map<string, CandidateBook[]>();
  for (const c of candidates) {
    const key = `${c.userId}::${c.seriesName.toLowerCase()}`;
    const arr = groups.get(key) || [];
    arr.push(c);
    groups.set(key, arr);
  }

  console.log(`=> ${groups.size} candidate series group(s).\n`);

  let createdSeries = 0;
  let attachedBooks = 0;

  for (const [key, books] of groups.entries()) {
    const [userId, lowerName] = key.split('::');
    const displayName = books[0].seriesName;

    books.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ta - tb;
    });

    console.log(`Series: "${displayName}" (user=${userId}) — ${books.length} book(s)`);
    for (const b of books) {
      console.log(`   - [${b.id}] "${b.title}" (cfg #${b.seriesNumberFromConfig ?? '-'})`);
    }

    // Skip if a series with the same (case-insensitive) name already exists for this user.
    const existing = await db
      .select()
      .from(bookSeries)
      .where(and(eq(bookSeries.userId, userId), eq(bookSeries.name, displayName)))
      .limit(1);

    let seriesId: number | null = existing.length > 0 ? existing[0].id : null;
    if (seriesId) {
      console.log(`   ! A series named "${displayName}" already exists (id=${seriesId}); reusing it.`);
    } else if (APPLY) {
      const sharedConfig = books[0].config ? buildSharedConfigFromBook(books[0].config) : null;
      const [created] = await db
        .insert(bookSeries)
        .values({
          userId,
          name: displayName,
          description: null,
          coverUrl: books[0].coverUrl,
          sharedConfig,
          lockedFields: [],
          status: 'ongoing',
          isPublic: false,
        })
        .returning();
      seriesId = created.id;
      createdSeries += 1;
      console.log(`   + Created series id=${seriesId}`);
    } else {
      console.log(`   + (would create series; sharedConfig seeded from book ${books[0].id})`);
    }

    // Determine seriesNumber per book (use config-provided number, otherwise sequential).
    const used = new Set<number>();
    let nextAuto = 1;
    for (const b of books) {
      let num = b.seriesNumberFromConfig;
      if (num == null || used.has(num)) {
        while (used.has(nextAuto)) nextAuto += 1;
        num = nextAuto;
      }
      used.add(num);

      if (APPLY && seriesId) {
        await db
          .update(generatedBooks)
          .set({ seriesId, seriesNumber: num })
          .where(eq(generatedBooks.id, b.id));
        attachedBooks += 1;
      }
      console.log(`   ${APPLY ? '+' : '~'} Link book ${b.id} as #${num}`);
    }
    console.log('');
  }

  console.log('=== Summary ===');
  if (APPLY) {
    console.log(`Created ${createdSeries} new series.`);
    console.log(`Linked ${attachedBooks} books.`);
  } else {
    console.log(`Dry-run complete. Re-run with --apply to make changes.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
  });
