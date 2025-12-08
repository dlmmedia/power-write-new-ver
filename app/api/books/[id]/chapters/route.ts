import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookChapters, generatedBooks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Helper to check if an ID is a temporary client-side ID (from Date.now())
// Real database IDs are serial integers (typically < 1 million)
// Date.now() returns timestamps like 1733630000000
const isTemporaryId = (id: number): boolean => {
  return id > 1000000000; // IDs greater than 1 billion are likely Date.now() timestamps
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id);
    const body = await request.json();
    const { chapters } = body as {
      chapters: Array<{
        id: number;
        number: number;
        title: string;
        content: string;
        wordCount: number;
        status: 'draft' | 'completed';
      }>;
    };

    if (!chapters || !Array.isArray(chapters)) {
      return NextResponse.json(
        { error: 'Invalid chapters data' },
        { status: 400 }
      );
    }

    console.log(`[Chapters API] Updating ${chapters.length} chapters for book ${bookId}`);

    const updatedChapters = [];

    // Update or insert chapters
    for (const chapter of chapters) {
      const hasTemporaryId = isTemporaryId(chapter.id);
      
      let existingChapter = null;
      
      if (!hasTemporaryId) {
        // For real database IDs, look up by ID
        existingChapter = await db.query.bookChapters.findFirst({
          where: eq(bookChapters.id, chapter.id),
        });
      } else {
        // For temporary IDs (new chapters), check if chapter number already exists for this book
        existingChapter = await db.query.bookChapters.findFirst({
          where: and(
            eq(bookChapters.bookId, bookId),
            eq(bookChapters.chapterNumber, chapter.number)
          ),
        });
      }

      if (existingChapter) {
        // Update existing chapter
        console.log(`[Chapters API] Updating existing chapter ${chapter.number} (db id: ${existingChapter.id})`);
        const [updated] = await db
          .update(bookChapters)
          .set({
            title: chapter.title,
            content: chapter.content,
            wordCount: chapter.wordCount,
            chapterNumber: chapter.number,
            isEdited: true,
            updatedAt: new Date(),
          })
          .where(eq(bookChapters.id, existingChapter.id))
          .returning();
        updatedChapters.push(updated);
      } else {
        // Insert new chapter
        console.log(`[Chapters API] Inserting new chapter ${chapter.number}`);
        const [inserted] = await db.insert(bookChapters).values({
          bookId,
          chapterNumber: chapter.number,
          title: chapter.title,
          content: chapter.content,
          wordCount: chapter.wordCount,
          isEdited: true,
        }).returning();
        updatedChapters.push(inserted);
      }
    }

    // Update book metadata
    const totalWordCount = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
    await db
      .update(generatedBooks)
      .set({
        metadata: { wordCount: totalWordCount, chapters: chapters.length },
        updatedAt: new Date(),
      })
      .where(eq(generatedBooks.id, bookId));

    console.log(`[Chapters API] Successfully saved ${updatedChapters.length} chapters`);

    return NextResponse.json({
      success: true,
      message: 'Chapters updated successfully',
      chapters: updatedChapters.map(ch => ({
        id: ch.id,
        number: ch.chapterNumber,
        title: ch.title,
        wordCount: ch.wordCount,
      })),
    });
  } catch (error) {
    console.error('[Chapters API] Error updating chapters:', error);
    return NextResponse.json(
      {
        error: 'Failed to update chapters',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
