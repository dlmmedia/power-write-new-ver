-- 0009_add_book_exports.sql
--
-- Tracks asynchronous PDF/EPUB exports created via the queue subsystem
-- (Phase 2G — export-book processor). Synchronous TXT/MD/HTML/DOCX exports
-- still stream directly from the API route and do not write a row here.
--
-- Lifecycle of a row:
--   1. POST /api/books/export/queue inserts row with status='pending', job_id=<bullmq id>
--   2. Worker picks it up, sets status='active'
--   3. On success: status='completed', file_url=<blob>, file_size, completed_at
--   4. On failure: status='failed', error_message, completed_at
--
-- The user-facing "Downloads" tray on /library/[id] reads from this table
-- (filtered by book_id + user_id) and shows status + a download link once
-- file_url is populated.
--
-- This migration is purely additive — new table, new indexes, no changes
-- to existing tables. Safe to re-run via IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS public.book_exports (
  id            serial PRIMARY KEY,
  book_id       integer NOT NULL REFERENCES public.generated_books(id) ON DELETE CASCADE,
  user_id       varchar NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  format        varchar NOT NULL,                        -- 'pdf' | 'epub'
  status        varchar NOT NULL DEFAULT 'pending',      -- pending | active | completed | failed
  job_id        varchar,                                  -- BullMQ job id (string)
  file_url      text,                                     -- Vercel Blob URL once ready
  file_size     integer,                                  -- bytes
  layout_type   varchar,                                  -- snapshot of layout used (PDF only)
  error_message text,                                     -- populated on failed
  metadata      jsonb,                                    -- room for future fields (worker host, retries, etc.)
  created_at    timestamp DEFAULT now(),
  completed_at  timestamp
);

-- Filter by book + ordered by recency (the Downloads tray query).
CREATE INDEX IF NOT EXISTS book_exports_book_id_created_at_idx
  ON public.book_exports (book_id, created_at DESC);

-- "Show me my pending exports across all books" — for a future global tray.
CREATE INDEX IF NOT EXISTS book_exports_user_id_status_idx
  ON public.book_exports (user_id, status)
  WHERE status IN ('pending', 'active');
