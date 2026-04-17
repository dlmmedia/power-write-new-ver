/**
 * Job processor registry.
 *
 * Each processor is a pure async function over its payload. Workers wrap
 * these with retry, backoff, observability, and graceful shutdown.
 *
 * Processors should:
 *   - Be idempotent. BullMQ guarantees at-least-once execution; jobs may
 *     run multiple times after a crash. Use natural keys + UPSERTs.
 *   - Set / advance a status column on the affected DB row at start and
 *     finish so the UI can reflect progress without polling Redis.
 *   - Throw on unrecoverable errors. BullMQ will retry per the queue's
 *     `attempts` config and surface the final failure in the dashboard.
 *
 * IMPORTANT: This file MUST NOT be imported by any client / RSC route.
 * It pulls in heavy server-only deps (DB, AI service, etc.) and should
 * only be loaded by the worker entry point.
 */

import type { Job } from 'bullmq';
import { createLogger } from '../log';
import type { JobName, JobPayloads } from './queues';

const log = createLogger('queue/processors');

export type ProcessorMap = {
  [N in JobName]: (job: Job<JobPayloads[N]>) => Promise<unknown>;
};

/**
 * Stub processors. These return immediately with a "not yet implemented"
 * marker — the queue infrastructure is wired and tested, but the actual
 * generation logic is still inline in the SSE route.
 *
 * To activate a real processor:
 *   1. Replace the stub body with the real implementation.
 *   2. Move the equivalent inline code in the API route to a thin
 *      `enqueue()` call (with a fallback to inline if the queue is
 *      disabled — see `enqueue()` docstring).
 *   3. Update `lib/services/<feature>-service.ts` so both the inline
 *      caller and the worker share the same implementation.
 */
