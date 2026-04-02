-- Migration: Add unique constraint on (book_id, chapter_number) and model_used column

-- Step 1: Delete duplicate chapters, keeping the one with the highest id (most recent)
DELETE FROM book_chapters a
USING book_chapters b
WHERE a.book_id = b.book_id
  AND a.chapter_number = b.chapter_number
  AND a.id < b.id;

-- Step 2: Add unique constraint to prevent future duplicates
ALTER TABLE book_chapters
  ADD CONSTRAINT book_chapters_book_id_chapter_number_unique
  UNIQUE (book_id, chapter_number);

-- Step 3: Add model_used column for per-chapter model tracking
ALTER TABLE book_chapters
  ADD COLUMN model_used VARCHAR;
