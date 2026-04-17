import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // hashed password
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  plan: varchar("plan").default("starter"), // starter, professional, enterprise
  creditsUsed: integer("credits_used").default(0),
  creditsLimit: integer("credits_limit").default(5),
  isEmailVerified: boolean("is_email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Book series table - groups multiple books that share style/world/themes
export const bookSeries = pgTable("book_series", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  coverUrl: text("cover_url"),
  // Shared "series bible" — defaults inherited by every book (see lib/types/series.ts SeriesSharedConfig)
  sharedConfig: jsonb("shared_config"),
  // Dot-path keys that cannot be overridden per-book (see LOCKABLE_SERIES_FIELDS)
  lockedFields: jsonb("locked_fields").default([]),
  status: varchar("status").default("ongoing"), // ongoing, completed, hiatus
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("book_series_user_id_idx").on(table.userId),
]);

// Generated books table
export const generatedBooks = pgTable("generated_books", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // Optional series link — books inherit shared config from this series.
  seriesId: integer("series_id").references(() => bookSeries.id, { onDelete: "set null" }),
  seriesNumber: integer("series_number"),
  title: text("title").notNull(),
  author: text("author"),
  genre: text("genre"),
  summary: text("summary"),
  outline: jsonb("outline"), // chapters and structure
  content: text("content"), // full book content
  chapters: jsonb("chapters"), // individual chapters array
  config: jsonb("config"), // generation configuration
  metadata: jsonb("metadata"), // word count, pages, reading time
  sourceBookData: jsonb("source_book_data"), // original book metadata used for generation
  referenceBooks: jsonb("reference_books"), // multiple reference books
  coverUrl: text("cover_url"), // URL to generated front cover image
  // backCoverUrl: text("back_cover_url"), // URL to generated back cover image - REQUIRES DB MIGRATION
  coverMetadata: jsonb("cover_metadata"), // cover design options and metadata
  pdfUrl: text("pdf_url"), // URL to generated PDF
  audioUrl: text("audio_url"), // URL to generated audiobook
  status: varchar("status").default("draft"), // draft, generating, completed, failed
  productionStatus: varchar("production_status").default("draft"), // draft, in-progress, content-complete, audio-pending, published
  generationType: varchar("generation_type"), // outline, full_book, summary
  customInstructions: text("custom_instructions"),
  isPublic: boolean("is_public").default(false),
  generationStartedAt: timestamp("generation_started_at"), // tracks when generation began for stuck-book detection
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("generated_books_series_id_idx").on(table.seriesId),
  // Library list filters by user_id and orders by created_at DESC; the
  // composite covers both the WHERE and the ORDER BY in one index lookup.
  index("generated_books_user_id_idx").on(table.userId),
  index("generated_books_user_id_created_at_idx").on(
    table.userId,
    table.createdAt.desc(),
  ),
]);

// Book chapters table for individual chapter editing
export const bookChapters = pgTable("book_chapters", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull().references(() => generatedBooks.id, { onDelete: "cascade" }),
  chapterNumber: integer("chapter_number").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  wordCount: integer("word_count").default(0),
  isEdited: boolean("is_edited").default(false),
  modelUsed: varchar("model_used"),
  // Type of "chapter" record: chapter | front_matter | back_matter
  // front_matter slugs use negative chapter_number for ordering, back_matter use 1000+
  chapterType: varchar("chapter_type").default("chapter").notNull(),
  slug: varchar("slug"), // e.g. acknowledgments, introduction, synopsis, dedication, foreword, prologue, epilogue, afterword
  // Audio fields
  audioUrl: text("audio_url"),
  audioDuration: integer("audio_duration"), // Duration in seconds
  audioMetadata: jsonb("audio_metadata"), // { voice, speed, model, generatedAt, fileSize }
  audioTimestamps: jsonb("audio_timestamps"), // Array of { word: string, start: number, end: number }
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("book_chapters_book_id_chapter_number_unique").on(table.bookId, table.chapterNumber),
]);

// Book searches table
export const bookSearches = pgTable("book_searches", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  results: jsonb("results"), // search results from APIs
  resultCount: integer("result_count").default(0),
  source: varchar("source"), // google_books, open_library
  createdAt: timestamp("created_at").defaultNow(),
});

