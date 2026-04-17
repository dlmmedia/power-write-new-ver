-- Migration: Add book_series table and link generated_books to series
-- Series group multiple books that share style/world/themes ("series bible").
-- Books inherit shared config defaults from their series; locked fields cannot be overridden per-book.

CREATE TABLE IF NOT EXISTS "book_series" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "cover_url" text,
  "shared_config" jsonb,
  "locked_fields" jsonb DEFAULT '[]'::jsonb,
  "status" varchar DEFAULT 'ongoing',
  "is_public" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "book_series_user_id_idx" ON "book_series" ("user_id");

-- Link books to series (nullable; on series deletion, books are detached, not deleted)
ALTER TABLE "generated_books"
  ADD COLUMN IF NOT EXISTS "series_id" integer REFERENCES "book_series"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "series_number" integer;

CREATE INDEX IF NOT EXISTS "generated_books_series_id_idx" ON "generated_books" ("series_id");
