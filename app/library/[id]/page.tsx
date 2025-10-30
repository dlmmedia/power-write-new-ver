'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { BookReader } from '@/components/library/BookReader';
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-yellow-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
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

  // If reading mode is active, show full-screen reader
  if (isReading && book.chapters && book.chapters.length > 0) {
    return (
      <BookReader
        bookTitle={book.title}
        author={book.author}
        chapters={book.chapters}
        onClose={() => setIsReading(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-yellow-600 bg-black sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/library')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Library
              </button>
              <div className="bg-yellow-400 text-black font-bold px-3 py-1 text-2xl">
                PW
              </div>
              <h1 className="text-2xl font-bold">{book.title}</h1>
            </div>

            <div className="flex items-center gap-3">
              {book.chapters && book.chapters.length > 0 && (
                <Button variant="primary" onClick={() => setIsReading(true)}>
                  📖 Read Book
                </Button>
              )}
              <div className="relative group">
                <Button variant="outline">Export ▼</Button>
                <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg py-1 w-40 z-10">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors text-sm"
                  >
                    Export as PDF
                  </button>
                  <button
                    onClick={() => handleExport('docx')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors text-sm"
                  >
                    Export as DOCX
                  </button>
                  <button
                    onClick={() => handleExport('html')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors text-sm"
                  >
                    Export as HTML
                  </button>
                  <button
                    onClick={() => handleExport('md')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors text-sm"
                  >
                    Export as Markdown
                  </button>
                  <button
                    onClick={() => handleExport('txt')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors text-sm"
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
              {/* Book Info Card */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{book.title}</h2>
                    <p className="text-gray-400">by {book.author}</p>
                  </div>
                  <Badge variant={book.status === 'completed' ? 'success' : 'default'}>
                    {book.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-gray-400 text-sm">Genre:</span>
                    <p className="font-medium">{book.genre}</p>
                  </div>
                  {book.subgenre && (
                    <div>
                      <span className="text-gray-400 text-sm">Subgenre:</span>
                      <p className="font-medium">{book.subgenre}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400 text-sm">Created:</span>
                    <p className="font-medium">{new Date(book.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {book.metadata.description && (
                  <div className="mt-4">
                    <span className="text-gray-400 text-sm">Description:</span>
                    <p className="mt-1 text-gray-300">{book.metadata.description}</p>
                  </div>
                )}
              </div>

              {/* Progress Card */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h3 className="text-xl font-bold mb-4">Writing Progress</h3>
                
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Word Count</span>
                    <span className="font-medium">
                      {book.metadata.wordCount.toLocaleString()} / {book.metadata.targetWordCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div
                      className="bg-yellow-400 h-3 rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{progress.toFixed(1)}% complete</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-800 rounded p-4">
                    <div className="text-2xl font-bold text-yellow-400">{book.metadata.chapters}</div>
                    <div className="text-sm text-gray-400">Total Chapters</div>
                  </div>
                  <div className="bg-gray-800 rounded p-4">
                    <div className="text-2xl font-bold text-yellow-400">
                      {book.chapters?.filter((c) => c.status === 'completed').length || 0}
                    </div>
                    <div className="text-sm text-gray-400">Completed</div>
                  </div>
                  <div className="bg-gray-800 rounded p-4">
                    <div className="text-2xl font-bold text-yellow-400">
                      {Math.round(book.metadata.wordCount / (book.metadata.chapters || 1))}
                    </div>
                    <div className="text-sm text-gray-400">Avg Words/Chapter</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chapters' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Chapters</h3>
                {book.chapters && book.chapters.length > 0 && (
                  <Button variant="primary" onClick={() => setIsReading(true)}>
                    📖 Start Reading
                  </Button>
                )}
              </div>

              {book.chapters && book.chapters.length > 0 ? (
                <div className="space-y-3">
                  {book.chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="bg-gray-900 rounded-lg border border-gray-800 p-4 hover:border-yellow-400 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-gray-500 text-sm">Chapter {chapter.number}</span>
                            <h4 className="font-bold">{chapter.title}</h4>
                            <Badge variant={chapter.status === 'completed' ? 'success' : 'default'} size="sm">
                              {chapter.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400">{chapter.wordCount.toLocaleString()} words • ~{Math.ceil(chapter.wordCount / 200)} min read</p>
                          {chapter.content && (
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{chapter.content.substring(0, 150)}...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
                  <p className="text-gray-400 mb-4">No chapters yet</p>
                  <Button variant="primary">Generate Book</Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h3 className="text-xl font-bold mb-4">Audiobook Generation</h3>
                
                <p className="text-gray-400 mb-6">
                  Convert your book into an audiobook using AI text-to-speech. 
                  The entire book will be narrated with natural-sounding voices.
                </p>

                {audioUrl ? (
                  <div className="space-y-4">
                    <div className="bg-gray-800 rounded p-4 border border-gray-700">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-4xl">🎧</div>
                        <div className="flex-1">
                          <h4 className="font-semibold">Audiobook Ready</h4>
                          <p className="text-sm text-gray-400">Your audiobook has been generated</p>
                        </div>
                        <Badge variant="success">Available</Badge>
                      </div>

                      <audio controls className="w-full">
                        <source src={audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>

                      <div className="mt-4 flex gap-2">
                        <a
                          href={audioUrl}
                          download
                          className="inline-flex items-center px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-medium rounded transition-colors"
                        >
                          ⬇ Download Audiobook
                        </a>
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (confirm('Regenerate audiobook? This will replace the current version.')) {
                              setAudioUrl(null);
                            }
                          }}
                        >
                          🔄 Regenerate
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-800 rounded p-4 border border-gray-700">
                      <h4 className="font-semibold mb-2">Voice Options</h4>
                      <p className="text-sm text-gray-400 mb-4">
                        Current settings: Natural voice (Alloy), Normal speed, Standard quality
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Estimated Duration:</span>
                          <p className="font-medium">
                            ~{Math.ceil((book.metadata.wordCount || 0) / 150)} minutes
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">File Format:</span>
                          <p className="font-medium">MP3</p>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      onClick={handleGenerateAudio}
                      disabled={isGeneratingAudio || !book.chapters || book.chapters.length === 0}
                      className="w-full"
                    >
                      {isGeneratingAudio ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Generating Audiobook...
                        </>
                      ) : (
                        <>🎙️ Generate Audiobook</>
                      )}
                    </Button>

                    {isGeneratingAudio && (
                      <div className="bg-yellow-400/10 border border-yellow-400/50 rounded p-4">
                        <p className="text-sm text-yellow-400">
                          ⏱ This may take several minutes depending on the book length.
                          Please don't close this page.
                        </p>
                      </div>
                    )}

                    {(!book.chapters || book.chapters.length === 0) && (
                      <div className="bg-gray-800 border border-gray-700 rounded p-4">
                        <p className="text-sm text-gray-400">
                          ℹ️ No chapters available. Please generate your book first.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Chapter-by-Chapter Audio (Future Enhancement) */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h3 className="text-xl font-bold mb-4">Individual Chapters</h3>
                <p className="text-gray-400 mb-4">
                  Generate audio for specific chapters (coming soon)
                </p>
                <div className="opacity-50 pointer-events-none">
                  <div className="space-y-2">
                    {book.chapters?.slice(0, 3).map((chapter) => (
                      <div
                        key={chapter.id}
                        className="bg-gray-800 rounded p-3 border border-gray-700 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-sm">Chapter {chapter.number}: {chapter.title}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            ~{Math.ceil(chapter.wordCount / 150)} min audio
                          </div>
                        </div>
                        <Button variant="outline" size="sm" disabled>
                          Generate
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
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