// Reference books table for user uploaded files
export const referenceBooks = pgTable("reference_books", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(), // storage path
  fileSize: integer("file_size").default(0),
  fileType: varchar("file_type"), // pdf, docx, txt
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cached books from external APIs (Goodreads, etc.)
export const cachedBooks = pgTable("cached_books", {
  id: serial("id").primaryKey(),
  externalId: varchar("external_id").notNull().unique(), // e.g. "goodreads_12345"
  source: varchar("source").notNull(), // goodreads, google_books
  title: text("title").notNull(),
  authors: jsonb("authors"), // string[]
  description: text("description"),
  publishedDate: varchar("published_date"),
  pageCount: integer("page_count"),
  categories: jsonb("categories"), // string[]
  imageLinks: jsonb("image_links"), // ImageLinks object
  averageRating: integer("average_rating"),
  ratingsCount: integer("ratings_count"),
  language: varchar("language"),
  publisher: varchar("publisher"),
  isbn: varchar("isbn"),
  metadata: jsonb("metadata"), // any additional data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bibliography references table
export const bibliographyReferences = pgTable("bibliography_references", {
  id: varchar("id").primaryKey(), // UUID format: ref_timestamp_random
  bookId: integer("book_id").notNull().references(() => generatedBooks.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // book, journal, website, etc.
  title: text("title").notNull(),
  authors: jsonb("authors").notNull(), // Author[] array
  year: integer("year"),
  publisher: text("publisher"),
  url: text("url"),
  doi: text("doi"),
  accessDate: varchar("access_date"),
  // Type-specific fields stored as JSONB for flexibility
  typeSpecificData: jsonb("type_specific_data"), // Contains fields specific to each reference type
  notes: text("notes"),
  tags: jsonb("tags"), // string[]
  citationKey: varchar("citation_key"), // For BibTeX-style citations
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("bibliography_references_book_id_idx").on(table.bookId),
]);

// In-text citations table
export const citations = pgTable("citations", {
  id: varchar("id").primaryKey(), // UUID format: cit_timestamp_random
  referenceId: varchar("reference_id").notNull().references(() => bibliographyReferences.id, { onDelete: "cascade" }),
  bookId: integer("book_id").notNull().references(() => generatedBooks.id, { onDelete: "cascade" }),
  chapterId: integer("chapter_id").references(() => bookChapters.id, { onDelete: "cascade" }),
  position: integer("position").notNull(), // Character position in text
  pageNumber: varchar("page_number"), // Specific page being cited
  paragraph: text("paragraph"), // Specific paragraph
  quotation: text("quotation"), // Direct quote if applicable
  prefix: varchar("prefix"), // e.g., "see", "cf."
  suffix: text("suffix"), // Additional context
  suppressAuthor: boolean("suppress_author").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("citations_reference_id_idx").on(table.referenceId),
  index("citations_book_id_idx").on(table.bookId),
  index("citations_chapter_id_idx").on(table.chapterId),
]);

// Cover gallery table - stores all generated covers for a book
export const coverGallery = pgTable("cover_gallery", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull().references(() => generatedBooks.id, { onDelete: "cascade" }),
  coverUrl: text("cover_url").notNull(),
  coverType: varchar("cover_type").notNull().default("front"), // front, back
  thumbnailUrl: text("thumbnail_url"), // Optional smaller version for gallery
  isSelected: boolean("is_selected").default(false), // Whether this is the currently selected cover
  generationSettings: jsonb("generation_settings"), // Store the settings used to generate this cover
  imageModel: varchar("image_model"), // Which AI model was used
  prompt: text("prompt"), // The prompt used (for regeneration reference)
  source: varchar("source").default("generated"), // generated, uploaded
  fileName: varchar("file_name"), // Original filename if uploaded
  fileSize: integer("file_size"), // File size in bytes
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("cover_gallery_book_id_idx").on(table.bookId),
]);

// Bibliography configuration table
export const bibliographyConfigs = pgTable("bibliography_configs", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull().unique().references(() => generatedBooks.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").default(false),
  citationStyle: varchar("citation_style").default("APA"), // APA, MLA, Chicago, etc.
  location: jsonb("location").default(['bibliography']), // footnote, endnote, in-text, bibliography
  sortBy: varchar("sort_by").default("author"), // author, date, title, type, appearance
  sortDirection: varchar("sort_direction").default("asc"), // asc, desc
  includeAnnotations: boolean("include_annotations").default(false),
  includeAbstracts: boolean("include_abstracts").default(false),
  hangingIndent: boolean("hanging_indent").default(true),
  lineSpacing: varchar("line_spacing").default("single"), // single, 1.5, double
  groupByType: boolean("group_by_type").default(false),
  numberingStyle: varchar("numbering_style").default("none"), // none, numeric, alphabetic
  showDOI: boolean("show_doi").default(true),
  showURL: boolean("show_url").default(true),
  showAccessDate: boolean("show_access_date").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  generatedBooks: many(generatedBooks),
  bookSearches: many(bookSearches),
  referenceBooks: many(referenceBooks),
  savedOutlines: many(savedOutlines),
  bookSeries: many(bookSeries),
}));

export const bookSeriesRelations = relations(bookSeries, ({ one, many }) => ({
  user: one(users, {
    fields: [bookSeries.userId],
    references: [users.id],
  }),
  books: many(generatedBooks),
}));

export const generatedBooksRelations = relations(generatedBooks, ({ one, many }) => ({
  user: one(users, {
    fields: [generatedBooks.userId],
    references: [users.id],
  }),
  series: one(bookSeries, {
    fields: [generatedBooks.seriesId],
    references: [bookSeries.id],
  }),
  chapters: many(bookChapters),
  bibliographyReferences: many(bibliographyReferences),
  citations: many(citations),
  bibliographyConfig: one(bibliographyConfigs, {
    fields: [generatedBooks.id],
    references: [bibliographyConfigs.bookId],
  }),
  coverGallery: many(coverGallery),
  chapterImages: many(chapterImages),
}));

export const bookChaptersRelations = relations(bookChapters, ({ one, many }) => ({
  book: one(generatedBooks, {
    fields: [bookChapters.bookId],
    references: [generatedBooks.id],
  }),
  citations: many(citations),
  images: many(chapterImages),
}));

export const bookSearchesRelations = relations(bookSearches, ({ one }) => ({
  user: one(users, {
    fields: [bookSearches.userId],
    references: [users.id],
  }),
}));

export const referenceBooksRelations = relations(referenceBooks, ({ one }) => ({
  user: one(users, {
    fields: [referenceBooks.userId],
    references: [users.id],
  }),
}));

export const bibliographyReferencesRelations = relations(bibliographyReferences, ({ one, many }) => ({
  book: one(generatedBooks, {
    fields: [bibliographyReferences.bookId],
    references: [generatedBooks.id],
  }),
  citations: many(citations),
}));

export const citationsRelations = relations(citations, ({ one }) => ({
  reference: one(bibliographyReferences, {
    fields: [citations.referenceId],
    references: [bibliographyReferences.id],
  }),
  book: one(generatedBooks, {
    fields: [citations.bookId],
    references: [generatedBooks.id],
  }),
  chapter: one(bookChapters, {
    fields: [citations.chapterId],
    references: [bookChapters.id],
  }),
}));

export const bibliographyConfigsRelations = relations(bibliographyConfigs, ({ one }) => ({
  book: one(generatedBooks, {
    fields: [bibliographyConfigs.bookId],
    references: [generatedBooks.id],
  }),
}));

export const coverGalleryRelations = relations(coverGallery, ({ one }) => ({
  book: one(generatedBooks, {
    fields: [coverGallery.bookId],
    references: [generatedBooks.id],
  }),
}));

// Chapter images table - stores all images within book chapters
export const chapterImages = pgTable("chapter_images", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull().references(() => generatedBooks.id, { onDelete: "cascade" }),
  chapterId: integer("chapter_id").references(() => bookChapters.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  imageType: varchar("image_type").notNull(), // illustration, diagram, infographic, chart, photo, scene, concept
  position: integer("position").default(0), // Character position in chapter content
  placement: varchar("placement").default("center"), // inline, full-width, float-left, float-right, center, chapter-header, section-break
  caption: text("caption"),
  altText: text("alt_text"),
  prompt: text("prompt"), // Generation prompt for reference/regeneration
  metadata: jsonb("metadata"), // width, height, style, format, generationModel, etc.
  source: varchar("source").default("generated"), // generated, uploaded
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("chapter_images_book_id_idx").on(table.bookId),
  index("chapter_images_chapter_id_idx").on(table.chapterId),
]);

export const chapterImagesRelations = relations(chapterImages, ({ one }) => ({
  book: one(generatedBooks, {
    fields: [chapterImages.bookId],
    references: [generatedBooks.id],
  }),
  chapter: one(bookChapters, {
    fields: [chapterImages.chapterId],
    references: [bookChapters.id],
  }),
}));

// Saved outlines table - persists generated outlines for retrieval
export const savedOutlines = pgTable("saved_outlines", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  outline: jsonb("outline").notNull(), // Full BookOutline object
  config: jsonb("config"), // BookConfiguration snapshot at time of save
  bookId: integer("book_id").references(() => generatedBooks.id, { onDelete: "set null" }), // Link to generated book if any
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("saved_outlines_user_id_idx").on(table.userId),
  index("saved_outlines_book_id_idx").on(table.bookId),
]);

export const savedOutlinesRelations = relations(savedOutlines, ({ one }) => ({
  user: one(users, {
    fields: [savedOutlines.userId],
    references: [users.id],
  }),
  book: one(generatedBooks, {
    fields: [savedOutlines.bookId],
    references: [generatedBooks.id],
  }),
}));

// NOTE: video_export_jobs table is deliberately not declared here. The video
// export feature was removed; the underlying table remains in production for
// safety and will be dropped in a future migration window.

// Insert and select types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertGeneratedBookSchema = createInsertSchema(generatedBooks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertGeneratedBook = z.infer<typeof insertGeneratedBookSchema>;
export type GeneratedBook = typeof generatedBooks.$inferSelect;

export const insertBookChapterSchema = createInsertSchema(bookChapters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBookChapter = z.infer<typeof insertBookChapterSchema>;
export type BookChapter = typeof bookChapters.$inferSelect;

export const insertBookSearchSchema = createInsertSchema(bookSearches).omit({
  id: true,
  createdAt: true,
});
export type InsertBookSearch = z.infer<typeof insertBookSearchSchema>;
export type BookSearch = typeof bookSearches.$inferSelect;

export const insertReferenceBookSchema = createInsertSchema(referenceBooks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertReferenceBook = z.infer<typeof insertReferenceBookSchema>;
export type ReferenceBook = typeof referenceBooks.$inferSelect;

export const insertCachedBookSchema = createInsertSchema(cachedBooks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCachedBook = z.infer<typeof insertCachedBookSchema>;
export type CachedBook = typeof cachedBooks.$inferSelect;

export const insertBibliographyReferenceSchema = createInsertSchema(bibliographyReferences).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertBibliographyReference = z.infer<typeof insertBibliographyReferenceSchema>;
export type BibliographyReference = typeof bibliographyReferences.$inferSelect;

export const insertCitationSchema = createInsertSchema(citations).omit({
  createdAt: true,
});
export type InsertCitation = z.infer<typeof insertCitationSchema>;
export type Citation = typeof citations.$inferSelect;

export const insertBibliographyConfigSchema = createInsertSchema(bibliographyConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBibliographyConfig = z.infer<typeof insertBibliographyConfigSchema>;
export type BibliographyConfigDB = typeof bibliographyConfigs.$inferSelect;

export const insertCoverGallerySchema = createInsertSchema(coverGallery).omit({
  id: true,
  createdAt: true,
});
export type InsertCoverGallery = z.infer<typeof insertCoverGallerySchema>;
export type CoverGalleryItem = typeof coverGallery.$inferSelect;

export const insertChapterImageSchema = createInsertSchema(chapterImages).omit({
  id: true,
  createdAt: true,
});
export type InsertChapterImage = z.infer<typeof insertChapterImageSchema>;
export type ChapterImageDB = typeof chapterImages.$inferSelect;

export const insertSavedOutlineSchema = createInsertSchema(savedOutlines).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSavedOutline = z.infer<typeof insertSavedOutlineSchema>;
export type SavedOutline = typeof savedOutlines.$inferSelect;

export const insertBookSeriesSchema = createInsertSchema(bookSeries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBookSeries = z.infer<typeof insertBookSeriesSchema>;
export type BookSeries = typeof bookSeries.$inferSelect;

// Book exports — tracks asynchronous PDF/EPUB exports created via the
// queue subsystem. Synchronous formats (TXT/MD/HTML/DOCX) bypass this
// table and stream straight from the API route.
export const bookExports = pgTable("book_exports", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id")
    .notNull()
    .references(() => generatedBooks.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  format: varchar("format").notNull(), // 'pdf' | 'epub'
  status: varchar("status").notNull().default("pending"), // pending | active | completed | failed
  jobId: varchar("job_id"), // BullMQ job id (string)
  fileUrl: text("file_url"), // Vercel Blob URL once ready
  fileSize: integer("file_size"), // bytes
  layoutType: varchar("layout_type"), // PDF only — snapshot of layout used
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("book_exports_book_id_created_at_idx").on(
    table.bookId,
    table.createdAt.desc(),
  ),
  index("book_exports_user_id_status_idx").on(table.userId, table.status),
]);

export const insertBookExportSchema = createInsertSchema(bookExports).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});
export type InsertBookExport = z.infer<typeof insertBookExportSchema>;
export type BookExportRecord = typeof bookExports.$inferSelect;
