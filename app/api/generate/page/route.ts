import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookChapters, generatedBooks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getBookWithChapters } from '@/lib/db/operations';
import { aiService } from '@/lib/services/ai-service';
import {
  PAGE_TYPES,
  PageSlug,
  getAIPromptForPage,
  getDefaultChapterNumber,
} from '@/lib/types/book-pages';

export const runtime = 'nodejs';
interface GeneratePageBody {
  bookId: number | string;
  slug: PageSlug;
  customInstructions?: string;
  modelId?: string;
  /** If true, replace existing page with the same slug instead of failing. */
  replace?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GeneratePageBody;
    const { slug, modelId, customInstructions, replace } = body;
    const bookId =
      typeof body.bookId === 'string' ? parseInt(body.bookId, 10) : body.bookId;

    if (!bookId || !Number.isFinite(bookId)) {
      return NextResponse.json(
        { error: 'Missing or invalid bookId' },
        { status: 400 },
      );
    }

    const def = PAGE_TYPES[slug];
    if (!def) {
      return NextResponse.json(
        {
          error: `Unknown page slug "${slug}"`,
          availableSlugs: Object.keys(PAGE_TYPES),
        },
        { status: 400 },
      );
    }

    const book = await getBookWithChapters(bookId);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const chapterTitles = book.chapters
      .filter((ch) => (ch.chapterType ?? 'chapter') === 'chapter')
      .sort((a, b) => a.chapterNumber - b.chapterNumber)
      .map((ch) => ch.title);

    const prompt = getAIPromptForPage(
      slug,
      {
        title: book.title,
        author: book.author,
        genre: book.genre,
        summary: book.summary,
        chapterTitles,
      },
      customInstructions,
    );

    console.log(
      `[Generate Page] Generating ${slug} for book ${bookId} (${book.title}) with model ${modelId || 'default'}`,
    );

    const generated = await aiService.generatePage({
      system: prompt.system,
      user: prompt.user,
      modelId,
    });

    if (!generated.content) {
      return NextResponse.json(
        { error: 'AI returned empty content' },
        { status: 502 },
      );
    }

    // Persist as a book_chapters row
    const existingPage = book.chapters.find(
      (ch) => ch.slug === slug && ch.chapterType === def.type,
    );

    if (existingPage && !replace) {
      return NextResponse.json(
        {
          error: `A ${def.defaultTitle} page already exists for this book.`,
          existingChapterId: existingPage.id,
          hint: 'Pass replace: true to overwrite the existing page.',
        },
        { status: 409 },
      );
    }

    let saved;
    if (existingPage) {
      const [updated] = await db
        .update(bookChapters)
        .set({
          title: existingPage.title || def.defaultTitle,
          content: generated.content,
          wordCount: generated.wordCount,
          isEdited: true,
          chapterType: def.type,
          slug,
          ...(modelId ? { modelUsed: modelId } : {}),
          updatedAt: new Date(),
        })
        .where(eq(bookChapters.id, existingPage.id))
        .returning();
      saved = updated;
    } else {
      const existingNumbers = book.chapters.map((ch) => ch.chapterNumber);
      const chapterNumber = getDefaultChapterNumber(slug, existingNumbers);
      const [inserted] = await db
        .insert(bookChapters)
        .values({
          bookId,
          chapterNumber,
          title: def.defaultTitle,
          content: generated.content,
          wordCount: generated.wordCount,
          isEdited: true,
          chapterType: def.type,
          slug,
          ...(modelId ? { modelUsed: modelId } : {}),
        })
        .returning();
      saved = inserted;
    }

    // Bump the book's updatedAt so the library reflects the new page
    await db
      .update(generatedBooks)
      .set({ updatedAt: new Date() })
      .where(eq(generatedBooks.id, bookId));

    return NextResponse.json({
      success: true,
      page: {
        id: saved.id,
        number: saved.chapterNumber,
        title: saved.title,
        content: saved.content,
        wordCount: saved.wordCount,
        chapterType: saved.chapterType,
        slug: saved.slug,
      },
    });
  } catch (error) {
    console.error('[Generate Page] Error:', error);
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to generate page', details: message },
      { status: 500 },
    );
  }
}
