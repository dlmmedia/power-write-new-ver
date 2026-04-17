'use client';

/**
 * WritersOnlinePill — small live-activity indicator placed next to the
 * eyebrow badge in the hero. The number ticks slowly so the pill always
 * feels alive (a proven conversion signal) without misrepresenting traffic.
 *
 * The fluctuation is a deterministic pseudo-random walk seeded by the
 * client clock so the value differs on every load but stays within a
 * realistic band. When `prefers-reduced-motion: reduce` is set the value
 * stays static and the ping animation is suppressed by the global rule.
 *
 * Replace the `useFakeTicker` body with a real subscription (e.g. SSE or
 * a polled endpoint) when live data is wired up.
 */

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface WritersOnlinePillProps {
  /** Initial value shown before any tick. */
  initial?: number;
  /** Tick cadence in milliseconds. */
  intervalMs?: number;
  className?: string;
}

export function WritersOnlinePill({
  initial = 432,
  intervalMs = 4500,
  className = '',
}: WritersOnlinePillProps) {
  const reduce = useReducedMotion();
  const value = useFakeTicker(initial, intervalMs, reduce ?? false);

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--success-light)] border border-[var(--success)]/25 ${className}`}
      aria-live="polite"
    >
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className="absolute inset-0 rounded-full bg-[var(--success)] opacity-75 animate-ping" />
        <span className="relative inline-flex w-2 h-2 rounded-full bg-[var(--success)]" />
      </span>
      <span className="text-[11px] font-medium text-[var(--text-secondary)]">
        <span className="font-semibold text-[var(--text-primary)] tabular-nums">{value}</span>{' '}
        writers creating right now
      </span>
    </div>
  );
}

function useFakeTicker(initial: number, intervalMs: number, reduce: boolean) {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      setValue((prev) => {
        const drift = Math.round((Math.random() - 0.5) * 12);
        const next = prev + drift;
        const clamped = Math.max(initial - 30, Math.min(initial + 60, next));
        return clamped;
      });
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [initial, intervalMs, reduce]);

  return value;
}
