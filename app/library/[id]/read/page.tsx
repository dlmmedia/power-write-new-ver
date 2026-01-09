'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { BookOpen, AlertCircle } from 'lucide-react';
import type { Chapter } from '@/components/library/reader/types';

// Preload the ImmersiveReader for faster initial load
const ImmersiveReader = dynamic(
  () => import('@/components/library/reader/ImmersiveReader').then(mod => ({ default: mod.ImmersiveReader })),
  { 
    loading: () => <MinimalLoadingScreen />,
    ssr: false 
  }
);

// Minimal loading screen - lightweight and fast
function MinimalLoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-100 via-gray-50 to-slate-100 dark:from-gray-950 dark:via-black dark:to-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-4">
          <div className="w-16 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-sm shadow-xl mx-auto flex items-center justify-center animate-pulse">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-1">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

interface BookData {
  id: number;
  title: string;
  author: string;
  coverUrl?: string;
  chapters: Chapter[];
}

function ReadPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const bookId = params?.id as string;
  const initialChapter = parseInt(searchParams?.get('chapter') || '0', 10);

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
      // Use simpler request without cache-busting for faster response
      const response = await fetch(`/api/books/${bookId}`, {
        next: { revalidate: 0 },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch book');
      }

      const data = await response.json();
      
      if (!data.book) {
        throw new Error('Book not found');
      }

      // Transform chapters to match Chapter interface - optimized mapping
      const chapters: Chapter[] = data.book.chapters
        .filter((ch: any) => ch.content && ch.content.trim().length > 0)
        .map((ch: any) => ({
          id: ch.id,
          number: ch.number,
          title: ch.title,
          content: ch.content || '',
          wordCount: ch.wordCount || 0,
          status: ch.status || 'draft',
          audioUrl: ch.audioUrl,
          audioDuration: ch.audioDuration,
        }));

      if (chapters.length === 0) {
        throw new Error('This book has no content to read');
      }

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

  if (loading) {
    return <MinimalLoadingScreen />;
  }

  if (error || !book) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-100 via-gray-50 to-slate-100 dark:from-gray-950 dark:via-black dark:to-gray-950 flex items-center justify-center">
        <div className="text-center px-8 max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Unable to Open Book
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {error || 'Book not found'}
          </p>
          <button
            onClick={handleClose}
            className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-full transition-colors shadow-lg shadow-amber-500/20"
          >
            Go Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <ImmersiveReader
      bookId={book.id}
      bookTitle={book.title}
      author={book.author}
      coverUrl={book.coverUrl}
      chapters={book.chapters}
      initialChapterIndex={Math.min(initialChapter, book.chapters.length - 1)}
      onClose={handleClose}
    />
  );
}

export default function ReadPage() {
  return (
    <Suspense fallback={<MinimalLoadingScreen />}>
      <ReadPageContent />
    </Suspense>
  );
}
