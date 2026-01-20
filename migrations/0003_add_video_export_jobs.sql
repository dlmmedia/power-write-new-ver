-- Migration: Add video_export_jobs table for tracking video export progress
-- This table stores video generation jobs that compile the book reading experience into downloadable videos

CREATE TABLE IF NOT EXISTS "video_export_jobs" (
  "id" serial PRIMARY KEY NOT NULL,
  "book_id" integer NOT NULL REFERENCES "generated_books"("id") ON DELETE CASCADE,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" varchar DEFAULT 'pending' NOT NULL,
  "scope" varchar DEFAULT 'full' NOT NULL,
  "chapter_number" integer,
  "theme" varchar DEFAULT 'day',
  "current_phase" varchar DEFAULT 'initializing',
  "current_chapter" integer DEFAULT 0,
  "total_chapters" integer DEFAULT 0,
  "current_frame" integer DEFAULT 0,
  "total_frames" integer DEFAULT 0,
  "progress" integer DEFAULT 0,
  "output_url" text,
  "output_size" integer,
  "output_duration" integer,
  "frames_manifest" jsonb,
  "error" text,
  "retry_count" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now(),
  "started_at" timestamp,
  "completed_at" timestamp
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS "idx_video_export_jobs_book_id" ON "video_export_jobs" ("book_id");
CREATE INDEX IF NOT EXISTS "idx_video_export_jobs_user_id" ON "video_export_jobs" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_video_export_jobs_status" ON "video_export_jobs" ("status");
