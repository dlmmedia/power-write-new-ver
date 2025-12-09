CREATE TABLE "bibliography_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"enabled" boolean DEFAULT false,
	"citation_style" varchar DEFAULT 'APA',
	"location" jsonb DEFAULT '["bibliography"]'::jsonb,
	"sort_by" varchar DEFAULT 'author',
	"sort_direction" varchar DEFAULT 'asc',
	"include_annotations" boolean DEFAULT false,
	"include_abstracts" boolean DEFAULT false,
	"hanging_indent" boolean DEFAULT true,
	"line_spacing" varchar DEFAULT 'single',
	"group_by_type" boolean DEFAULT false,
	"numbering_style" varchar DEFAULT 'none',
	"show_doi" boolean DEFAULT true,
	"show_url" boolean DEFAULT true,
	"show_access_date" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "bibliography_configs_book_id_unique" UNIQUE("book_id")
);
--> statement-breakpoint
CREATE TABLE "bibliography_references" (
	"id" varchar PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"type" varchar NOT NULL,
	"title" text NOT NULL,
	"authors" jsonb NOT NULL,
	"year" integer,
	"publisher" text,
	"url" text,
	"doi" text,
	"access_date" varchar,
	"type_specific_data" jsonb,
	"notes" text,
	"tags" jsonb,
	"citation_key" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "book_chapters" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"chapter_number" integer NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"word_count" integer DEFAULT 0,
	"is_edited" boolean DEFAULT false,
	"audio_url" text,
	"audio_duration" integer,
	"audio_metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "book_searches" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"query" text NOT NULL,
	"results" jsonb,
	"result_count" integer DEFAULT 0,
	"source" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cached_books" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" varchar NOT NULL,
	"source" varchar NOT NULL,
	"title" text NOT NULL,
	"authors" jsonb,
	"description" text,
	"published_date" varchar,
	"page_count" integer,
	"categories" jsonb,
	"image_links" jsonb,
	"average_rating" integer,
	"ratings_count" integer,
	"language" varchar,
	"publisher" varchar,
	"isbn" varchar,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cached_books_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "citations" (
	"id" varchar PRIMARY KEY NOT NULL,
	"reference_id" varchar NOT NULL,
	"book_id" integer NOT NULL,
	"chapter_id" integer,
	"position" integer NOT NULL,
	"page_number" varchar,
	"paragraph" text,
	"quotation" text,
	"prefix" varchar,
	"suffix" text,
	"suppress_author" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cover_gallery" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"cover_url" text NOT NULL,
	"cover_type" varchar DEFAULT 'front' NOT NULL,
	"thumbnail_url" text,
	"is_selected" boolean DEFAULT false,
	"generation_settings" jsonb,
	"image_model" varchar,
	"prompt" text,
	"source" varchar DEFAULT 'generated',
	"file_name" varchar,
	"file_size" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "generated_books" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"author" text,
	"genre" text,
	"summary" text,
	"outline" jsonb,
	"content" text,
	"chapters" jsonb,
	"config" jsonb,
	"metadata" jsonb,
	"source_book_data" jsonb,
	"reference_books" jsonb,
	"cover_url" text,
	"cover_metadata" jsonb,
	"pdf_url" text,
	"audio_url" text,
	"status" varchar DEFAULT 'draft',
	"generation_type" varchar,
	"custom_instructions" text,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reference_books" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer DEFAULT 0,
	"file_type" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"password" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"plan" varchar DEFAULT 'starter',
	"credits_used" integer DEFAULT 0,
	"credits_limit" integer DEFAULT 5,
	"is_email_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "bibliography_configs" ADD CONSTRAINT "bibliography_configs_book_id_generated_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."generated_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bibliography_references" ADD CONSTRAINT "bibliography_references_book_id_generated_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."generated_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_chapters" ADD CONSTRAINT "book_chapters_book_id_generated_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."generated_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_searches" ADD CONSTRAINT "book_searches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citations" ADD CONSTRAINT "citations_reference_id_bibliography_references_id_fk" FOREIGN KEY ("reference_id") REFERENCES "public"."bibliography_references"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citations" ADD CONSTRAINT "citations_book_id_generated_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."generated_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citations" ADD CONSTRAINT "citations_chapter_id_book_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."book_chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cover_gallery" ADD CONSTRAINT "cover_gallery_book_id_generated_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."generated_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_books" ADD CONSTRAINT "generated_books_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference_books" ADD CONSTRAINT "reference_books_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");