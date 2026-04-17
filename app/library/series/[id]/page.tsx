'use client';

import { useState, useEffect, useCallback, use as usePromise } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { SeriesEditorModal } from '@/components/library/SeriesEditorModal';
import {
  ArrowLeft,
  BookCopy,
  BookMarked,
  BookOpen,
  Edit3,
  FileText,
  Globe,
  Lock,
  Plus,
  Trash2,
} from 'lucide-react';
import { LOCKABLE_SERIES_FIELD_LABELS, type LockableSeriesField, type Series } from '@/lib/types/series';

interface SeriesDetailBook {
  id: number;
  title: string;
  author?: string;
  seriesNumber: number | null;
  summary?: string | null;
  coverUrl?: string | null;
  status?: string | null;
  productionStatus?: string | null;
  createdAt?: string;
}

type SeriesDetail = Series & { books: SeriesDetailBook[] };

interface LibraryBook {
  id: number;
  title: string;
  author?: string;
  coverUrl?: string;
  seriesId?: number | null;
}

function SeriesDetailContent({ seriesId }: { seriesId: number }) {
  const router = useRouter();
  const [data, setData] = useState<SeriesDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddBook, setShowAddBook] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/series/${seriesId}`);
      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body?.error || 'Failed to load series');
      }
      setData(body.series);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load series');
    } finally {
      setLoading(false);
    }
  }, [seriesId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/series/${seriesId}`, { method: 'DELETE' });
      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body?.error || 'Failed to delete series');
      }
      router.push('/library/series');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete series');
      setDeleting(false);
      setShowDelete(false);
    }
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'info' | 'success' | 'warning' | 'accent'; label: string }> = {
      ongoing: { variant: 'info', label: 'Ongoing' },
      completed: { variant: 'success', label: 'Completed' },
      hiatus: { variant: 'warning', label: 'On Hiatus' },
    };
    const cfg = variants[status] || variants.ongoing;
    return <Badge variant={cfg.variant} style="soft" size="sm">{cfg.label}</Badge>;
  };

  if (loading && !data) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card variant="outlined" padding="md" className="border-[var(--error)] bg-[var(--error-light)]">
          <p className="text-[var(--error)] text-sm">{error}</p>
          <button onClick={refresh} className="mt-2 text-sm text-[var(--error)] underline">
            Try again
          </button>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const lockedFields: LockableSeriesField[] = Array.isArray(data.lockedFields) ? data.lockedFields : [];
  const sharedConfig = data.sharedConfig || null;
  const nextNum = (data.books.reduce((m, b) => Math.max(m, b.seriesNumber || 0), 0) || 0) + 1;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div className="border-b border-[var(--border)] bg-[var(--background)] sticky top-14 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/library/series"
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <BookCopy className="w-5 h-5 text-[var(--accent)]" />
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight truncate">
              {data.name}
            </h1>
            {statusBadge(data.status)}
            {data.isPublic && (
              <Badge variant="accent" style="soft" size="sm" className="gap-1">
                <Globe className="w-3 h-3" />
                Public
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Overview header card */}
          <Card variant="elevated" padding="lg">
            <div className="flex flex-col md:flex-row gap-5">
              <div className="md:w-48 flex-shrink-0">
                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-[var(--background-tertiary)]">
                  {data.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.coverUrl} alt={data.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookCopy className="w-12 h-12 text-[var(--text-muted)]" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-semibold mb-2">{data.name}</h2>
                {data.description ? (
                  <p className="text-sm text-[var(--text-secondary)] mb-4 whitespace-pre-wrap">
                    {data.description}
                  </p>
                ) : (
                  <p className="text-sm text-[var(--text-muted)] italic mb-4">No description.</p>
                )}

                <div className="flex flex-wrap gap-2 mb-4 text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1">
                    <BookMarked className="w-3.5 h-3.5 text-[var(--accent)]" />
                    {data.books.length} {data.books.length === 1 ? 'book' : 'books'}
                  </span>
                  {lockedFields.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      {lockedFields.length} locked field{lockedFields.length === 1 ? '' : 's'}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link href={`/studio?seriesId=${data.id}`}>
                    <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                      Write Next Book
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddBook(true)}
                    leftIcon={<BookOpen className="w-4 h-4" />}
                  >
                    Add Existing Book
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEdit(true)}
                    leftIcon={<Edit3 className="w-4 h-4" />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDelete(true)}
                    leftIcon={<Trash2 className="w-4 h-4 text-[var(--error)]" />}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Books in series */}
          <Card variant="default" padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-[var(--accent)]" />
                Books in this series
              </h3>
              <span className="text-xs text-[var(--text-muted)]">
                Next: Book #{nextNum}
              </span>
            </div>
            {data.books.length === 0 ? (
              <div className="text-center py-10 text-sm text-[var(--text-muted)]">
                No books yet. Start writing the first book in the series.
                <div className="mt-4">
                  <Link href={`/studio?seriesId=${data.id}`}>
                    <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                      Write Book #1
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--border-subtle)]">
                {data.books.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/library/${b.id}`}
                      className="flex items-center gap-4 py-3 px-2 -mx-2 rounded-md hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <div className="w-12 h-16 flex-shrink-0 rounded bg-[var(--background-tertiary)] overflow-hidden flex items-center justify-center text-xs font-semibold text-[var(--text-muted)]">
                        {b.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={b.coverUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>#{b.seriesNumber ?? '?'}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {b.seriesNumber != null && (
                            <Badge variant="info" style="soft" size="sm">
                              #{b.seriesNumber}
                            </Badge>
                          )}
                          <span className="font-medium text-sm truncate">{b.title}</span>
                        </div>
                        {b.summary && (
                          <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                            {b.summary}
                          </p>
                        )}
                      </div>
                      <FileText className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Sidebar: shared config + locked fields */}
        <aside className="space-y-6">
          <Card variant="default" padding="lg">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <BookCopy className="w-4 h-4 text-[var(--accent)]" />
              Shared Defaults
            </h3>
            {sharedConfig ? (
              <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                {sharedConfig.author && (
                  <div><span className="text-[var(--text-muted)]">Author:</span> {sharedConfig.author}</div>
                )}
                {(sharedConfig.genre || sharedConfig.subGenre) && (
                  <div>
                    <span className="text-[var(--text-muted)]">Genre:</span>{' '}
                    {sharedConfig.genre}
                    {sharedConfig.subGenre ? ` / ${sharedConfig.subGenre}` : ''}
                  </div>
                )}
                {sharedConfig.writingStyle?.style && (
                  <div>
                    <span className="text-[var(--text-muted)]">Style:</span>{' '}
                    {[
                      sharedConfig.writingStyle.style,
                      sharedConfig.writingStyle.tone,
                      sharedConfig.writingStyle.pov,
                      sharedConfig.writingStyle.tense,
                    ].filter(Boolean).join(', ')}
                  </div>
                )}
                {sharedConfig.setting?.timePeriod && (
                  <div>
                    <span className="text-[var(--text-muted)]">Setting:</span>{' '}
                    {sharedConfig.setting.timePeriod}
                    {sharedConfig.setting.location ? `, ${sharedConfig.setting.location}` : ''}
                  </div>
                )}
                {sharedConfig.themes?.primary && sharedConfig.themes.primary.length > 0 && (
                  <div>
                    <span className="text-[var(--text-muted)]">Themes:</span>{' '}
                    {sharedConfig.themes.primary.join(', ')}
                  </div>
                )}
                {sharedConfig.visuals?.coverStyle && (
                  <div>
                    <span className="text-[var(--text-muted)]">Cover:</span>{' '}
                    {sharedConfig.visuals.coverStyle}
                    {sharedConfig.visuals.coverColorScheme ? `, ${sharedConfig.visuals.coverColorScheme}` : ''}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic">
                No shared defaults yet. They'll be populated when you write the first book.
              </p>
            )}
          </Card>

          <Card variant="default" padding="lg">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[var(--accent)]" />
              Locked Fields
            </h3>
            {lockedFields.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] italic">
                No fields are locked. Books can override every shared default.
              </p>
            ) : (
              <ul className="space-y-1.5 text-sm text-[var(--text-secondary)]">
                {lockedFields.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Lock className="w-3 h-3 text-[var(--text-muted)]" />
                    {LOCKABLE_SERIES_FIELD_LABELS[f] || f}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>

      <SeriesEditorModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        series={data}
        onSaved={() => {
          setShowEdit(false);
          refresh();
        }}
      />

      <AddExistingBookModal
        isOpen={showAddBook}
        onClose={() => setShowAddBook(false)}
        seriesId={seriesId}
        onAdded={() => {
          setShowAddBook(false);
          refresh();
        }}
      />

      <Modal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete this series?"
        description="The series will be removed. The books inside the series will not be deleted, but they will be unlinked from this series."
        size="sm"
      >
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={() => setShowDelete(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Series'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function AddExistingBookModal({
  isOpen,
  onClose,
  seriesId,
  onAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  seriesId: number;
  onAdded: () => void;
}) {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/books')
      .then((r) => r.json())
      .then((data) => {
        const rows: LibraryBook[] = (data?.books || []).map((b: any) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          coverUrl: b.coverUrl,
          seriesId: b.seriesId,
        }));
        setBooks(rows.filter((b) => b.seriesId !== seriesId));
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load books'))
      .finally(() => setLoading(false));
  }, [isOpen, seriesId]);

  const handleAdd = async (bookId: number) => {
    setAdding(bookId);
    try {
      const res = await fetch(`/api/series/${seriesId}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body?.error || 'Failed to add book');
      }
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add book');
    } finally {
      setAdding(null);
    }
  };

  const filtered = books.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    (b.author || '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add an existing book to this series" size="lg">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {error && (
          <div className="rounded-md bg-[var(--error-light)] border border-[var(--error)] px-3 py-2 text-sm text-[var(--error)]">
            {error}
          </div>
        )}
        <input
          type="search"
          placeholder="Search books..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-6">
            {books.length === 0
              ? 'You have no books available to add (they may already be in another series).'
              : 'No books match your search.'}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border-subtle)]">
            {filtered.map((b) => (
              <li key={b.id} className="flex items-center gap-3 py-2">
                <div className="w-10 h-14 flex-shrink-0 rounded bg-[var(--background-tertiary)] overflow-hidden flex items-center justify-center">
                  {b.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-4 h-4 text-[var(--text-muted)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{b.title}</div>
                  {b.author && (
                    <div className="text-xs text-[var(--text-muted)] truncate">by {b.author}</div>
                  )}
                  {b.seriesId && (
                    <div className="text-xs text-[var(--warning)]">
                      Currently in another series. Adding will move it here.
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleAdd(b.id)}
                  disabled={adding === b.id}
                >
                  {adding === b.id ? 'Adding...' : 'Add'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end pt-3 mt-3 border-t border-[var(--border)]">
        <Button variant="ghost" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
}

export default function SeriesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const seriesId = parseInt(id, 10);

  if (!Number.isFinite(seriesId) || seriesId <= 0) {
    return (
      <div className="container mx-auto px-4 py-10">
        <p className="text-sm text-[var(--text-muted)]">Invalid series id.</p>
      </div>
    );
  }

  return (
    <AuthGuard feature="library">
      <SeriesDetailContent seriesId={seriesId} />
    </AuthGuard>
  );
}