export const processors: ProcessorMap = {
  'generate-chapter': async (job) => {
    log.info(
      { jobId: job.id, payload: job.data, attempt: job.attemptsMade },
      'generate-chapter (stub)',
    );
    return { ok: true, stub: true };
  },

  'generate-book': async (job) => {
    log.info(
      { jobId: job.id, payload: job.data, attempt: job.attemptsMade },
      'generate-book (stub)',
    );
    return { ok: true, stub: true };
  },

  'generate-chapter-audio': async (job) => {
    const { bookId, chapterId, voice, provider } = job.data;
    const start = Date.now();
    const requestedProvider = provider ?? 'openai';

    // Pre-flight env validation. We could let `tts-service` throw further
    // down, but failing fast here means we never burn an enqueue or
    // partial generation when the worker is fundamentally misconfigured.
    if (requestedProvider === 'openai' && !process.env.OPENAI_API_KEY) {
      throw new Error(
        'OPENAI_API_KEY is not configured on the worker — cannot synthesize audio.',
      );
    }
    if (
      requestedProvider === 'gemini' &&
      !process.env.GEMINI_API_KEY &&
      !process.env.GOOGLE_AI_API_KEY
    ) {
      throw new Error(
        'GEMINI_API_KEY (or GOOGLE_AI_API_KEY) is not configured on the worker — cannot synthesize audio.',
      );
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error(
        'BLOB_READ_WRITE_TOKEN is not configured — cannot upload generated audio.',
      );
    }

    const [
      { getBookWithChapters, updateChapterAudio },
      { ttsService, assertVoiceForProvider },
    ] = await Promise.all([
      import('../db/operations'),
      import('../services/tts-service'),
    ]);

    // Validates against the provider's allowed voice set so we surface a
    // clean message instead of an opaque 4xx from OpenAI / Gemini.
    assertVoiceForProvider(voice, requestedProvider);

    const book = await getBookWithChapters(bookId);
    if (!book) {
      throw new Error(`Book ${bookId} not found`);
    }
    const chapter = book.chapters.find((c) => c.id === chapterId);
    if (!chapter) {
      throw new Error(`Chapter ${chapterId} not found in book ${bookId}`);
    }

    // Reject empty chapters before idempotency check so callers see a
    // descriptive message instead of a confusing "skipped" + no audio.
    if (!chapter.content || chapter.content.trim().length === 0) {
      throw new Error(
        `Chapter ${chapter.chapterNumber} ("${chapter.title}") has no text content; nothing to synthesize.`,
      );
    }

    // Idempotency: if the chapter already has audio matching the requested
    // voice + provider, skip regeneration. The job may be retried after a
    // crash or duplicate-enqueued by an over-eager client; either way we
    // shouldn't re-bill the TTS provider for the same output.
    const existingMeta =
      (chapter.audioMetadata as Record<string, unknown> | null) ?? null;
    const existingVoice =
      typeof existingMeta?.voice === 'string' ? existingMeta.voice : null;
    // Provider was added to metadata in Phase 2G; older rows may have it
    // missing. Treat null/undefined as 'openai' since that was the only
    // provider used historically.
    const existingProvider =
      typeof existingMeta?.provider === 'string'
        ? existingMeta.provider
        : 'openai';
    if (
      chapter.audioUrl &&
      existingVoice === voice &&
      existingProvider === requestedProvider
    ) {
      log.info(
        { jobId: job.id, bookId, chapterId, voice, provider: requestedProvider },
        'audio already generated; skipping',
      );
      return {
        skipped: true,
        chapterId,
        audioUrl: chapter.audioUrl,
        duration: chapter.audioDuration ?? 0,
      };
    }

    await job.updateProgress({ phase: 'tts', chapterId, voice, chunk: 0, totalChunks: 0 });

    const result = await ttsService.generateChapterAudio(
      chapter.content,
      chapter.chapterNumber,
      book.title,
      {
        provider: requestedProvider,
        // voice is validated by the route handler against the allowed voice
        // set, but is typed as `string` on the queue payload to keep the
        // queue contract independent of TTS provider internals.
        voice: voice as never,
      },
      // Per-chunk progress callback. Each tick:
      //  - Reports { phase: 'tts', chunk, totalChunks } so the UI can
      //    show a real progress bar instead of an indeterminate spinner.
      //  - Triggers BullMQ to renew the worker lock (10-minute audio
      //    lockDuration) — without this, a long chapter that exceeds the
      //    lock window gets re-claimed by a stall checker and processed
      //    twice. updateProgress is the documented way to extend the lock.
      async (current, total) => {
        await job.updateProgress({
          phase: 'tts',
          chapterId,
          voice,
          chunk: current,
          totalChunks: total,
        });
      },
    );

    await job.updateProgress({ phase: 'persisting', chapterId });

    await updateChapterAudio(chapterId, result.audioUrl, result.duration, {
      provider: requestedProvider,
      voice,
      generatedAt: new Date().toISOString(),
      fileSize: result.size,
      jobId: job.id,
    });

    log.info(
      {
        jobId: job.id,
        bookId,
        chapterId,
        voice,
        provider: requestedProvider,
        durationSec: result.duration,
        fileSize: result.size,
        ms: Date.now() - start,
      },
      'chapter audio generated',
    );

    return {
      skipped: false,
      chapterId,
      audioUrl: result.audioUrl,
      duration: result.duration,
      size: result.size,
    };
  },

  'export-book': async (job) => {
    const { bookId, format, exportRowId } = job.data;
    const start = Date.now();

    if (format !== 'pdf' && format !== 'epub') {
      // Sync formats are still served by /api/books/export and should never
      // hit the queue. Fail fast — better than silently swallowing a job.
      throw new Error(
        `export-book queue only supports pdf/epub, got: ${format}`,
      );
    }

    const [
      { put },
      { ExportServiceAdvanced },
      { loadBookExportPayload },
      { db: dbInstance },
      { bookExports: bookExportsTable },
      { eq: drizzleEq },
      {
        markExportActive,
        markExportCompleted,
        markExportFailed,
      },
    ] = await Promise.all([
      import('@vercel/blob'),
      import('../services/export-service-advanced'),
      import('../services/export-data-builder'),
      import('../db'),
      import('../db/schema'),
      import('drizzle-orm'),
      import('../db/export-operations'),
    ]);

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN is not configured.');
    }

    // The route persists `exportRowId` on the job payload at enqueue
    // time. Look it up by primary key (race-free).
    if (typeof exportRowId !== 'number') {
      throw new Error(`Job payload missing exportRowId for jobId=${job.id}`);
    }
    const rows = await dbInstance
      .select()
      .from(bookExportsTable)
      .where(drizzleEq(bookExportsTable.id, exportRowId))
      .limit(1);
    const exportRow = rows[0];
    if (!exportRow) {
      // The route always creates this row before enqueueing; missing
      // means it was hand-deleted from the DB. Abort cleanly.
      throw new Error(`No book_exports row id=${exportRowId}`);
    }
    // Patch the BullMQ job id onto the row for diagnostics. Safe to
    // do unconditionally — the row PK is stable.
    if (!exportRow.jobId) {
      await dbInstance
        .update(bookExportsTable)
        .set({ jobId: String(job.id) })
        .where(drizzleEq(bookExportsTable.id, exportRowId));
    }

    try {
      await markExportActive(exportRow.id);
      await job.updateProgress({ phase: 'loading', bookId });

      const loaded = await loadBookExportPayload(bookId);
      if (!loaded) throw new Error(`Book ${bookId} not found`);
      const { book, payload } = loaded;

      await job.updateProgress({
        phase: 'rendering',
        bookId,
        format,
        chapters: payload.chapters.length,
      });

      let buffer: Buffer;
      let contentType: string;
      if (format === 'pdf') {
        buffer = await ExportServiceAdvanced.exportBookAsPDF(payload);
        contentType = 'application/pdf';
      } else {
        buffer = await ExportServiceAdvanced.exportBookAsEPUB(payload);
        contentType = 'application/epub+zip';
      }

      await job.updateProgress({
        phase: 'uploading',
        bookId,
        format,
        size: buffer.length,
      });

      const safeTitle = book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `exports/${book.userId}/${book.id}/${exportRowId}-${safeTitle}.${format}`;
      const blob = await put(filename, buffer, {
        access: 'public',
        contentType,
        token: process.env.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: false,
        // Allow overwrite so a worker retry of the same jobId can re-upload
        // without conflicting on the deterministic path.
        allowOverwrite: true,
      });

      await markExportCompleted(exportRow.id, blob.url, buffer.length);

      log.info(
        {
          jobId: job.id,
          exportRowId: exportRow.id,
          bookId,
          format,
          size: buffer.length,
          ms: Date.now() - start,
        },
        'export-book completed',
      );

      return {
        exportRowId: exportRow.id,
        bookId,
        format,
        fileUrl: blob.url,
        fileSize: buffer.length,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await markExportFailed(exportRow.id, message);
      log.error(
        { jobId: job.id, exportRowId: exportRow.id, bookId, format, err },
        'export-book failed',
      );
      throw err;
    }
  },
};
