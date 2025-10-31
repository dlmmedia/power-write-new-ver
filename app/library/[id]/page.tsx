'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { BookReader } from '@/components/library/BookReader';
import { BookEditor } from '@/components/library/BookEditor';
import { AudioGenerator } from '@/components/library/AudioGenerator';
import { ThemeToggleCompact } from '@/components/ui/ThemeToggle';
import { getDemoUserId } from '@/lib/services/demo-account';

interface Chapter {
  id: number;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  status: 'draft' | 'completed';
}

interface BookDetail {
  id: number;
  title: string;
  author: string;
  genre: string;
  subgenre: string;
  status: string;
  createdAt: string;
  metadata: {
    wordCount: number;
    chapters: number;
    targetWordCount: number;
    description: string;
  };
  chapters: Chapter[];
}

export default function BookDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params?.id;

  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isReading, setIsReading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (bookId) {
      fetchBookDetail();
    }
  }, [bookId]);

  const fetchBookDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/books/${bookId}`);
      const data = await response.json();
      setBook(data.book);
    } catch (error) {
      console.error('Error fetching book:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'docx' | 'txt' | 'md' | 'html') => {
    try {
      if (!book) return;
      
      const response = await fetch('/api/books/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getDemoUserId(),
          bookId: book.id,
          format,
        }),
      });

      if (response.ok) {
        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        alert('Export failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export book');
    }
  };

  const handleGenerateAudio = async () => {
    if (!book) return;

    const confirmed = confirm(
      'Generate audiobook for entire book?\n\n' +
      'This will convert all chapters to speech. It may take several minutes.\n\n' +
      'Continue?'
    );

    if (!confirmed) return;

    setIsGeneratingAudio(true);
    try {
      const response = await fetch('/api/generate/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getDemoUserId(),
          bookId: book.id.toString(),
          voice: 'alloy',
          speed: 1.0,
          model: 'tts-1',
        }),
      });

      const data = await response.json();
      if (data.success && data.audioUrl) {
        setAudioUrl(data.audioUrl);
        alert('Audiobook generated successfully!');
      } else {
        alert('Failed to generate audio: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Audio generation error:', error);
      alert('Failed to generate audiobook');
    } finally {
      setIsGeneratingAudio(false);
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
          <Button variant="primary" onClick={() => router.push('/library')}>
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  const progress = (book.metadata.wordCount / book.metadata.targetWordCount) * 100;

  // If editing mode is active, show full-screen editor
  if (isEditing && book.chapters && book.chapters.length > 0) {
    return (
      <BookEditor
        bookId={book.id}
        bookTitle={book.title}
        author={book.author}
        chapters={book.chapters}
        onClose={() => {
          setIsEditing(false);
          fetchBookDetail(); // Refresh book data
        }}
        onSave={(updatedChapters) => {
          // Update local state
          setBook(prev => prev ? {...prev, chapters: updatedChapters} : null);
        }}
      />
    );
  }

  // If reading mode is active, show full-screen reader
  if (isReading && book.chapters && book.chapters.length > 0) {
    return (
      <BookReader
        bookTitle={book.title}
        author={book.author}
        bookId={book.id}
        chapters={book.chapters}
        onClose={() => setIsReading(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors">
      {/* Header */}
      <header className="border-b border-yellow-600 bg-white dark:bg-black sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/library')}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                ← Library
              </button>
              <div className="bg-yellow-400 text-black font-bold px-3 py-1 text-2xl">
                PW
              </div>
              <h1 className="text-2xl font-bold">{book.title}</h1>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggleCompact />
              {book.chapters && book.chapters.length > 0 && (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    ✏️ Edit
                  </Button>
                  <Button variant="primary" onClick={() => setIsReading(true)}>
                    📖 Read Book
                  </Button>
                </>
              )}
              <div className="relative group">
                <Button variant="outline">Export ▼</Button>
                <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg py-1 w-40 z-10">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                  >
                    Export as PDF
                  </button>
                  <button
                    onClick={() => handleExport('docx')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                  >
                    Export as DOCX
                  </button>
                  <button
                    onClick={() => handleExport('html')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                  >
                    Export as HTML
                  </button>
                  <button
                    onClick={() => handleExport('md')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                  >
                    Export as Markdown
                  </button>
                  <button
                    onClick={() => handleExport('txt')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                  >
                    Export as TXT
                  </button>
                </div>
              </div>
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
            { id: 'audio', label: 'Audio' },
            { id: 'settings', label: 'Settings' }
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
                  {/* Book Cover Mock */}
                  <div className="flex-shrink-0">
                    <div className="w-48 h-72 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg shadow-2xl flex items-center justify-center text-black font-bold text-6xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-black/5 backdrop-blur-sm"></div>
                      <span className="relative z-10">📖</span>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/20 p-4 text-xs text-center">
                        {book.title.substring(0, 30)}{book.title.length > 30 ? '...' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Book Details */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-4xl font-bold mb-2">{book.title}</h2>
                        <p className="text-xl text-gray-600 dark:text-gray-400 mb-1">by {book.author}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <Badge variant={book.status === 'completed' ? 'success' : 'default'} size="lg">
                            {book.status}
                          </Badge>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Created {new Date(book.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
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
                      <div className="flex gap-3 mt-6">
                        <Button variant="primary" size="lg" onClick={() => setIsReading(true)} className="flex-1">
                          📖 Start Reading
                        </Button>
                        <Button variant="outline" size="lg" onClick={() => setIsEditing(true)}>
                          ✏️ Edit
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Card */}
              <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800 p-6">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <span className="text-yellow-600 dark:text-yellow-400">📊</span>
                  Writing Progress
                </h3>
                
                <div className="mb-8">
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Word Count Progress</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {book.metadata.wordCount.toLocaleString()} / {book.metadata.targetWordCount.toLocaleString()} words
                    </span>
                  </div>
                  <div className="w-full bg-gray-300 dark:bg-gray-800 rounded-full h-4 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-4 rounded-full transition-all duration-500 shadow-md relative overflow-hidden"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{progress.toFixed(1)}% complete</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(book.metadata.targetWordCount - book.metadata.wordCount).toLocaleString()} words remaining
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{book.metadata.chapters}</div>
                    <div className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">Total Chapters</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {book.chapters?.filter((c) => c.status === 'completed').length || 0}
                    </div>
                    <div className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">Completed</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {Math.round(book.metadata.wordCount / (book.metadata.chapters || 1)).toLocaleString()}
                    </div>
                    <div className="text-xs text-purple-600/80 dark:text-purple-400/80 mt-1">Avg Words/Ch</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {Math.ceil(book.metadata.wordCount / 200)}
                    </div>
                    <div className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-1">Min Read</div>
                  </div>
                </div>
              </div>

              {/* Recent Chapters Preview */}
              {book.chapters && book.chapters.length > 0 && (
                <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      <span className="text-yellow-600 dark:text-yellow-400">📚</span>
                      Chapter Preview
                    </h3>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('chapters')}>
                      View All →
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {book.chapters.slice(0, 3).map((chapter) => (
                      <div
                        key={chapter.id}
                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-yellow-400 dark:hover:border-yellow-500 transition-all cursor-pointer"
                        onClick={() => setIsReading(true)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-yellow-600 dark:text-yellow-400 font-bold text-lg">Ch. {chapter.number}</span>
                            <h4 className="font-bold text-gray-900 dark:text-white">{chapter.title}</h4>
                          </div>
                          <Badge variant={chapter.status === 'completed' ? 'success' : 'default'} size="sm">
                            {chapter.status}
                          </Badge>
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
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400">📚</span>
                    All Chapters
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {book.chapters?.length || 0} chapters • {book.metadata.wordCount.toLocaleString()} total words
                  </p>
                </div>
                {book.chapters && book.chapters.length > 0 && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      ✏️ Edit
                    </Button>
                    <Button variant="primary" onClick={() => setIsReading(true)}>
                      📖 Start Reading
                    </Button>
                  </div>
                )}
              </div>

              {book.chapters && book.chapters.length > 0 ? (
                <div className="space-y-3">
                  {book.chapters.map((chapter, idx) => (
                    <div
                      key={chapter.id}
                      className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800 p-5 hover:border-yellow-400 dark:hover:border-yellow-500 transition-all cursor-pointer group"
                      onClick={() => setIsReading(true)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="bg-yellow-400 dark:bg-yellow-500 text-black font-bold rounded-full w-10 h-10 flex items-center justify-center text-sm">
                              {chapter.number}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                                {chapter.title}
                              </h4>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {chapter.wordCount.toLocaleString()} words
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  ~{Math.ceil(chapter.wordCount / 200)} min read
                                </span>
                                <Badge variant={chapter.status === 'completed' ? 'success' : 'default'} size="sm">
                                  {chapter.status}
                                </Badge>
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
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">No chapters yet</p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mb-6 max-w-md mx-auto">
                    Generate your book in the Studio to create chapters that will appear here.
                  </p>
                  <Button variant="primary" onClick={() => router.push('/studio')}>Go to Studio</Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'audio' && book.chapters && book.chapters.length > 0 && (
            <AudioGenerator
              bookId={book.id}
              bookTitle={book.title}
              chapters={book.chapters}
              userId={getDemoUserId()}
              onAudioGenerated={(data) => {
                if (data.type === 'full') {
                  setAudioUrl(data.audioUrl);
                }
              }}
            />
          )}

          {activeTab === 'audio' && (!book.chapters || book.chapters.length === 0) && (
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800 p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                ℹ️ No chapters available. Please generate your book first.
              </p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800 p-6">
              <h3 className="text-xl font-bold mb-6">Book Settings</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Danger Zone</h4>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      Duplicate Book
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Archive Book
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-red-400 border-red-900 hover:bg-red-900/20">
                      Delete Book
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
