'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { BookReader } from '@/components/library/BookReader';
import { BookEditor } from '@/components/library/BookEditor';
import { AudioGenerator } from '@/components/library/AudioGenerator';
import { BibliographyManager } from '@/components/library/BibliographyManager';
import CoverGenerator from '@/components/studio/CoverGenerator';
import { PublishingSettings } from '@/components/library/publishing';
import { FlipBookCover } from '@/components/library/FlipBookCover';
import { ThemeToggleCompact } from '@/components/ui/ThemeToggle';
import { getDemoUserId } from '@/lib/services/demo-account';
import { Logo } from '@/components/ui/Logo';
import type { BibliographyConfig, Reference } from '@/lib/types/bibliography';

import { 
  BookOpen, 
  Clock, 
  PenTool, 
  BarChart2, 
  MoreVertical, 
  Download, 
  Share2, 
  Trash2, 
  Archive, 
  Copy,
  ChevronLeft,
  Edit3,
  Book,
  FileText,
  Activity,
  CheckCircle2,
  AlertCircle,
  Headphones
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
  coverUrl?: string; // Add cover URL to interface
  backCoverUrl?: string; // Add back cover URL to interface
  metadata: {
    wordCount: number;
    chapters: number;
    targetWordCount: number;
    description: string;
    backCoverUrl?: string; // Back cover URL in metadata
    modelUsed?: string; // Model used for generation
  };
  chapters: Chapter[];
  bibliography?: BibliographyData;
}

