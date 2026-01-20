-- Add audio_timestamps column to book_chapters table
-- This column stores word-level timestamps for synchronized audio playback

ALTER TABLE "book_chapters" ADD COLUMN IF NOT EXISTS "audio_timestamps" jsonb;
