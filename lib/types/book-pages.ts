/**
 * Catalog of pre-chapter (front-matter) and post-chapter (back-matter) page types.
 *
 * These are persisted in the existing `book_chapters` table with a `chapter_type`
 * discriminator and a stable `slug` per page type. Ordering is encoded in
 * `chapter_number`:
 *   - Front-matter uses negative numbers (sorted before chapter 1)
 *   - Main chapters use 1..N
 *   - Back-matter uses values >= 1000
 */

export type ChapterType = "chapter" | "front_matter" | "back_matter";

export type PageSlug =
  | "dedication"
  | "acknowledgments"
  | "foreword"
  | "synopsis"
  | "introduction"
  | "prologue"
  | "epilogue"
  | "afterword";

export interface PageTypeDefinition {
  slug: PageSlug;
  type: Exclude<ChapterType, "chapter">;
  /** Default chapter_number used when inserting a new page of this type. */
  defaultOrder: number;
  /** Default human-readable title displayed in the editor / reader. */
  defaultTitle: string;
  /** Short blurb shown in the "Add page" picker. */
  description: string;
  /** Approximate target word count for AI generation. */
  targetWordCount: number;
}

export const PAGE_TYPES: Record<PageSlug, PageTypeDefinition> = {
  dedication: {
    slug: "dedication",
    type: "front_matter",
    defaultOrder: -50,
    defaultTitle: "Dedication",
    description: "A short dedication to a person, group, or idea.",
    targetWordCount: 40,
  },
  acknowledgments: {
    slug: "acknowledgments",
    type: "front_matter",
    defaultOrder: -40,
    defaultTitle: "Acknowledgments",
    description: "Thank readers, collaborators, and contributors.",
    targetWordCount: 350,
  },
  foreword: {
    slug: "foreword",
    type: "front_matter",
    defaultOrder: -30,
    defaultTitle: "Foreword",
    description: "An introduction written from the perspective of someone other than the author.",
    targetWordCount: 800,
  },
  synopsis: {
    slug: "synopsis",
    type: "front_matter",
    defaultOrder: -20,
    defaultTitle: "Synopsis",
    description: "A concise overview of what the book covers.",
    targetWordCount: 400,
  },
  introduction: {
    slug: "introduction",
    type: "front_matter",
    defaultOrder: -10,
    defaultTitle: "Introduction",
    description: "Set context, motivation, and what readers will learn.",
    targetWordCount: 1000,
  },
  prologue: {
    slug: "prologue",
    type: "front_matter",
    defaultOrder: -5,
    defaultTitle: "Prologue",
    description: "An opening narrative scene that precedes Chapter 1.",
    targetWordCount: 1500,
  },
  epilogue: {
    slug: "epilogue",
    type: "back_matter",
    defaultOrder: 1000,
    defaultTitle: "Epilogue",
    description: "A closing narrative scene after the final chapter.",
    targetWordCount: 1500,
  },
  afterword: {
    slug: "afterword",
    type: "back_matter",
    defaultOrder: 1010,
    defaultTitle: "Afterword",
    description: "Closing reflections, author notes, or about-the-author content.",
    targetWordCount: 700,
  },
};

export const PAGE_SLUGS: PageSlug[] = Object.keys(PAGE_TYPES) as PageSlug[];

export const FRONT_MATTER_SLUGS: PageSlug[] = PAGE_SLUGS.filter(
  (s) => PAGE_TYPES[s].type === "front_matter",
);

export const BACK_MATTER_SLUGS: PageSlug[] = PAGE_SLUGS.filter(
  (s) => PAGE_TYPES[s].type === "back_matter",
);

export function isFrontMatter(chapterType?: string | null): boolean {
  return chapterType === "front_matter";
}

export function isBackMatter(chapterType?: string | null): boolean {
  return chapterType === "back_matter";
}

export function isPage(chapterType?: string | null): boolean {
  return isFrontMatter(chapterType) || isBackMatter(chapterType);
}