export default function BookDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params?.id;

  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isReading, setIsReading] = useState(false);
  const [initialChapterIndex, setInitialChapterIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showBibliography, setShowBibliography] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showAudiobookPlayer, setShowAudiobookPlayer] = useState(false);

  useEffect(() => {
    if (bookId) {
      fetchBookDetail();
    }
  }, [bookId]);

  const fetchBookDetail = async () => {
    setLoading(true);
    try {
      // Add cache busting to ensure fresh data
      const timestamp = Date.now();
      const response = await fetch(`/api/books/${bookId}?_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await response.json();
      setBook(data.book);
    } catch (error) {
      console.error('Error fetching book:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'docx' | 'txt' | 'md' | 'html' | 'epub') => {
    if (!book) return;
    
    setIsExporting(true);
    setShowExportMenu(false);
    
    try {
      console.log(`Starting export as ${format.toUpperCase()}...`);
      
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
        console.log(`Export successful, downloading ${format} file...`);
        
        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);
        
        alert(`✓ Successfully exported as ${format.toUpperCase()}`);
      } else {
        // Log response details for debugging
        console.error('Export failed with status:', response.status, response.statusText);
        const contentType = response.headers.get('content-type');
        console.error('Response content-type:', contentType);
        
        let errorMessage = 'Unknown error';
        try {
          const text = await response.text();
          console.error('Response text:', text);
          
          // Try to parse as JSON
          if (contentType?.includes('application/json')) {
            const data = JSON.parse(text);
            errorMessage = data.error || data.details || 'Unknown error';
            console.error('Parsed error data:', data);
          } else {
            errorMessage = text || 'Server returned non-JSON response';
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          errorMessage = 'Failed to parse error response';
        }
        
        alert(`Export failed: ${errorMessage}\n\nPlease check the console for more details.`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert(`Failed to export book as ${format.toUpperCase()}.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check your connection and try again.`);
    } finally {
      setIsExporting(false);
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

  const handleDeleteBook = async () => {
    if (!book) return;

    const confirmed = confirm(
      `⚠️ Delete "${book.title}"?\n\n` +
      'This action cannot be undone. All chapters, audio, and associated data will be permanently deleted.\n\n' +
      'Are you sure you want to continue?'
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/books/${book.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        alert('✓ Book deleted successfully');
        router.push('/library');
      } else {
        alert('Failed to delete book: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete book. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchiveBook = async () => {
    if (!book) return;

    const isArchived = book.status === 'archived';
    const action = isArchived ? 'Unarchive' : 'Archive';
    const newStatus = isArchived ? 'completed' : 'archived';

    const confirmed = confirm(
      `${action} "${book.title}"?\n\n` +
      (isArchived 
        ? 'This will restore the book to your active library.'
        : 'This will move the book to your archived books. You can unarchive it later.') +
      '\n\nContinue?'
    );

    if (!confirmed) return;

    setIsArchiving(true);
    try {
      const response = await fetch(`/api/books/${book.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`✓ Book ${action.toLowerCase()}d successfully`);
        // Refresh book data
        await fetchBookDetail();
      } else {
        alert(`Failed to ${action.toLowerCase()} book: ` + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Archive error:', error);
      alert(`Failed to ${action.toLowerCase()} book. Please try again.`);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDuplicateBook = async () => {
    if (!book) return;

    const confirmed = confirm(
      `Duplicate "${book.title}"?\n\n` +
      'This will create a copy of the book with all its chapters and content.\n\n' +
      'Continue?'
    );

    if (!confirmed) return;

    setIsDuplicating(true);
    try {
      const response = await fetch(`/api/books/${book.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: getDemoUserId() }),
      });

      const data = await response.json();
      if (data.success && data.book) {
        alert('✓ Book duplicated successfully!');
        // Navigate to the new book
        router.push(`/library/${data.book.id}`);
      } else {
        alert('Failed to duplicate book: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Duplicate error:', error);
      alert('Failed to duplicate book. Please try again.');
    } finally {
      setIsDuplicating(false);
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

  // If editing mode is active, show full-screen editor
  if (isEditing && book.chapters && book.chapters.length > 0) {
    return (
      <BookEditor
        bookId={book.id}
        bookTitle={book.title}
        author={book.author}
        genre={book.genre}
        chapters={book.chapters}
        onClose={() => {
          setIsEditing(false);
          fetchBookDetail(); // Refresh book data
        }}
        onSave={(updatedChapters) => {
          // Update local state
          setBook(prev => prev ? {...prev, chapters: updatedChapters} : null);
        }}
        modelId={book.metadata.modelUsed}
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
        initialChapterIndex={initialChapterIndex}
        bibliography={book.bibliography}
        onClose={() => {
          setIsReading(false);
          // Refresh book data to get any newly generated audio
          fetchBookDetail();
        }}
        onAudioGenerated={(chapterNumber, audioUrl, duration) => {
          // Update local state immediately when audio is generated in reader
          if (book) {
            const updatedChapters = book.chapters.map(ch => 
              ch.number === chapterNumber 
                ? { ...ch, audioUrl, audioDuration: duration }
                : ch
            );
            setBook({ ...book, chapters: updatedChapters });
          }
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
                onClick={() => router.push('/library')}
                className="group relative px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/40 dark:to-amber-950/40 border border-yellow-200 dark:border-yellow-800/50 text-yellow-700 dark:text-yellow-300 hover:from-yellow-100 hover:to-amber-100 dark:hover:from-yellow-900/50 dark:hover:to-amber-900/50 hover:border-yellow-300 dark:hover:border-yellow-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md font-medium"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
                Library
              </button>
              <Logo size="md" />
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-header)' }}>{book.title}</h1>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggleCompact />
              {book.chapters && book.chapters.length > 0 && (
                <>
                  <Button variant="outline" onClick={() => setShowBibliography(true)} className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Bibliography
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </Button>
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
              <div className="relative">
                <Button 
                  variant="outline" 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={isExporting}
                  className="flex items-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Export
                    </>
                  )}
                </Button>
                
                {showExportMenu && (
                  <>
                    {/* Backdrop to close menu */}
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setShowExportMenu(false)}
                    />
                    
                    {/* Export menu */}
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl py-1 w-56 z-20">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                        Export As
                      </div>
                      <button
                        onClick={() => handleExport('pdf')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-900 dark:text-white font-medium flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-red-500" />
                        PDF Document
                      </button>
                      <button
                        onClick={() => handleExport('docx')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-900 dark:text-white font-medium flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-blue-500" />
                        Word (DOCX)
                      </button>
                      <button
                        onClick={() => handleExport('epub')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-900 dark:text-white font-medium flex items-center gap-2"
                      >
                        <Book className="w-4 h-4 text-orange-500" />
                        EPUB (Kindle/KDP)
                      </button>
                      <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                      <button
                        onClick={() => handleExport('html')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-900 dark:text-white flex items-center gap-2"
                      >
                        <code className="w-4 h-4 flex items-center justify-center font-bold text-green-500">&lt;/&gt;</code>
                        HTML
                      </button>
                      <button
                        onClick={() => handleExport('md')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-900 dark:text-white flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-gray-500" />
                        Markdown
                      </button>
                      <button
                        onClick={() => handleExport('txt')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-900 dark:text-white flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-gray-400" />
                        Plain Text
                      </button>
                    </div>
                  </>
                )}
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
            { id: 'cover', label: 'Cover' },
            { id: 'audio', label: 'Audio' },
            { id: 'publishing', label: 'Publishing' },
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
                        <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-header)' }}>{book.title}</h2>
                        <p className="text-xl text-gray-600 dark:text-gray-400 mb-1">by {book.author}</p>
                        <div className="flex items-center gap-3 mt-3">
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
                        <Button variant="outline" size="lg" onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                          <Edit3 className="w-5 h-5" />
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl p-8 mb-8">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>

                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-8 flex items-center gap-3" style={{ fontFamily: 'var(--font-nav)' }}>
                    <div className="bg-yellow-400/20 p-2 rounded-lg">
                      <Activity className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                      Writing Progress
                    </span>
                  </h3>
                  
                  <div className="mb-8 bg-white/50 dark:bg-black/20 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                    <div className="flex justify-between text-sm mb-4">
                      <span className="text-gray-600 dark:text-gray-400 font-semibold tracking-wide uppercase text-xs">Overall Completion</span>
                      <span className="font-bold text-gray-900 dark:text-white font-mono">
                        {book.metadata.wordCount.toLocaleString()} <span className="text-gray-400 font-normal">/</span> {book.metadata.targetWordCount.toLocaleString()} <span className="text-gray-400 font-normal">words</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-5 shadow-inner overflow-hidden border border-gray-300 dark:border-gray-600">
                      <div
                        className="bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-500 h-full rounded-full transition-all duration-1000 ease-out shadow-lg relative"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress-stripes_1s_linear_infinite]"></div>
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-3 items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{progress.toFixed(1)}%</span>
                        <span className="text-xs text-green-500 font-medium bg-green-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                           <CheckCircle2 className="w-3 h-3" /> On Track
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {(book.metadata.targetWordCount - book.metadata.wordCount).toLocaleString()} words to go
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="group bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                          <Book className="w-5 h-5" />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Chapters</div>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{book.metadata.chapters}</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Planned</div>
                    </div>

                    <div className="group bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-500 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                          <PenTool className="w-5 h-5" />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Generated</div>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        {book.chapters?.filter((c) => c.content && c.content.length > 100).length || 0}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400 font-medium">Chapters Done</div>
                    </div>

                    <div className="group bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                          <BarChart2 className="w-5 h-5" />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Avg Length</div>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        {Math.round(book.metadata.wordCount / (book.metadata.chapters || 1)).toLocaleString()}
                      </div>
                      <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">Words / Chapter</div>
                    </div>

                    <div className="group bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Read Time</div>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        ~{Math.ceil(book.metadata.wordCount / 200)}
                      </div>
                      <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">Minutes</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Chapters Preview */}
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
                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-yellow-400 dark:hover:border-yellow-500 transition-all cursor-pointer"
                        onClick={() => openReaderAtChapter(idx)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-yellow-600 dark:text-yellow-400 font-bold text-lg">Ch. {chapter.number}</span>
                            <h4 className="font-bold text-gray-900 dark:text-white">{chapter.title}</h4>
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
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      ✏️ Edit
                    </Button>
                    <Button variant="primary" onClick={startReading}>
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
                      onClick={() => openReaderAtChapter(idx)}
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
                  <div className="mb-4 flex justify-center">
                    <div className="bg-gray-200 dark:bg-gray-800 p-4 rounded-full">
                      <PenTool className="w-10 h-10 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">No chapters yet</p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mb-6 max-w-md mx-auto">
                    Generate your book in the Studio to create chapters that will appear here.
                  </p>
                  <Button variant="primary" onClick={() => router.push('/studio')}>Go to Studio</Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cover' && (
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800 p-6">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ fontFamily: 'var(--font-nav)' }}>
                <span className="text-yellow-600 dark:text-yellow-400">🎨</span>
                Book Cover
              </h3>
              <CoverGenerator
                bookId={book.id}
                title={book.title}
                author={book.author}
                genre={book.genre}
                description={book.metadata.description || ''}
                targetAudience="General"
                themes={[]}
                currentCoverUrl={book.coverUrl}
                currentBackCoverUrl={book.backCoverUrl || book.metadata.backCoverUrl}
                onCoverGenerated={(coverUrl, metadata) => {
                  // Update local state with new cover
                  setBook(prev => prev ? { ...prev, coverUrl } : null);
                  // Show success message
                  alert('✓ Front cover generated successfully!');
                }}
                onBackCoverGenerated={(backCoverUrl, metadata) => {
                  // Update local state with new back cover
                  setBook(prev => prev ? { 
                    ...prev, 
                    backCoverUrl,
                    metadata: { ...prev.metadata, backCoverUrl }
                  } : null);
                  // Show success message
                  alert('✓ Back cover generated successfully!');
                }}
              />
            </div>
          )}

          {activeTab === 'audio' && book.chapters && book.chapters.length > 0 && (
            <div className="space-y-6">
              {/* Audiobook Player Link */}
              {hasAudio && (
                <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 rounded-xl border border-amber-500/30 p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <Headphones className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Audiobook Player</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {chaptersWithAudio} of {book.chapters.length} chapters have audio
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAudiobookPlayer(true)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2"
                      >
                        <Headphones className="w-4 h-4" />
                        Quick Listen
                      </Button>
                      <Button 
                        variant="primary" 
                        onClick={() => router.push(`/library/${book.id}/listen`)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2"
                      >
                        <BookOpen className="w-4 h-4" />
                        Full Experience
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <AudioGenerator
                bookId={book.id}
                bookTitle={book.title}
                chapters={book.chapters}
                userId={getDemoUserId()}
                onAudioGenerated={(data) => {
                  if (data.type === 'full') {
                    setAudioUrl(data.audioUrl);
                  }
                  // Refresh book data to show new audio
                  fetchBookDetail();
                }}
              />
            </div>
          )}

          {activeTab === 'audio' && (!book.chapters || book.chapters.length === 0) && (
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800 p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4 flex items-center justify-center gap-2">
                <AlertCircle className="w-5 h-5" />
                No chapters available. Please generate your book first.
              </p>
            </div>
          )}

          {activeTab === 'publishing' && (
            <PublishingSettings
              bookId={book.id}
              bookTitle={book.title}
              onSave={() => {
                alert('✓ Publishing settings saved successfully!');
              }}
            />
          )}

          {activeTab === 'settings' && (
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800 p-6">
              <h3 className="text-xl font-bold mb-6" style={{ fontFamily: 'var(--font-nav)' }}>Book Settings</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4 text-gray-700 dark:text-gray-300">Danger Zone</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    These actions will affect your book. Please proceed with caution.
                  </p>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start flex items-center gap-2"
                      onClick={handleDuplicateBook}
                      disabled={isDuplicating}
                    >
                      {isDuplicating ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Duplicating...
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Duplicate Book
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start flex items-center gap-2"
                      onClick={handleArchiveBook}
                      disabled={isArchiving}
                    >
                      {isArchiving ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          {book?.status === 'archived' ? 'Unarchiving...' : 'Archiving...'}
                        </>
                      ) : (
                        <>
                          <Archive className="w-4 h-4" />
                          {book?.status === 'archived' ? 'Unarchive Book' : 'Archive Book'}
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-red-600 dark:text-red-400 border-red-300 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      onClick={handleDeleteBook}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Delete Book
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bibliography Manager Modal */}
      {showBibliography && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-auto">
            <BibliographyManager
              bookId={book.id}
              userId={getDemoUserId()}
              onClose={() => setShowBibliography(false)}
            />
          </div>
        </div>
      )}

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
            // Refresh book data in case progress was updated
            fetchBookDetail();
          }}
          isModal={true}
        />
      )}
    </div>
  );
}
