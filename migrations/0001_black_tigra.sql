CREATE TABLE "chapter_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"chapter_id" integer,
	"image_url" text NOT NULL,
	"thumbnail_url" text,
	"image_type" varchar NOT NULL,
	"position" integer DEFAULT 0,
	"placement" varchar DEFAULT 'center',
	"caption" text,
	"alt_text" text,
	"prompt" text,
	"metadata" jsonb,
	"source" varchar DEFAULT 'generated',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "saved_outlines" (
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
CREATE TABLE "video_export_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
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
--> statement-breakpoint
ALTER TABLE "book_chapters" ADD COLUMN "audio_timestamps" jsonb;--> statement-breakpoint
ALTER TABLE "generated_books" ADD COLUMN "production_status" varchar DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "chapter_images" ADD CONSTRAINT "chapter_images_book_id_generated_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."generated_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapter_images" ADD CONSTRAINT "chapter_images_chapter_id_book_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."book_chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_outlines" ADD CONSTRAINT "saved_outlines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_outlines" ADD CONSTRAINT "saved_outlines_book_id_generated_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."generated_books"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_export_jobs" ADD CONSTRAINT "video_export_jobs_book_id_generated_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."generated_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_export_jobs" ADD CONSTRAINT "video_export_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;