export function getPageDefinition(slug: string | null | undefined): PageTypeDefinition | null {
  if (!slug) return null;
  return (PAGE_TYPES as Record<string, PageTypeDefinition>)[slug] ?? null;
}

/**
 * Pick a chapter_number for a new page that won't collide with existing rows.
 * Honors the catalog's default ordering when free, otherwise nudges in the
 * appropriate direction so front-matter stays negative and back-matter stays
 * high.
 */
export function getDefaultChapterNumber(
  slug: PageSlug,
  existingNumbers: number[],
): number {
  const def = PAGE_TYPES[slug];
  const taken = new Set(existingNumbers);
  let candidate = def.defaultOrder;
  if (def.type === "front_matter") {
    while (taken.has(candidate)) candidate -= 1;
  } else {
    while (taken.has(candidate)) candidate += 1;
  }
  return candidate;
}

export interface BookContextForAI {
  title: string;
  author?: string | null;
  genre?: string | null;
  summary?: string | null;
  chapterTitles?: string[];
}

/**
 * Build a system + user prompt pair for AI generation of a given page type.
 * Reused by the /api/generate/page route.
 */
export function getAIPromptForPage(
  slug: PageSlug,
  book: BookContextForAI,
  customInstructions?: string,
): { system: string; user: string; targetWordCount: number; title: string } {
  const def = PAGE_TYPES[slug];
  const chapterList =
    book.chapterTitles && book.chapterTitles.length > 0
      ? book.chapterTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")
      : "(no chapters yet)";
  const summary = book.summary?.trim() || "(no summary provided)";

  const baseHeader = `Book title: "${book.title}"\nAuthor: ${book.author || "Unknown"}\nGenre: ${book.genre || "General"}\nSummary: ${summary}\n\nChapter list:\n${chapterList}`;

  let task = "";
  switch (slug) {
    case "dedication":
      task = `Write a brief, heartfelt dedication for this book. Keep it short (1-3 sentences). Do not address it to a specific real person by name unless the user instructions provide one. Output only the dedication text, no title or quotation marks.`;
      break;
    case "acknowledgments":
      task = `Write an acknowledgments section for this book. Thank, in a warm and sincere voice, the kinds of people typically thanked (collaborators, editors, family, readers). Avoid inventing specific real names. Use natural prose paragraphs.`;
      break;
    case "foreword":
      task = `Write a foreword for this book from the perspective of a respected voice in the field (do not invent a real person's name; use a generic third-party tone). The foreword should explain why this book matters and prepare the reader for what's ahead.`;
      break;
    case "synopsis":
      task = `Write a clear, engaging synopsis of the book that captures its core premise, themes, and what the reader will learn or experience. Avoid spoilers for late chapters but give a strong sense of scope.`;
      break;
    case "introduction":
      task = `Write an introduction for this book. Establish the problem or question the book addresses, the author's motivation, who the reader is, and a roadmap of what they will learn. Use a confident, inviting voice.`;
      break;
    case "prologue":
      task = `Write a prologue for this book. It should be a short narrative scene that hooks the reader and sets emotional or thematic context for Chapter 1. Avoid summarizing the whole plot.`;
      break;
    case "epilogue":
      task = `Write an epilogue for this book. It should provide a satisfying narrative coda that follows the final chapter, hinting at what comes next or reflecting on the journey.`;
      break;
    case "afterword":
      task = `Write an afterword for this book. Reflect on the writing process, the larger context of the work, or what the author hopes the reader takes away. Keep it personal and grounded.`;
      break;
  }

  const system = `You are an expert book author writing the "${def.defaultTitle}" page for a book. Write in clean prose. Do not include the page title in the body. Do not use markdown headings. Separate paragraphs with a blank line.`;

  const user = `${baseHeader}\n\nTask: ${task}\n\nTarget length: approximately ${def.targetWordCount} words.${customInstructions ? `\n\nAdditional instructions from the author:\n${customInstructions}` : ""}\n\nWrite the ${def.defaultTitle.toLowerCase()} now.`;

  return {
    system,
    user,
    targetWordCount: def.targetWordCount,
    title: def.defaultTitle,
  };
}
