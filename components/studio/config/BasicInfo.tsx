'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStudioStore } from '@/lib/store/studio-store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GENRE_OPTIONS } from '@/lib/types/studio';
import type { Series, SeriesListItem } from '@/lib/types/series';
import { SeriesEditorModal } from '@/components/library/SeriesEditorModal';
import { Lock, Plus, BookCopy, Loader2 } from 'lucide-react';

export const BasicInfo: React.FC = () => {
  const {
    config,
    updateConfig,
    seriesId,
    seriesName,
    seriesNumber,
    seriesLockedFields,
    setSeries,
    clearSeries,
  } = useStudioStore();

  const [seriesList, setSeriesList] = useState<SeriesListItem[]>([]);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const lockedSet = useMemo(() => new Set(seriesLockedFields ?? []), [seriesLockedFields]);
  const isLocked = (field: string) => lockedSet.has(field as any);

  const loadSeries = async () => {
    setLoadingSeries(true);
    try {
      const res = await fetch('/api/series');
      const data = await res.json();
      if (data.success) setSeriesList(data.series || []);
    } catch (err) {
      console.error('Failed to load series:', err);
    } finally {
      setLoadingSeries(false);
    }
  };

  useEffect(() => {
    loadSeries();
  }, []);

  const handleSelectSeries = async (id: string) => {
    if (id === '') {
      clearSeries();
      return;
    }
    if (id === '__create__') {
      setShowCreateModal(true);
      return;
    }
    const sid = parseInt(id, 10);
    if (!Number.isFinite(sid)) return;

    try {
      const [seriesRes, booksRes] = await Promise.all([
        fetch(`/api/series/${sid}`),
        fetch(`/api/series/${sid}/books`),
      ]);
      const seriesData = await seriesRes.json();
      const booksData = await booksRes.json();
      if (!seriesData.success) throw new Error(seriesData.error || 'Failed to load series');

      const nextNumber = booksData.success && Array.isArray(booksData.books)
        ? (booksData.books.reduce((max: number, b: any) => Math.max(max, b.seriesNumber || 0), 0) + 1)
        : 1;

      setSeries({
        seriesId: seriesData.series.id,
        seriesNumber: nextNumber,
        seriesName: seriesData.series.name,
        sharedConfig: seriesData.series.sharedConfig || null,
        lockedFields: seriesData.series.lockedFields || [],
      });
    } catch (err) {
      console.error('Failed to select series:', err);
    }
  };

  const handleSeriesCreated = async (created: Series) => {
    await loadSeries();
    setSeries({
      seriesId: created.id,
      seriesNumber: 1,
      seriesName: created.name,
      sharedConfig: created.sharedConfig || null,
      lockedFields: created.lockedFields || [],
    });
  };

  const lockedBadge = (
    <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-[var(--accent)]">
      <Lock className="w-3 h-3" />
      Series-locked
    </span>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Basic Information</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Essential details about your book</p>
      </div>

      <div className="space-y-5">
        <Input
          label="Book Title *"
          placeholder="Enter your book title"
          value={config.basicInfo.title}
          onChange={(e) =>
            updateConfig({
              basicInfo: { ...config.basicInfo, title: e.target.value },
            })
          }
          helperText="This will be the main title of your book"
        />

        <div>
          <div className="flex items-center">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Author Name *
            </label>
            {isLocked('author') && lockedBadge}
          </div>
          <Input
            placeholder="Your name"
            value={config.basicInfo.author}
            disabled={isLocked('author')}
            onChange={(e) =>
              updateConfig({
                basicInfo: { ...config.basicInfo, author: e.target.value },
              })
            }
          />
        </div>

        <div>
          <div className="flex items-center mb-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Genre *
            </label>
            {isLocked('genre') && lockedBadge}
          </div>
          <select
            value={config.basicInfo.genre}
            disabled={isLocked('genre')}
            onChange={(e) =>
              updateConfig({
                basicInfo: { ...config.basicInfo, genre: e.target.value },
              })
            }
            className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/60 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/40 transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {GENRE_OPTIONS.map((genre) => (
              <option key={genre} value={genre.toLowerCase()}>
                {genre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Sub-Genre (Optional)
            </label>
            {isLocked('subGenre') && lockedBadge}
          </div>
          <Input
            placeholder="e.g., Urban Fantasy, Historical Romance"
            value={config.basicInfo.subGenre || ''}
            disabled={isLocked('subGenre')}
            onChange={(e) =>
              updateConfig({
                basicInfo: { ...config.basicInfo, subGenre: e.target.value },
              })
            }
          />
        </div>

        {/* Series picker */}
        <div className="pt-5 mt-1 border-t border-gray-200/60 dark:border-gray-800/40">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <BookCopy className="w-3.5 h-3.5" />
              Series
            </p>
            {loadingSeries && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Add to Series
              </label>
              <select
                value={seriesId ? String(seriesId) : ''}
                onChange={(e) => handleSelectSeries(e.target.value)}
                className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/60 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/30"
              >
                <option value="">Standalone book (no series)</option>
                {seriesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.bookCount} {s.bookCount === 1 ? 'book' : 'books'})
                  </option>
                ))}
                <option value="__create__">+ Create new series…</option>
              </select>
            </div>
            <Input
              type="number"
              label="Book #"
              placeholder="1"
              value={seriesNumber ?? ''}
              disabled={!seriesId}
              onChange={(e) => {
                const num = parseInt(e.target.value, 10);
                if (!seriesId) return;
                setSeries({
                  seriesId,
                  seriesNumber: Number.isFinite(num) && num > 0 ? num : 1,
                  seriesName: seriesName || null,
                  sharedConfig: useStudioStore.getState().seriesSharedConfig,
                  lockedFields: seriesLockedFields,
                });
              }}
              min={1}
            />
          </div>

          {seriesId && (
            <div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>
                Inheriting series defaults
                {seriesLockedFields && seriesLockedFields.length > 0
                  ? ` (${seriesLockedFields.length} locked)`
                  : ''}
                .
              </span>
              <button
                onClick={clearSeries}
                className="text-xs underline hover:no-underline"
                type="button"
              >
                Remove from series
              </button>
            </div>
          )}

          {!seriesId && (
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setShowCreateModal(true)}
                type="button"
              >
                Create new series
              </Button>
            </div>
          )}
        </div>

        {/* Co-Authors */}
        <div className="pt-5 mt-1 border-t border-gray-200/60 dark:border-gray-800/40">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Collaboration</p>
          <Input
            label="Co-Author Names"
            placeholder="Separate multiple names with commas"
            value={config.basicInfo.coAuthors?.join(', ') || ''}
            onChange={(e) =>
              updateConfig({
                basicInfo: {
                  ...config.basicInfo,
                  coAuthors: e.target.value
                    .split(',')
                    .map((name) => name.trim())
                    .filter((name) => name.length > 0),
                },
              })
            }
            helperText="Add co-authors if this is a collaborative work"
          />
        </div>
      </div>

      <SeriesEditorModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        seedFromConfig={config}
        onSaved={handleSeriesCreated}
      />
    </div>
  );
};
