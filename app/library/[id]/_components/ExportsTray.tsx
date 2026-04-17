'use client';

/**
 * Downloads tray for asynchronous PDF/EPUB exports.
 *
 * Lives in the page header next to the Export button. Shows up to the last
 * 6 exports for the current book and polls every 4s while any of them are
 * pending or active. Once a row reaches `completed` the file is one click
 * away; failed rows surface their error inline.
 *
 * Polling logic:
 *   - Mount: fetch once.
 *   - If `pendingOrActive > 0`: keep polling on a 4s interval.
 *   - If everything is settled (completed/failed): stop polling.
 *   - The parent re-mounts (or calls `refresh()` via the `triggerKey`)
 *     after enqueueing a new export to immediately resume polling.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  XCircle,
  Book as BookIcon,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface ExportRow {
  id: number;
  bookId: number;
  format: 'pdf' | 'epub' | string;
  status: 'pending' | 'active' | 'completed' | 'failed' | string;
  jobId: string | null;
  fileUrl: string | null;
  fileSize: number | null;
  layoutType: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface ExportsTrayProps {
  bookId: number;
  /**
   * Bumped by the parent every time it enqueues a new export, forcing
   * an immediate refresh + reactivating the poll loop.
   */
  triggerKey?: number;
}

const POLL_INTERVAL_MS = 4_000;
const MAX_VISIBLE_EXPORTS = 6;

function formatBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function statusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'active':
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    case 'pending':
    default:
      return <Clock className="w-4 h-4 text-amber-500" />;
  }
}

function formatLabel(format: string): React.ReactNode {
  if (format === 'pdf') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-red-500">
        <FileText className="w-3 h-3" /> PDF
      </span>
    );
  }
  if (format === 'epub') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-orange-500">
        <BookIcon className="w-3 h-3" /> EPUB
      </span>
    );
  }
  return <span className="text-xs uppercase">{format}</span>;
}

export function ExportsTray({ bookId, triggerKey = 0 }: ExportsTrayProps) {
  const [rows, setRows] = useState<ExportRow[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUnmounted = useRef(false);

  const fetchRows = useCallback(async (): Promise<ExportRow[]> => {
    const res = await fetch(`/api/books/exports?bookId=${bookId}`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const json = (await res.json()) as { exports?: ExportRow[] };
    return Array.isArray(json.exports) ? json.exports : [];
  }, [bookId]);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchRows();
      if (isUnmounted.current) return;
      setRows(next);
      setError(null);
      setHasFetched(true);
    } catch (e) {
      if (isUnmounted.current) return;
      setError(e instanceof Error ? e.message : 'Failed to load exports');
      setHasFetched(true);
    }
  }, [fetchRows]);

  // Poll loop — restarts whenever bookId / triggerKey changes.
  useEffect(() => {
    isUnmounted.current = false;
    let stopped = false;

    const tick = async () => {
      if (stopped) return;
      await refresh();
      if (stopped) return;
      const stillWorking = (rowsRef.current ?? []).some(
        (r) => r.status === 'pending' || r.status === 'active',
      );
      if (stillWorking) {
        pollTimer.current = setTimeout(tick, POLL_INTERVAL_MS);
      }
    };

    tick();

    return () => {
      stopped = true;
      isUnmounted.current = true;
      if (pollTimer.current) {
        clearTimeout(pollTimer.current);
        pollTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, triggerKey]);

  // Keep a ref of rows so the poll loop can read the latest snapshot
  // without retriggering the effect on every state update.
  const rowsRef = useRef<ExportRow[]>([]);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  // After polling stops because everything settled, the user might come
  // back and want to retry — opening the tray re-fetches once.
  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  const visible = rows.slice(0, MAX_VISIBLE_EXPORTS);
  const pendingOrActive = rows.filter(
    (r) => r.status === 'pending' || r.status === 'active',
  ).length;
  const hasFailed = rows.some((r) => r.status === 'failed');

  // Don't render the trigger at all until we know there's something to show.
  // Avoids flashing an empty button on first paint for users with no exports.
  if (hasFetched && rows.length === 0) {
    return null;
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="relative inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          aria-label="Downloads"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Downloads</span>
          {pendingOrActive > 0 ? (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-semibold rounded-full bg-blue-500 text-white">
              {pendingOrActive}
            </span>
          ) : hasFailed ? (
            <span className="w-2 h-2 rounded-full bg-red-500" />
          ) : null}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="w-[360px] max-h-[440px] overflow-y-auto z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl py-2 animate-in fade-in-0 zoom-in-95"
        >
          <DropdownMenu.Label className="px-3 pb-2 pt-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Recent Exports
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 mx-2 mb-1" />

          {error && rows.length === 0 ? (
            <div className="px-3 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          ) : visible.length === 0 ? (
            <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
              No exports yet. Choose PDF or EPUB from the Export menu to get
              started.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {visible.map((row) => {
                const sizeText = formatBytes(row.fileSize);
                const when = formatRelative(
                  row.completedAt ?? row.createdAt,
                );
                const canDownload = row.status === 'completed' && row.fileUrl;

                return (
                  <li key={row.id} className="px-3 py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {statusIcon(row.status)}
                          {formatLabel(row.format)}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {when}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                          {row.status === 'pending' && 'Queued — waiting for worker…'}
                          {row.status === 'active' && 'Generating…'}
                          {row.status === 'completed' && (sizeText || 'Ready')}
                          {row.status === 'failed' && (
                            <span className="text-red-600 dark:text-red-400">
                              {row.errorMessage ?? 'Export failed'}
                            </span>
                          )}
                        </div>
                      </div>
                      {canDownload ? (
                        <a
                          href={row.fileUrl ?? '#'}
                          download
                          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:opacity-90 transition-opacity"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </a>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
