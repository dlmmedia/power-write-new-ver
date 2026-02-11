'use client';

import { useState, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserTier } from '@/contexts/UserTierContext';
import { useBooks } from '@/contexts/BooksContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { cn } from '@/lib/utils';
import { 
  Library, 
  CheckCircle2, 
  Type, 
  Layers,
  Plus,
  Play,
  Loader2,
  BookOpen,
  FileText,
  Palette,
  Crown,
  Sparkles,
  Lock,
  Headphones,
  Globe,
  Upload,
  Search,
  BookMarked
} from 'lucide-react';
import { StatCard, AudioStatCard } from '@/components/ui/AnimatedNumber';
import { BookUploadModal } from '@/components/library/BookUploadModal';
import { ProductionStatus } from '@/lib/types/generation';

// ===== SUB-COMPONENTS =====

/** Regeneration progress overlay */
function RegenerationProgressModal({ 
  bookTitle, 
  progress, 
  onCancel 
}: { 
  bookTitle: string; 
  progress: { progress: number; message: string; chaptersCompleted?: number; totalChapters?: number }; 
  onCancel?: () => void;
}) {
  const isError = progress.message.toLowerCase().startsWith('error');
  
  return (
    <div className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-sm flex items-center justify-center z-50">
      <Card variant="elevated" padding="lg" className="max-w-md w-full mx-4 animate-scaleIn">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="relative w-16 h-16 mx-auto mb-4">
            {!isError && progress.progress < 100 && (
              <div className="absolute inset-0 rounded-full border-4 border-[var(--accent-light)] animate-ping opacity-30" />
            )}
            <div className="absolute inset-0 flex items-center justify-center text-3xl">
              {isError ? '\u26A0' : progress.progress >= 100 ? '\u2713' : '\u270D'}
            </div>
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {isError ? 'Generation Error' : progress.progress >= 100 ? 'Complete!' : 'Continuing Generation'}
          </h3>
          <p className="text-sm text-[var(--text-muted)] mt-1 truncate">
            {bookTitle}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-[var(--text-secondary)] mb-2">
            <span>Progress</span>
            <span className="tabular-nums font-medium">{Math.round(progress.progress)}%</span>
          </div>
          <div className="h-2.5 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-500 ease-out rounded-full',
                isError ? 'bg-[var(--error)]' : progress.progress >= 100 ? 'bg-[var(--success)]' : 'bg-[var(--accent)]'
              )}
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>

        {/* Chapter progress */}
        {progress.chaptersCompleted !== undefined && progress.totalChapters && progress.totalChapters > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-center gap-4 mb-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--accent)]">{progress.chaptersCompleted}</div>
                <div className="text-xs text-[var(--text-muted)]">written</div>
              </div>
              <div className="text-xl text-[var(--text-muted)]">/</div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--text-muted)]">{progress.totalChapters}</div>
                <div className="text-xs text-[var(--text-muted)]">total</div>
              </div>
            </div>
            <div className="flex justify-center gap-1 flex-wrap">
              {Array.from({ length: progress.totalChapters }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-300',
                    i < (progress.chaptersCompleted || 0)
                      ? 'bg-[var(--success)]'
                      : i === (progress.chaptersCompleted || 0)
                        ? 'bg-[var(--accent)] animate-pulse'
                        : 'bg-[var(--background-tertiary)]'
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* Status Message */}
        <p className={cn(
          'text-center text-sm mb-4',
          isError ? 'text-[var(--error)]' : 'text-[var(--text-secondary)]'
        )}>
          {progress.message}
        </p>

        {/* Actions */}
        <div className="text-center">
          {progress.progress < 100 && !isError && (
            <p className="text-xs text-[var(--text-muted)]">
              Progress is saved automatically. You can close this and the generation will continue.
            </p>
          )}
          {isError && onCancel && (
            <button
              onClick={onCancel}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}

/** Individual book card in the grid */
const BookCardItem = memo(function BookCardItem({
  book,
  isProUser,
  generatingCovers,
  continuingBooks,
  generationProgress,
  onHover,
  onGenerateCover,
  onContinueGeneration,
  onUpgradeModal,
  formatDuration,
}: {
  book: any;
  isProUser: boolean;
  generatingCovers: Set<number>;
  continuingBooks: Set<number>;
  generationProgress: Record<number, any>;
  onHover: (id: number) => void;
  onGenerateCover: (id: number, e?: React.MouseEvent) => void;
  onContinueGeneration: (book: any, e?: React.MouseEvent) => void;
  onUpgradeModal: (feature?: string) => void;
  formatDuration: (seconds: number) => string;
}) {
  const status = book.productionStatus || 'draft';
  
  const statusConfig: Record<string, { variant: 'default' | 'info' | 'success' | 'warning' | 'accent'; text: string; badgeStyle?: 'solid' | 'soft' }> = {
    'draft': { variant: 'default', text: 'Draft', badgeStyle: 'soft' },
    'in-progress': { variant: 'info', text: 'In Progress', badgeStyle: 'soft' },
    'content-complete': { variant: 'success', text: 'Content Complete', badgeStyle: 'soft' },
    'audio-pending': { variant: 'warning', text: 'Audio Pending', badgeStyle: 'soft' },
    'published': { variant: 'accent', text: 'Published', badgeStyle: 'solid' },
  };

  const { variant: badgeVariant, text: badgeText, badgeStyle } = statusConfig[status] || statusConfig['draft'];

  return (
    <Link
      href={`/library/${book.id}`}
      prefetch={true}
      onMouseEnter={() => onHover(book.id)}
      className="group block animate-content-appear"
      style={{ animationDelay: '0ms' }}
    >
      <Card variant="interactive" padding="none" className="overflow-hidden h-full">
        {/* Cover Image */}
        <div className="relative w-full aspect-[2/3] bg-[var(--background-tertiary)] overflow-hidden">
          {book.coverUrl && book.coverUrl.trim() !== '' ? (
            <img
              src={book.coverUrl}
              alt={`${book.title} cover`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[var(--background-secondary)] to-[var(--background-tertiary)] relative p-4">
              <div className="text-center">
                <BookMarked className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
                <h3 className="font-semibold text-base text-[var(--text-primary)] mb-1 line-clamp-3">{book.title}</h3>
                <p className="text-sm text-[var(--text-muted)] mb-4">by {book.author}</p>
                
                {book.status === 'generating' ? (
                  (() => {
                    const totalOutlineChapters = book.outline?.chapters?.length || 0;
                    const generatedChapters = book.metadata?.chapters || 0;
                    const allChaptersDone = totalOutlineChapters > 0 && generatedChapters >= totalOutlineChapters;
                    const activeProgress = generationProgress[book.id];
                    const displayCompleted = activeProgress?.chaptersCompleted ?? generatedChapters;
                    const displayTotal = activeProgress?.totalChapters ?? totalOutlineChapters;
                    const staticProgress = totalOutlineChapters > 0 ? Math.round((generatedChapters / totalOutlineChapters) * 100) : 0;

                    return (
                      <div className="space-y-2">
                        {/* Progress bar - show active or static */}
                        {activeProgress ? (
                          <div className="mb-2">
                            <div className="h-1.5 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[var(--accent)] transition-all duration-300 rounded-full"
                                style={{ width: `${activeProgress.progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-[var(--text-muted)] mt-1">
                              {activeProgress.message}
                            </p>
                          </div>
                        ) : totalOutlineChapters > 0 ? (
                          <div className="mb-2">
                            <div className="h-1.5 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[var(--accent)] transition-all duration-300 rounded-full"
                                style={{ width: `${staticProgress}%` }}
                              />
                            </div>
                            <p className="text-xs text-[var(--text-muted)] mt-1">
                              {allChaptersDone
                                ? `All ${generatedChapters} chapters generated — needs finalization`
                                : `${generatedChapters} of ${totalOutlineChapters} chapters generated`}
                            </p>
                          </div>
                        ) : null}

                        {/* Action button */}
                        {isProUser ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={(e) => { e.preventDefault(); onContinueGeneration(book, e); }}
                            disabled={continuingBooks.has(book.id)}
                            isLoading={continuingBooks.has(book.id)}
                            leftIcon={!continuingBooks.has(book.id) ? (allChaptersDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />) : undefined}
                          >
                            {continuingBooks.has(book.id) 
                              ? 'Generating...' 
                              : allChaptersDone 
                                ? 'Finalize Book' 
                                : `Continue (${displayCompleted}/${displayTotal})`}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpgradeModal('continue-generation'); }}
                            leftIcon={<Lock className="w-3.5 h-3.5" />}
                          >
                            {allChaptersDone ? 'Finalize' : 'Continue'} <Badge variant="accent" size="sm" className="ml-1">PRO</Badge>
                          </Button>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  isProUser ? (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={(e) => { e.preventDefault(); onGenerateCover(book.id, e); }}
                      disabled={generatingCovers.has(book.id)}
                      isLoading={generatingCovers.has(book.id)}
                      leftIcon={!generatingCovers.has(book.id) ? <Palette className="w-3.5 h-3.5" /> : undefined}
                    >
                      {generatingCovers.has(book.id) ? 'Generating...' : 'Generate Cover'}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpgradeModal('generate-cover'); }}
                      leftIcon={<Lock className="w-3.5 h-3.5" />}
                    >
                      Cover <Badge variant="accent" size="sm" className="ml-1">PRO</Badge>
                    </Button>
                  )
                )}
              </div>
            </div>
          )}
          
          {/* Status badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            <Badge variant={badgeVariant} style={badgeStyle} size="sm">{badgeText}</Badge>
            {book.isPublic && (
              <Badge variant="accent" style="soft" size="sm" className="gap-1">
                <Globe className="w-3 h-3" />
                Public
              </Badge>
            )}
          </div>
        </div>

        {/* Book Info */}
        <div className="p-4">
          <h3 className="font-semibold text-[var(--text-primary)] text-sm line-clamp-2 mb-1">{book.title}</h3>
          <p className="text-xs text-[var(--text-muted)] mb-3">by {book.author} &middot; {book.genre}</p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-[var(--accent)]" />
              {book.metadata?.chapters || 0} ch
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[var(--accent)]" />
              {(book.metadata?.wordCount || 0).toLocaleString()} words
            </span>
            {book.audioStats && book.audioStats.chaptersWithAudio > 0 && (
              <span className="flex items-center gap-1 text-[var(--success)]">
                <Headphones className="w-3.5 h-3.5" />
                {book.audioStats.chaptersWithAudio}/{book.audioStats.totalChapters}
              </span>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
            {new Date(book.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </Card>
    </Link>
  );
});

// ===== MAIN PAGE =====

function LibraryPageContent() {
  const router = useRouter();
  const { 
    books, 
    isLoading: loading, 
    error,
    refreshBooks,
    updateBookInCache,
    fetchBookDetail,
  } = useBooks();
  
  const handleBookHover = useCallback((bookId: number) => {
    fetchBookDetail(bookId, false);
  }, [fetchBookDetail]);
  
  const { isProUser, isLoading: isTierLoading, showUpgradeModal: triggerUpgradeModal } = useUserTier();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGenre, setFilterGenre] = useState('all');
  const [filterStatus, setFilterStatus] = useState<ProductionStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'words'>('date');
  const [generatingCovers, setGeneratingCovers] = useState<Set<number>>(new Set());
  const [continuingBooks, setContinuingBooks] = useState<Set<number>>(new Set());
  const [generationProgress, setGenerationProgress] = useState<Record<number, { progress: number; message: string; chaptersCompleted?: number; totalChapters?: number; phase?: string }>>({});
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleUploadComplete = useCallback((bookId: number) => {
    refreshBooks();
    router.push(`/library/${bookId}`);
  }, [refreshBooks, router]);

  const handleGenerateCover = async (bookId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isProUser) { triggerUpgradeModal('generate-cover'); return; }
    
    setGeneratingCovers(prev => new Set(prev).add(bookId));
    try {
      const response = await fetch(`/api/books/${bookId}/cover`, { method: 'POST' });
      const data = await response.json();
      if (data.success && data.coverUrl) {
        updateBookInCache(bookId, { coverUrl: data.coverUrl });
      }
    } catch (err) {
      console.error('Error generating cover:', err);
    } finally {
      setGeneratingCovers(prev => { const s = new Set(prev); s.delete(bookId); return s; });
    }
  };

  const handleContinueGeneration = useCallback(async (book: typeof books[0], e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isProUser) { triggerUpgradeModal('continue-generation'); return; }
    if (!book.outline || !book.config) { alert('Unable to continue: Book outline or config is missing'); return; }

    setContinuingBooks(prev => new Set(prev).add(book.id));
    const totalOutline = book.outline?.chapters?.length || 0;
    const alreadyDone = book.metadata?.chapters || 0;
    const resumeMsg = totalOutline > 0 && alreadyDone >= totalOutline
      ? `Finalizing book (${alreadyDone} chapters complete)...`
      : totalOutline > 0
        ? `Resuming from chapter ${alreadyDone + 1} of ${totalOutline}...`
        : 'Resuming generation...';
    setGenerationProgress(prev => ({ ...prev, [book.id]: { progress: 0, message: resumeMsg, chaptersCompleted: alreadyDone, totalChapters: totalOutline } }));

    const chapterModel = book.metadata?.modelUsed || 'anthropic/claude-sonnet-4';
    let consecutiveErrors = 0;

    try {
      while (true) {
        const response = await fetch('/api/generate/book-incremental', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ outline: book.outline, config: book.config, modelId: chapterModel, bookId: book.id }),
        });

        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) throw new Error('Server error');
        const data = await response.json();

        if (!data.success) {
          consecutiveErrors++;
          if (consecutiveErrors >= 3) throw new Error(data.details || data.error || 'Generation failed');
          setGenerationProgress(prev => ({ ...prev, [book.id]: { progress: prev[book.id]?.progress || 0, message: `Retrying... (${consecutiveErrors}/3)` } }));
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }

        consecutiveErrors = 0;
        // Build phase-aware progress message
        const phaseLabel = data.phase === 'creating' ? 'Creating book...'
          : data.phase === 'cover' ? 'Generating cover art...'
          : data.phase === 'completed' ? 'Book generation complete!'
          : data.chaptersCompleted != null && data.totalChapters != null
            ? `Generating chapters (${data.chaptersCompleted}/${data.totalChapters})...`
            : data.message;

        setGenerationProgress(prev => ({
          ...prev,
          [book.id]: { 
            progress: data.progress, 
            message: phaseLabel,
            chaptersCompleted: data.chaptersCompleted ?? prev[book.id]?.chaptersCompleted,
            totalChapters: data.totalChapters ?? prev[book.id]?.totalChapters,
            phase: data.phase,
          }
        }));

        if (data.phase === 'completed') {
          setGenerationProgress(prev => ({ ...prev, [book.id]: { progress: 100, message: 'Book generation complete!', chaptersCompleted: data.totalChapters, totalChapters: data.totalChapters, phase: 'completed' } }));
          await new Promise(r => setTimeout(r, 2000));
          await refreshBooks();
          setGenerationProgress(prev => { const s = { ...prev }; delete s[book.id]; return s; });
          break;
        }
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setGenerationProgress(prev => ({ ...prev, [book.id]: { progress: prev[book.id]?.progress || 0, message: `Error: ${msg}` } }));
    } finally {
      setContinuingBooks(prev => { const s = new Set(prev); s.delete(book.id); return s; });
    }
  }, [isProUser, triggerUpgradeModal, refreshBooks]);

  const filteredAndSortedBooks = books
    .filter((book) => {
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           book.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = filterGenre === 'all' || book.genre === filterGenre;
      const matchesStatus = filterStatus === 'all' || (book.productionStatus || 'draft') === filterStatus;
      return matchesSearch && matchesGenre && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'words') return (b.metadata?.wordCount || 0) - (a.metadata?.wordCount || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const genres = ['all', ...Array.from(new Set(books.map((b) => b.genre)))];

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  const activeRegenBookId = Array.from(continuingBooks)[0];
  const activeRegenBook = activeRegenBookId ? books.find(b => b.id === activeRegenBookId) : null;
  const activeRegenProgress = activeRegenBookId ? generationProgress[activeRegenBookId] : null;

  const selectClass = 'bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all hover:border-[var(--border-strong)]';

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      {/* Regeneration Modal */}
      {activeRegenBook && activeRegenProgress && (
        <RegenerationProgressModal
          bookTitle={activeRegenBook.title}
          progress={activeRegenProgress}
          onCancel={activeRegenProgress.message.toLowerCase().startsWith('error') ? () => {
            setGenerationProgress(prev => { const s = { ...prev }; delete s[activeRegenBook.id]; return s; });
            setContinuingBooks(prev => { const ns = new Set(prev); ns.delete(activeRegenBook.id); return ns; });
          } : undefined}
        />
      )}

      {/* Page Header */}
      <div className="border-b border-[var(--border)] bg-[var(--background)] sticky top-14 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Library</h1>
              {isProUser ? (
                <Badge variant="accent" style="soft" size="sm" className="gap-1">
                  <Crown className="w-3 h-3" />
                  Pro
                </Badge>
              ) : !isTierLoading ? (
                <button
                  onClick={() => triggerUpgradeModal()}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
                >
                  <Sparkles className="w-3 h-3" />
                  Upgrade
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <Link href="/showcase" className="hidden md:flex">
                <Button variant="ghost" size="sm" leftIcon={<Globe className="w-4 h-4" />}>Showcase</Button>
              </Link>
              <Link href="/showcase" className="md:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors">
                <Globe className="w-5 h-5" />
              </Link>
              
              <Button variant="ghost" size="sm" onClick={() => setShowUploadModal(true)} leftIcon={<Upload className="w-4 h-4" />} className="hidden md:flex">
                Upload
              </Button>
              <button onClick={() => setShowUploadModal(true)} className="md:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors">
                <Upload className="w-5 h-5" />
              </button>

              {(isTierLoading || isProUser) ? (
                <Link href="/studio">
                  <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} disabled={isTierLoading}>
                    <span className="hidden md:inline">New Book</span>
                    <span className="md:hidden">New</span>
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => triggerUpgradeModal('generate-book')}
                  leftIcon={<Lock className="w-4 h-4" />}
                >
                  <span className="hidden md:inline">New Book</span>
                  <span className="md:hidden">New</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Error Banner */}
        {error && (
          <Card variant="outlined" padding="md" className="mb-6 border-[var(--error)] bg-[var(--error-light)]">
            <p className="text-[var(--error)] text-sm">{error}</p>
            <button onClick={() => refreshBooks()} className="mt-2 text-sm text-[var(--error)] underline hover:no-underline">
              Try again
            </button>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-6">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Search books by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex gap-2">
            <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)} className={selectClass}>
              {genres.map((genre) => (
                <option key={genre} value={genre}>{genre === 'all' ? 'All Genres' : genre}</option>
              ))}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as ProductionStatus | 'all')} className={cn(selectClass, 'hidden md:block')}>
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="in-progress">In Progress</option>
              <option value="content-complete">Content Complete</option>
              <option value="audio-pending">Audio Pending</option>
              <option value="published">Published</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'words')} className={selectClass}>
              <option value="date">Newest</option>
              <option value="title">Title</option>
              <option value="words">Words</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 mb-8">
          <StatCard icon={<Library className="w-4 h-4" />} label="Books" value={books.length} accentColor="yellow" delay={0} />
          <StatCard icon={<CheckCircle2 className="w-4 h-4" />} label="Completed" value={books.filter((b) => b.status === 'completed').length} accentColor="green" delay={0.05} />
          <StatCard icon={<Type className="w-4 h-4" />} label="Words" value={books.reduce((sum, b) => sum + (b.metadata?.wordCount || 0), 0)} format="locale" accentColor="blue" delay={0.1} />
          <StatCard icon={<Layers className="w-4 h-4" />} label="Chapters" value={books.reduce((sum, b) => sum + (b.metadata?.chapters || 0), 0)} accentColor="purple" delay={0.15} />
          {(() => {
            const totalWithAudio = books.reduce((sum, b) => sum + (b.audioStats?.chaptersWithAudio || 0), 0);
            const totalDuration = books.reduce((sum, b) => sum + (b.audioStats?.totalDuration || 0), 0);
            if (totalWithAudio === 0) return null;
            return (
              <AudioStatCard icon={<Headphones className="w-4 h-4" />} label="Audio" value={totalWithAudio} subtitle={`${formatDuration(totalDuration)} total`} accentColor="green" delay={0.2} />
            );
          })()}
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredAndSortedBooks.length === 0 ? (
          <div className="text-center py-16">
            <BookMarked className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
              {searchQuery || filterGenre !== 'all' ? 'No books match your filters' : 'Your library is empty'}
            </h3>
            <p className="text-sm text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
              {searchQuery || filterGenre !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Create your first book to get started with AI-powered writing'
              }
            </p>
            {isProUser ? (
              <Link href="/studio">
                <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>Create Your First Book</Button>
              </Link>
            ) : (
              <Button
                variant="primary"
                onClick={() => triggerUpgradeModal('generate-book')}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Create Your First Book
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAndSortedBooks.map((book) => (
              <BookCardItem
                key={book.id}
                book={book}
                isProUser={isProUser}
                generatingCovers={generatingCovers}
                continuingBooks={continuingBooks}
                generationProgress={generationProgress}
                onHover={handleBookHover}
                onGenerateCover={handleGenerateCover}
                onContinueGeneration={handleContinueGeneration}
                onUpgradeModal={triggerUpgradeModal}
                formatDuration={formatDuration}
              />
            ))}
          </div>
        )}
      </div>

      <BookUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onImportComplete={handleUploadComplete}
      />
    </div>
  );
}

export default function LibraryPage() {
  return (
    <AuthGuard feature="library">
      <LibraryPageContent />
    </AuthGuard>
  );
}
