import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createBook, createMultipleChapters } from '@/lib/db/operations';
import { canGenerateBook } from '@/lib/services/user-service';
import { countWords } from '@/lib/services/book-parser-service';

// Set max duration for database operations
export const maxDuration = 30;

interface ImportChapter {
  number: number;
  title: string;
  content: string;
  wordCount?: number;
}

interface ImportBookRequest {
  title: string;
  author: string;
  genre?: string;
  description?: string;
  chapters: ImportChapter[];
  sourceFile?: {
    name: string;
    type: string;
    size: number;
  };
}

/**
 * POST /api/books/import
 * Create a new book from parsed/imported content
 */
export async function POST(request: NextRequest) {
  console.log('[Import] Book import request received');
  
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: ImportBookRequest = await request.json();
    const { title, author, genre, description, chapters, sourceFile } = body;

    // Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Book title is required' },
        { status: 400 }
      );
    }

    if (!author || !author.trim()) {
      return NextResponse.json(
        { error: 'Author name is required' },
        { status: 400 }
      );
    }

    if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
      return NextResponse.json(
        { error: 'At least one chapter is required' },
        { status: 400 }
      );
    }

    // Validate chapters have content
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      if (!chapter.content || !chapter.content.trim()) {
        return NextResponse.json(
          { error: `Chapter ${i + 1} has no content` },
          { status: 400 }
        );
      }
    }

    // Check if user can create a book (quota check)
    const generationCheck = await canGenerateBook(userId);
    
    if (!generationCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Book limit reached',
          details: generationCheck.reason,
          tier: generationCheck.tier,
          booksGenerated: generationCheck.booksGenerated,
          maxBooks: generationCheck.maxBooks,
        },
        { status: 403 }
      );
    }

    console.log(`[Import] Creating book: "${title}" by ${author} with ${chapters.length} chapters`);

    // Calculate total word count
    const totalWordCount = chapters.reduce((sum, ch) => {
      return sum + (ch.wordCount || countWords(ch.content));
    }, 0);

    // Create the book
    const newBook = await createBook({
      userId,
      title: title.trim(),
      author: author.trim(),
      genre: genre?.trim() || 'General Fiction',
      summary: description?.trim() || '',
      status: 'completed', // Imported books are complete
      metadata: {
        wordCount: totalWordCount,
        chapters: chapters.length,
        targetWordCount: totalWordCount,
        source: 'imported',
        importedFrom: sourceFile ? {
          fileName: sourceFile.name,
          fileType: sourceFile.type,
          fileSize: sourceFile.size,
          importedAt: new Date().toISOString(),
        } : null,
      },
    });

    console.log(`[Import] Book created with ID: ${newBook.id}`);

    // Create chapters
    const chapterData = chapters.map((chapter, index) => ({
      bookId: newBook.id,
      chapterNumber: chapter.number || index + 1,
      title: chapter.title?.trim() || `Chapter ${index + 1}`,
      content: chapter.content.trim(),
      wordCount: chapter.wordCount || countWords(chapter.content),
      isEdited: false,
    }));

    const createdChapters = await createMultipleChapters(chapterData);

    console.log(`[Import] Created ${createdChapters.length} chapters`);

    return NextResponse.json({
      success: true,
      book: {
        id: newBook.id,
        title: newBook.title,
        author: newBook.author,
        genre: newBook.genre,
        status: newBook.status,
        createdAt: newBook.createdAt,
        metadata: newBook.metadata,
      },
      chapters: createdChapters.map(ch => ({
        id: ch.id,
        number: ch.chapterNumber,
        title: ch.title,
        wordCount: ch.wordCount,
      })),
      message: `Successfully imported "${title}" with ${createdChapters.length} chapters`,
    });
  } catch (error) {
    console.error('[Import] Error importing book:', error);
    return NextResponse.json(
      {
        error: 'Failed to import book',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
