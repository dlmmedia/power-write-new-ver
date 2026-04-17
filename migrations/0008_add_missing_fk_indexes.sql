-- 0008_add_missing_fk_indexes.sql
--
-- Schema audit (Phase 2H) revealed that several foreign-key columns have no
-- supporting indexes. The result is that ON DELETE CASCADE checks, JOINs, and
-- common WHERE clauses (e.g. "all books for user X", "all chapter images for
-- book Y") fall back to sequential scans.
--
-- All tables in this migration are tiny (largest <300KB), so a non-CONCURRENT
-- CREATE INDEX takes < 50ms and the brief table lock is unnoticeable. Using
-- IF NOT EXISTS makes the migration idempotent so re-runs are safe.
--
-- This migration is purely additive — no data is modified, no columns are
-- dropped, no constraints are changed. Safe to re-run.
--
-- Indexes added (grouped by table):
--
--   generated_books
--     (user_id)                  -- every library load filters on user_id
--     (user_id, created_at DESC) -- library list ORDER BY created_at DESC
--   bibliography_references
--     (book_id)                  -- 100% seqscans before this index
--   chapter_images
--     (book_id)
--     (chapter_id)
--   cover_gallery
--     (book_id)
--   saved_outlines
--     (user_id)
--     (book_id)                  -- nullable FK
--   citations
--     (reference_id)             -- empty today but FK is hot path once used
--     (book_id)
--     (chapter_id)
--
-- Deferred (not added here):
--   * video_export_jobs.* — feature is removed, table kept but unused.
--   * book_searches.user_id, reference_books.user_id — empty tables, no read
--     traffic; revisit if the features come back.

-- generated_books — biggest impact (every /library load hits this)
CREATE INDEX IF NOT EXISTS generated_books_user_id_idx
  ON public.generated_books (user_id);

CREATE INDEX IF NOT EXISTS generated_books_user_id_created_at_idx
  ON public.generated_books (user_id, created_at DESC);

-- bibliography_references — was doing 100% seqscans
CREATE INDEX IF NOT EXISTS bibliography_references_book_id_idx
  ON public.bibliography_references (book_id);

-- chapter_images — both FKs unindexed
CREATE INDEX IF NOT EXISTS chapter_images_book_id_idx
  ON public.chapter_images (book_id);

CREATE INDEX IF NOT EXISTS chapter_images_chapter_id_idx
  ON public.chapter_images (chapter_id);

-- cover_gallery — book_id is the hot lookup
CREATE INDEX IF NOT EXISTS cover_gallery_book_id_idx
  ON public.cover_gallery (book_id);

-- saved_outlines — both FKs unindexed
CREATE INDEX IF NOT EXISTS saved_outlines_user_id_idx
  ON public.saved_outlines (user_id);

CREATE INDEX IF NOT EXISTS saved_outlines_book_id_idx
  ON public.saved_outlines (book_id);

-- citations — empty today but every FK ON DELETE CASCADE walks these
CREATE INDEX IF NOT EXISTS citations_reference_id_idx
  ON public.citations (reference_id);

CREATE INDEX IF NOT EXISTS citations_book_id_idx
  ON public.citations (book_id);

CREATE INDEX IF NOT EXISTS citations_chapter_id_idx
  ON public.citations (chapter_id);
