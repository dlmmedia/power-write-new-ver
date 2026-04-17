'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { SeriesEditorModal } from '@/components/library/SeriesEditorModal';
import {
  ArrowLeft,
  BookCopy,
  Plus,
  Search,
  BookMarked,
  Globe,
  Lock,
} from 'lucide-react';
import type { SeriesListItem, Series } from '@/lib/types/series';

function SeriesListContent() {
  const [series, setSeries] = useState<SeriesListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const refreshSeries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/series');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Failed to load series');
      }
      setSeries(data.series || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load series');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSeries();
  }, [refreshSeries]);

  const handleCreated = useCallback((created: Series) => {
    setSeries((prev) => [{ ...created, bookCount: 0 } as SeriesListItem, ...prev]);
  }, []);

  const filtered = series.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const statusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'info' | 'success' | 'warning' | 'accent'; label: string }> = {
      ongoing: { variant: 'info', label: 'Ongoing' },
      completed: { variant: 'success', label: 'Completed' },
      hiatus: { variant: 'warning', label: 'On Hiatus' },
    };
    const cfg = variants[status] || variants.ongoing;
    return <Badge variant={cfg.variant} style="soft" size="sm">{cfg.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div className="border-b border-[var(--border)] bg-[var(--background)] sticky top-14 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/library"
                className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="flex items-center gap-2 min-w-0">
                <BookCopy className="w-5 h-5 text-[var(--accent)]" />
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight truncate">
                  Series
                </h1>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              <span className="hidden md:inline">New Series</span>
              <span className="md:hidden">New</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {error && (
          <Card variant="outlined" padding="md" className="mb-6 border-[var(--error)] bg-[var(--error-light)]">
            <p className="text-[var(--error)] text-sm">{error}</p>
            <button
              onClick={refreshSeries}
              className="mt-2 text-sm text-[var(--error)] underline hover:no-underline"
            >
              Try again
            </button>
          </Card>
        )}

        <div className="mb-6">
          <Input
            type="search"
            placeholder="Search series..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookCopy className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
              {search ? 'No series match your search' : 'No series yet'}
            </h3>
            <p className="text-sm text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
              {search
                ? 'Try a different search term.'
                : 'Group related books that share style, world, and themes. Create your first series to get started.'}
            </p>
            {!search && (
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create Your First Series
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((s) => (
              <Link
                key={s.id}
                href={`/library/series/${s.id}`}
                className="group block animate-content-appear"
              >
                <Card variant="interactive" padding="none" className="overflow-hidden h-full">
                  <div className="relative w-full aspect-[16/9] bg-[var(--background-tertiary)] overflow-hidden">
                    {s.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.coverUrl}
                        alt={`${s.name} cover`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--background-secondary)] to-[var(--background-tertiary)]">
                        <BookCopy className="w-10 h-10 text-[var(--text-muted)]" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                      {statusBadge(s.status)}
                      {s.isPublic ? (
                        <Badge variant="accent" style="soft" size="sm" className="gap-1">
                          <Globe className="w-3 h-3" />
                          Public
                        </Badge>
                      ) : null}
                      {Array.isArray(s.lockedFields) && s.lockedFields.length > 0 ? (
                        <Badge variant="default" style="soft" size="sm" className="gap-1">
                          <Lock className="w-3 h-3" />
                          {s.lockedFields.length} locked
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-[var(--text-primary)] text-sm line-clamp-2 mb-1">
                      {s.name}
                    </h3>
                    {s.description ? (
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-3">
                        {s.description}
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--text-muted)] italic mb-3">
                        No description
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                      <span className="flex items-center gap-1">
                        <BookMarked className="w-3.5 h-3.5 text-[var(--accent)]" />
                        {s.bookCount} {s.bookCount === 1 ? 'book' : 'books'}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                      Updated{' '}
                      {new Date(s.updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <SeriesEditorModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSaved={handleCreated}
      />
    </div>
  );
}

export default function SeriesListPage() {
  return (
    <AuthGuard feature="library">
      <SeriesListContent />
    </AuthGuard>
  );
}
