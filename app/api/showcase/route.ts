import { NextRequest, NextResponse } from 'next/server';
import { getPublicBooks, getBooksAudioStats } from '@/lib/db/operations';
import { isBlockedBookTitle } from '@/lib/utils/blocked-book-titles';

export const runtime = 'nodejs';

// GET /api/showcase - Fetch all public/showcased books (no auth required)
export async function GET(request: NextRequest) {
  try {
    // Get all public books
    const publicBooksRaw = await getPublicBooks();
    const publicBooks = publicBooksRaw.filter((b) => !isBlockedBookTitle(b.title));

    // Get audio stats for all books
    let audioStatsMap = new Map<number, { chaptersWithAudio: number; totalChapters: number; totalDuration: number }>();
    try {
      const bookIds = publicBooks.map(book => book.id);
      audioStatsMap = await getBooksAudioStats(bookIds);
    } catch (audioError) {
      console.error('Error fetching audio stats:', audioError);
      // Continue without audio stats
    }

    // Format books for response
    const books = publicBooks.map(book => {
      const metadata = (book.metadata as any) || {};
      const audioStats = audioStatsMap.get(book.id);
      
      return {
        id: book.id,
        title: book.title || 'Untitled',
        author: book.author || 'Unknown',
        genre: book.genre || 'General Fiction',
        status: book.status || 'completed',
        coverUrl: book.coverUrl || undefined,
        summary: book.summary || '',
        createdAt: book.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: book.updatedAt?.toISOString() || new Date().toISOString(),
        metadata: {
          wordCount: metadata.wordCount || 0,
          chapters: metadata.chapters || 0,
          description: book.summary || '',
        },
        audioStats: audioStats ? {
          chaptersWithAudio: audioStats.chaptersWithAudio,
          totalChapters: audioStats.totalChapters,
          totalDuration: audioStats.totalDuration,
        } : null,
      };
    });

    return NextResponse.json({
      success: true,
      books,
      count: books.length,
    });
  } catch (error) {
    console.error('Error fetching showcase books:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch showcase books', details: message },
      { status: 500 }
    );
  }
}
