import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookChapters, generatedBooks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

    // Update or insert chapters
    for (const chapter of chapters) {
      const existingChapter = await db.query.bookChapters.findFirst({
        where: eq(bookChapters.id, chapter.id),
      });

      if (existingChapter) {
        // Update existing chapter
        await db
          .update(bookChapters)
          .set({
            title: chapter.title,
            content: chapter.content,
            wordCount: chapter.wordCount,
            chapterNumber: chapter.number,
            isEdited: true,
            updatedAt: new Date(),
          })
          .where(eq(bookChapters.id, chapter.id));
      } else {
        // Insert new chapter
        await db.insert(bookChapters).values({
          bookId,
          chapterNumber: chapter.number,
          title: chapter.title,
          content: chapter.content,
          wordCount: chapter.wordCount,
          isEdited: true,
        });
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

    return NextResponse.json({
      success: true,
      message: 'Chapters updated successfully',
    });
  } catch (error) {
    console.error('Error updating chapters:', error);
    return NextResponse.json(
      {
        error: 'Failed to update chapters',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
