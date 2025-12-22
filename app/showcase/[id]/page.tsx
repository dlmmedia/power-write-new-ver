'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { BookReader } from '@/components/library/BookReader';
import { FlipBookCover } from '@/components/library/FlipBookCover';
import { ThemeToggleCompact } from '@/components/ui/ThemeToggle';
import { Logo } from '@/components/ui/Logo';
import type { BibliographyConfig, Reference } from '@/lib/types/bibliography';

import { 
  BookOpen, 
  Clock, 
  BarChart2, 
  ChevronLeft,
  Book,
  Activity,
  CheckCircle2,
  Headphones,
  Globe,
  Library,
  ArrowLeft
} from 'lucide-react';
import { AudiobookPlayer, AudiobookChapter } from '@/components/library/AudiobookPlayer';

interface Chapter {
  id: number;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  status: 'draft' | 'completed';
  audioUrl?: string | null;
  audioDuration?: number | null;
  audioMetadata?: any;
}

interface BibliographyData {
  config: BibliographyConfig;
  references: Reference[];
}

interface BookDetail {
  id: number;
  title: string;
  author: string;
  genre: string;
  subgenre: string;
  status: string;
  createdAt: string;
  coverUrl?: string;
  backCoverUrl?: string;
  isPublic?: boolean;
  metadata: {
    wordCount: number;
    chapters: number;
    targetWordCount: number;
    description: string;
    backCoverUrl?: string;
  };
  chapters: Chapter[];
  bibliography?: BibliographyData;
}

