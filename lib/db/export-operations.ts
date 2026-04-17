/**
 * DB operations for asynchronous PDF/EPUB exports tracked in
 * the `book_exports` table.
 *
 * The processor writes one row per requested export and the UI
 * reads them back to render the Downloads tray on /library/[id].
 */
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from './index';
import { bookExports, type BookExportRecord } from './schema';

export type ExportStatus = 'pending' | 'active' | 'completed' | 'failed';
export type ExportFormat = 'pdf' | 'epub';

export interface CreateExportRowInput {
  bookId: number;
  userId: string;
  format: ExportFormat;
  layoutType?: string;
  jobId?: string | null;
}

export async function createExportRow(
  input: CreateExportRowInput,
): Promise<BookExportRecord> {
  const [row] = await db
    .insert(bookExports)
    .values({
      bookId: input.bookId,
      userId: input.userId,
      format: input.format,
      status: 'pending',
      layoutType: input.layoutType,
      jobId: input.jobId ?? null,
    })
    .returning();
  return row;
}

export async function markExportActive(id: number): Promise<void> {
  await db
    .update(bookExports)
    .set({ status: 'active' })
    .where(eq(bookExports.id, id));
}

export async function markExportCompleted(
  id: number,
  fileUrl: string,
  fileSize: number,
): Promise<void> {
  await db
    .update(bookExports)
    .set({
      status: 'completed',
      fileUrl,
      fileSize,
      completedAt: sql`now()`,
    })
    .where(eq(bookExports.id, id));
}

export async function markExportFailed(
  id: number,
  errorMessage: string,
): Promise<void> {
  await db
    .update(bookExports)
    .set({
      status: 'failed',
      errorMessage: errorMessage.slice(0, 2000),
      completedAt: sql`now()`,
    })
    .where(eq(bookExports.id, id));
}

/**
 * Lookup by BullMQ job id. Used by the worker so the processor doesn't
 * need to know its own DB row id ahead of time. Returns null if no row
 * is tracking this job (e.g. the row was manually deleted).
 */
export async function getExportRowByJobId(
  jobId: string,
): Promise<BookExportRecord | null> {
  const rows = await db
    .select()
    .from(bookExports)
    .where(eq(bookExports.jobId, jobId))
    .limit(1);
  return rows[0] ?? null;
}

export async function listExportsForBook(
  bookId: number,
  userId: string,
  limit = 20,
): Promise<BookExportRecord[]> {
  return db
    .select()
    .from(bookExports)
    .where(and(eq(bookExports.bookId, bookId), eq(bookExports.userId, userId)))
    .orderBy(desc(bookExports.createdAt))
    .limit(limit);
}

export async function getExportRow(
  id: number,
  userId: string,
): Promise<BookExportRecord | null> {
  const rows = await db
    .select()
    .from(bookExports)
    .where(and(eq(bookExports.id, id), eq(bookExports.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}
