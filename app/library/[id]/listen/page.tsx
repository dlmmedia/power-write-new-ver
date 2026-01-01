'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AudiobookPlayer, AudiobookChapter } from '@/components/library/AudiobookPlayer';
import { Loader2 } from 'lucide-react';

interface BookData {
  id: number;
  title: string;
  author: string;
  coverUrl?: string;
  chapters: AudiobookChapter[];
}

export default function ListenPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params?.id as string;

  const [book, setBook] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookId) {
      fetchBookData();
    }
  }, [bookId]);

  const fetchBookData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/books/${bookId}?_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch book');
      }

      const data = await response.json();
      
      if (!data.book) {
        throw new Error('Book not found');
      }

      // Transform chapters to match AudiobookChapter interface
      const chapters: AudiobookChapter[] = data.book.chapters.map((ch: any) => ({
        id: ch.id,
        number: ch.number,
        title: ch.title,
        content: ch.content,
        wordCount: ch.wordCount,
        audioUrl: ch.audioUrl,
        audioDuration: ch.audioDuration,
        audioMetadata: ch.audioMetadata,
      }));

      setBook({
        id: data.book.id,
        title: data.book.title,
        author: data.book.author,
        coverUrl: data.book.coverUrl,
        chapters,
      });
    } catch (err) {
      console.error('Error fetching book:', err);
      setError(err instanceof Error ? err.message : 'Failed to load book');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    router.push(`/library/${bookId}`);
  };

  const handleProgressUpdate = (chapterIndex: number, currentTime: number) => {
    // Progress is automatically saved by the AudiobookPlayer component
    // This callback can be used for additional tracking if needed
    console.log(`[ListenPage] Progress update: Chapter ${chapterIndex}, Time ${currentTime}`);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading audiobook...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center px-8">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Unable to Load Audiobook</h2>
          <p className="text-gray-400 mb-6">{error || 'Book not found'}</p>
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-full transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <AudiobookPlayer
      bookId={book.id}
      bookTitle={book.title}
      author={book.author}
      coverUrl={book.coverUrl}
      chapters={book.chapters}
      onClose={handleClose}
      onProgressUpdate={handleProgressUpdate}
      isModal={false}
    />
  );
}














