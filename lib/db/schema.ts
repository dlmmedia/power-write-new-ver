import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
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

// Generated books table
export const generatedBooks = pgTable("generated_books", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  coverUrl: text("cover_url"), // URL to generated cover image
  coverMetadata: jsonb("cover_metadata"), // cover design options and metadata
  pdfUrl: text("pdf_url"), // URL to generated PDF
  audioUrl: text("audio_url"), // URL to generated audiobook
  status: varchar("status").default("draft"), // draft, generating, completed, failed
  generationType: varchar("generation_type"), // outline, full_book, summary
  customInstructions: text("custom_instructions"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Book chapters table for individual chapter editing
export const bookChapters = pgTable("book_chapters", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull().references(() => generatedBooks.id, { onDelete: "cascade" }),
  chapterNumber: integer("chapter_number").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  wordCount: integer("word_count").default(0),
  isEdited: boolean("is_edited").default(false),
  // Audio fields
  audioUrl: text("audio_url"),
  audioDuration: integer("audio_duration"), // Duration in seconds
  audioMetadata: jsonb("audio_metadata"), // { voice, speed, model, generatedAt, fileSize }
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  generatedBooks: many(generatedBooks),
  bookSearches: many(bookSearches),
  referenceBooks: many(referenceBooks),
}));

export const generatedBooksRelations = relations(generatedBooks, ({ one, many }) => ({
  user: one(users, {
    fields: [generatedBooks.userId],
    references: [users.id],
  }),
  chapters: many(bookChapters),
}));

export const bookChaptersRelations = relations(bookChapters, ({ one }) => ({
  book: one(generatedBooks, {
    fields: [bookChapters.bookId],
    references: [generatedBooks.id],
  }),
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
