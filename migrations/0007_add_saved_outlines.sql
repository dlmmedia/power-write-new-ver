-- 0007_add_saved_outlines: additive-only.
-- Creates the saved_outlines table that was declared in lib/db/schema.ts and
-- in the original 0001_black_tigra.sql but never actually created in the
-- live database (the other objects in 0001_black_tigra.sql were applied;
-- saved_outlines was the lone gap).
--
-- Idempotent — uses IF NOT EXISTS for the table and DO blocks for the FKs so
-- a re-run is a no-op.

CREATE TABLE IF NOT EXISTS "saved_outlines" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"outline" jsonb NOT NULL,
	"config" jsonb,
	"book_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'saved_outlines_user_id_users_id_fk'
	) THEN
		ALTER TABLE "saved_outlines"
			ADD CONSTRAINT "saved_outlines_user_id_users_id_fk"
			FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'saved_outlines_book_id_generated_books_id_fk'
	) THEN
		ALTER TABLE "saved_outlines"
			ADD CONSTRAINT "saved_outlines_book_id_generated_books_id_fk"
			FOREIGN KEY ("book_id") REFERENCES "public"."generated_books"("id")
			ON DELETE set null ON UPDATE no action;
	END IF;
END $$;
