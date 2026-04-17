-- Add support for pre-chapter (front-matter) and post-chapter (back-matter) pages.
-- Front-matter pages use negative chapter_number for ordering (e.g. -50 dedication, -10 introduction).
-- Back-matter pages use chapter_number >= 1000 (e.g. 1000 epilogue, 1010 afterword).
ALTER TABLE book_chapters
  ADD COLUMN IF NOT EXISTS chapter_type varchar DEFAULT 'chapter' NOT NULL,
  ADD COLUMN IF NOT EXISTS slug varchar;

CREATE INDEX IF NOT EXISTS book_chapters_type_idx
  ON book_chapters(book_id, chapter_type);
