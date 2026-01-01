-- Cover Gallery Migration
-- Run this SQL to add the cover_gallery table to your database

-- Create the cover_gallery table
CREATE TABLE IF NOT EXISTS cover_gallery (
  id SERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES generated_books(id) ON DELETE CASCADE,
  cover_url TEXT NOT NULL,
  cover_type VARCHAR(10) NOT NULL DEFAULT 'front', -- 'front' or 'back'
  thumbnail_url TEXT,
  is_selected BOOLEAN DEFAULT FALSE,
  generation_settings JSONB,
  image_model VARCHAR(100),
  prompt TEXT,
  source VARCHAR(20) DEFAULT 'generated', -- 'generated' or 'uploaded'
  file_name VARCHAR(255),
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups by book_id
CREATE INDEX IF NOT EXISTS idx_cover_gallery_book_id ON cover_gallery(book_id);

-- Create index for finding selected covers
CREATE INDEX IF NOT EXISTS idx_cover_gallery_selected ON cover_gallery(book_id, cover_type, is_selected) WHERE is_selected = TRUE;

-- Migrate existing covers to the gallery
-- This will copy any existing coverUrl from generated_books to the cover_gallery table
INSERT INTO cover_gallery (book_id, cover_url, cover_type, is_selected, source)
SELECT id, cover_url, 'front', TRUE, 'generated'
FROM generated_books
WHERE cover_url IS NOT NULL
ON CONFLICT DO NOTHING;

-- Success message
-- Run: SELECT COUNT(*) FROM cover_gallery;
-- to verify the migration worked














