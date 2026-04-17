'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Lock, BookCopy, Loader2 } from 'lucide-react';
import {
  LOCKABLE_SERIES_FIELDS,
  LOCKABLE_SERIES_FIELD_LABELS,
  type LockableSeriesField,
  type Series,
  type SeriesSharedConfig,
  type SeriesStatus,
} from '@/lib/types/series';
import type { BookConfiguration } from '@/lib/types/studio';
import { buildSharedConfigFromBook } from '@/lib/utils/apply-series-defaults';

export interface SeriesEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Existing series to edit, or null/undefined to create a new one. */
  series?: Series | null;
  /** When creating, optionally seed shared config from a book's configuration. */
  seedFromConfig?: BookConfiguration | null;
  /** Called with the saved series after a successful create/update. */
  onSaved?: (series: Series) => void;
}

const STATUS_OPTIONS: { value: SeriesStatus; label: string }[] = [
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'hiatus', label: 'On Hiatus' },
];

export function SeriesEditorModal({
  isOpen,
  onClose,
  series,
  seedFromConfig,
  onSaved,
}: SeriesEditorModalProps) {
  const isEditing = !!series?.id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [status, setStatus] = useState<SeriesStatus>('ongoing');
  const [isPublic, setIsPublic] = useState(false);
  const [lockedFields, setLockedFields] = useState<LockableSeriesField[]>([]);
  const [sharedConfig, setSharedConfig] = useState<SeriesSharedConfig | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (series) {
      setName(series.name || '');
      setDescription(series.description || '');
      setCoverUrl(series.coverUrl || '');
      setStatus(series.status || 'ongoing');
      setIsPublic(!!series.isPublic);
      setLockedFields(Array.isArray(series.lockedFields) ? series.lockedFields : []);
      setSharedConfig(series.sharedConfig || null);
    } else {
      setName('');
      setDescription('');
      setCoverUrl('');
      setStatus('ongoing');
      setIsPublic(false);
      setLockedFields([]);
      setSharedConfig(seedFromConfig ? buildSharedConfigFromBook(seedFromConfig) : null);
    }
    setError(null);
  }, [isOpen, series, seedFromConfig]);

  const toggleLock = (field: LockableSeriesField) => {
    setLockedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Series name is required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const url = isEditing ? `/api/series/${series!.id}` : '/api/series';
      const method = isEditing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          coverUrl: coverUrl.trim() || null,
          status,
          isPublic,
          lockedFields,
          sharedConfig,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Failed to save series');
      }
      onSaved?.(data.series as Series);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save series');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Series' : 'Create Series'}
      description="A series groups books that share style, world, and themes. Books in this series will inherit shared defaults."
      size="lg"
    >
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {error && (
          <div className="rounded-md bg-[var(--error-light)] border border-[var(--error)] px-3 py-2 text-sm text-[var(--error)]">
            {error}
          </div>
        )}

        <Input
          label="Series Name *"
          placeholder="e.g., The Chronicles of Eldoria"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
            Description
          </label>
          <Textarea
            placeholder="What's this series about? (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SeriesStatus)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Series Cover URL (optional)"
            placeholder="https://..."
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] select-none cursor-pointer">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="rounded border-[var(--input-border)] text-[var(--accent)] focus:ring-[var(--accent)]"
          />
          Make this series public (visible in showcase)
        </label>

        <div className="pt-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2 mb-1">
            <BookCopy className="w-4 h-4 text-[var(--accent)]" />
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              Shared Series Defaults
            </h4>
          </div>
          <p className="text-xs text-[var(--text-muted)] mb-3">
            {sharedConfig
              ? 'These values are used as defaults for every new book in this series.'
              : 'No shared defaults yet. They\u2019ll be filled in when you write the first book in the series, or you can edit this series later.'}
          </p>

          {sharedConfig && (
            <div className="rounded-md bg-[var(--background-tertiary)] border border-[var(--border-subtle)] p-3 mb-4 space-y-1 text-xs text-[var(--text-secondary)]">
              {sharedConfig.author && <div><span className="text-[var(--text-muted)]">Author:</span> {sharedConfig.author}</div>}
              {sharedConfig.genre && <div><span className="text-[var(--text-muted)]">Genre:</span> {sharedConfig.genre}{sharedConfig.subGenre ? ` / ${sharedConfig.subGenre}` : ''}</div>}
              {sharedConfig.writingStyle?.style && <div><span className="text-[var(--text-muted)]">Style:</span> {sharedConfig.writingStyle.style}, {sharedConfig.writingStyle.tone}, {sharedConfig.writingStyle.pov}, {sharedConfig.writingStyle.tense}</div>}
              {sharedConfig.setting?.timePeriod && <div><span className="text-[var(--text-muted)]">Setting:</span> {sharedConfig.setting.timePeriod}, {sharedConfig.setting.location}</div>}
              {sharedConfig.themes?.primary && sharedConfig.themes.primary.length > 0 && <div><span className="text-[var(--text-muted)]">Themes:</span> {sharedConfig.themes.primary.join(', ')}</div>}
              {sharedConfig.visuals?.coverStyle && <div><span className="text-[var(--text-muted)]">Cover style:</span> {sharedConfig.visuals.coverStyle}{sharedConfig.visuals.coverColorScheme ? `, ${sharedConfig.visuals.coverColorScheme}` : ''}</div>}
            </div>
          )}

          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              Lock fields (books in this series cannot override these)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-60 overflow-y-auto pr-1">
            {LOCKABLE_SERIES_FIELDS.map((field) => (
              <label
                key={field}
                className="flex items-center gap-2 text-sm text-[var(--text-secondary)] py-1.5 px-2 rounded hover:bg-[var(--surface-hover)] cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={lockedFields.includes(field)}
                  onChange={() => toggleLock(field)}
                  className="rounded border-[var(--input-border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span>{LOCKABLE_SERIES_FIELD_LABELS[field]}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-[var(--border)]">
        <Button variant="ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={submitting}
          leftIcon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
        >
          {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Series'}
        </Button>
      </div>
    </Modal>
  );
}