export default function ShowcaseBookDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params?.id;

  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isReading, setIsReading] = useState(false);
  const [initialChapterIndex, setInitialChapterIndex] = useState(0);
  const [showAudiobookPlayer, setShowAudiobookPlayer] = useState(false);

  useEffect(() => {
    if (bookId) {
      fetchBookDetail();
    }
  }, [bookId]);

  const fetchBookDetail = async () => {
    setLoading(true);
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/showcase/${bookId}?_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/showcase');
          return;
        }
        throw new Error('Failed to fetch book');
      }
      
      const data = await response.json();
      setBook(data.book);
    } catch (error) {
      console.error('Error fetching book:', error);
      router.push('/showcase');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-yellow-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Book not found</h2>
          <Button variant="primary" onClick={() => router.push('/showcase')}>
            Back to Showcase
          </Button>
        </div>
      </div>
    );
  }

  const progress = (book.metadata.wordCount / book.metadata.targetWordCount) * 100;

  // Check if book has any audio
  const hasAudio = book.chapters?.some(ch => ch.audioUrl) || false;
  const chaptersWithAudio = book.chapters?.filter(ch => ch.audioUrl).length || 0;

  // Function to open the reader at a specific chapter
  const openReaderAtChapter = (chapterIndex: number) => {
    setInitialChapterIndex(chapterIndex);
    setIsReading(true);
  };

  // Function to start reading from the beginning
  const startReading = () => {
    setInitialChapterIndex(0);
    setIsReading(true);
  };

  // If reading mode is active, show full-screen reader
  if (isReading && book.chapters && book.chapters.length > 0) {
    return (
      <BookReader
        bookTitle={book.title}
        author={book.author}
        bookId={book.id}
        chapters={book.chapters}
        initialChapterIndex={initialChapterIndex}
        bibliography={book.bibliography}
        onClose={() => {
          setIsReading(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors">
      {/* Header */}
      <header className="border-b border-yellow-600/20 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-30" style={{ fontFamily: 'var(--font-header)', letterSpacing: 'var(--letter-spacing-header)', boxShadow: 'var(--shadow-header)' }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/showcase')}
                className="group relative px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/40 dark:to-amber-950/40 border border-yellow-200 dark:border-yellow-800/50 text-yellow-700 dark:text-yellow-300 hover:from-yellow-100 hover:to-amber-100 dark:hover:from-yellow-900/50 dark:hover:to-amber-900/50 hover:border-yellow-300 dark:hover:border-yellow-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md font-medium"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
                Showcase
              </button>
              <Logo size="md" />
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-yellow-500" />
                <h1 className="text-2xl font-bold line-clamp-1" style={{ fontFamily: 'var(--font-header)' }}>{book.title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggleCompact />
              {book.chapters && book.chapters.length > 0 && (
                <>
                  <Button variant="primary" onClick={startReading} className="flex items-center gap-2">
                    <Book className="w-4 h-4" />
                    Read Book
                  </Button>
                  {hasAudio && (
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAudiobookPlayer(true)} 
                      className="flex items-center gap-2 border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                    >
                      <Headphones className="w-4 h-4" />
                      Listen
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'chapters', label: 'Chapters' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Hero Section with Book Info */}
              <div className="bg-gradient-to-br from-yellow-400/10 to-yellow-600/5 dark:from-yellow-400/5 dark:to-yellow-600/10 rounded-xl border border-yellow-400/20 dark:border-yellow-600/30 p-8">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Book Cover - Flip Card */}
                  <FlipBookCover
                    title={book.title}
                    author={book.author}
                    coverUrl={book.coverUrl}
                    backCoverUrl={book.backCoverUrl || book.metadata.backCoverUrl}
                    genre={book.genre}
                    subgenre={book.subgenre}
                    wordCount={book.metadata.wordCount}
                    chapters={book.metadata.chapters}
                    description={book.metadata.description}
                    status={book.status}
                    createdAt={book.createdAt}
                  />

                  {/* Book Details */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-yellow-400 text-black text-xs font-bold rounded flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            PUBLIC SHOWCASE
                          </span>
                        </div>
                        <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-header)' }}>{book.title}</h2>
                        <p className="text-xl text-gray-600 dark:text-gray-400 mb-1">by {book.author}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Published {new Date(book.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{book.metadata.chapters}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Chapters</div>
                      </div>
                      <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                          {book.metadata.wordCount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Words</div>
                      </div>
                      <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{book.genre}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Genre</div>
                      </div>
                      <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                          ~{Math.ceil(book.metadata.wordCount / 200)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Min Read</div>
                      </div>
                    </div>

                    {book.metadata.description && (
                      <div className="mt-6 p-4 bg-white/30 dark:bg-black/10 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold mb-2 text-sm text-gray-700 dark:text-gray-300">Synopsis</h4>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{book.metadata.description}</p>
                      </div>
                    )}

                    {book.chapters && book.chapters.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-6">
                        <Button variant="primary" size="lg" onClick={startReading} className="flex-1 flex items-center justify-center gap-2">
                          <Book className="w-5 h-5" />
                          Start Reading
                        </Button>
                        {hasAudio && (
                          <Button 
                            variant="outline" 
                            size="lg" 
                            onClick={() => setShowAudiobookPlayer(true)} 
                            className="flex items-center gap-2 border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                          >
                            <Headphones className="w-5 h-5" />
                            Listen ({chaptersWithAudio} ch)
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>

                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-8 flex items-center gap-3" style={{ fontFamily: 'var(--font-nav)' }}>
                    <div className="bg-yellow-400/20 p-2 rounded-lg">
                      <Activity className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                      Book Stats
                    </span>
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="group bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                          <Book className="w-5 h-5" />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Chapters</div>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">{book.metadata.chapters}</div>
                    </div>

                    <div className="group bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-500 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Status</div>
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white capitalize">{book.status}</div>
                    </div>

                    <div className="group bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                          <BarChart2 className="w-5 h-5" />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Avg Length</div>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {Math.round(book.metadata.wordCount / (book.metadata.chapters || 1)).toLocaleString()}
                      </div>
                      <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">Words / Chapter</div>
                    </div>

                    <div className="group bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Read Time</div>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        ~{Math.ceil(book.metadata.wordCount / 200)}
                      </div>
                      <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">Minutes</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chapter Preview */}
              {book.chapters && book.chapters.length > 0 && (
                <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-nav)' }}>
                      <BookOpen className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                      Chapter Preview
                    </h3>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('chapters')}>
                      View All →
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {book.chapters.slice(0, 3).map((chapter, idx) => (
                      <div
                        key={chapter.id}
                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-yellow-400 dark:hover:border-yellow-500 transition-all group cursor-pointer"
                        onClick={() => openReaderAtChapter(idx)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="text-yellow-600 dark:text-yellow-400 font-bold text-lg">Ch. {chapter.number}</span>
                            <h4 className="font-bold text-gray-900 dark:text-white">{chapter.title}</h4>
                            {chapter.audioUrl && (
                              <span title="Audio available">
                                <Headphones className="w-4 h-4 text-green-500" />
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {chapter.wordCount.toLocaleString()} words • ~{Math.ceil(chapter.wordCount / 200)} min read
                        </p>
                        {chapter.content && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 italic">
                            {chapter.content.substring(0, 200)}...
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'chapters' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-nav)' }}>
                    <span className="text-yellow-600 dark:text-yellow-400">📚</span>
                    All Chapters
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {book.chapters?.length || 0} chapters • {book.metadata.wordCount.toLocaleString()} total words
                  </p>
                </div>
                {book.chapters && book.chapters.length > 0 && (
                  <Button variant="primary" onClick={startReading}>
                    📖 Start Reading
                  </Button>
                )}
              </div>

              {book.chapters && book.chapters.length > 0 ? (
                <div className="space-y-3">
                  {book.chapters.map((chapter, idx) => (
                    <div
                      key={chapter.id}
                      className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800 p-5 hover:border-yellow-400 dark:hover:border-yellow-500 transition-all group cursor-pointer"
                      onClick={() => openReaderAtChapter(idx)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div 
                              className="bg-yellow-400 dark:bg-yellow-500 text-black font-bold rounded-full w-10 h-10 flex items-center justify-center text-sm"
                            >
                              {chapter.number}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                                  {chapter.title}
                                </h4>
                                {chapter.audioUrl && (
                                  <span title="Audio available">
                                    <Headphones className="w-4 h-4 text-green-500" />
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {chapter.wordCount.toLocaleString()} words
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  ~{Math.ceil(chapter.wordCount / 200)} min read
                                </span>
                              </div>
                            </div>
                          </div>
                          {chapter.content && (
                            <div className="mt-3 pl-13">
                              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed italic">
                                "{chapter.content.substring(0, 250).trim()}..."
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="text-yellow-600 dark:text-yellow-400 text-2xl">→</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-300 dark:border-gray-800">
                  <p className="text-gray-600 dark:text-gray-400 text-lg">No chapters available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Audiobook Player Modal */}
      {showAudiobookPlayer && book.chapters && (
        <AudiobookPlayer
          bookId={book.id}
          bookTitle={book.title}
          author={book.author}
          coverUrl={book.coverUrl}
          chapters={book.chapters.map(ch => ({
            id: ch.id,
            number: ch.number,
            title: ch.title,
            content: ch.content,
            wordCount: ch.wordCount,
            audioUrl: ch.audioUrl,
            audioDuration: ch.audioDuration,
            audioMetadata: ch.audioMetadata,
          }))}
          onClose={() => {
            setShowAudiobookPlayer(false);
          }}
          isModal={true}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button variant="outline" onClick={() => router.push('/showcase')} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Showcase
            </Button>
            <Button variant="outline" onClick={() => router.push('/library')} className="flex items-center gap-2">
              <Library className="w-4 h-4" />
              Visit Library
            </Button>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            © 2025 PowerWrite. This book is publicly shared by its author.
          </p>
        </div>
      </footer>
    </div>
  );
}
