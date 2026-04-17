'use client';

/**
 * AudioWaveform — equalizer-style animated bars used in the bento
 * "Audio Narration" tile. Heights are deterministic (sinusoidal) so the
 * pattern reads as a real waveform rather than random noise. Each bar
 * gets its own animation-delay so the overall motion stays smooth.
 *
 * Pure CSS animation (scaleY) — GPU-cheap and frees the main thread.
 * Suppressed entirely by the global `prefers-reduced-motion` rule.
 */

import { useMemo } from 'react';

interface AudioWaveformProps {
  bars?: number;
  className?: string;
}

export function AudioWaveform({ bars = 32, className = '' }: AudioWaveformProps) {
  const items = useMemo(
    () =>
      Array.from({ length: bars }, (_, i) => {
        // Two superimposed sine waves give a less mechanical, more
        // organic-feeling shape than a single curve.
        const phase = (i / bars) * Math.PI * 2;
        const h = 24 + 60 * Math.abs(Math.sin(phase * 1.5) * 0.7 + Math.cos(phase * 0.9) * 0.3);
        const delay = ((i % 9) * 0.07).toFixed(2);
        return { h: Math.min(96, Math.max(18, Math.round(h))), delay };
      }),
    [bars],
  );

  return (
    <div
      className={`flex items-center justify-between gap-[3px] h-full w-full ${className}`}
      aria-hidden="true"
    >
      {items.map((item, i) => (
        <div
          key={i}
          className="flex-1 rounded-full animate-wave-bar"
          style={{
            height: `${item.h}%`,
            animationDelay: `${item.delay}s`,
            background:
              'linear-gradient(to top, var(--accent-3) 0%, var(--accent) 60%, var(--accent-2) 100%)',
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}
