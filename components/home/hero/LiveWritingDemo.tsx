'use client';

/**
 * LiveWritingDemo — the right column of the hero.
 *
 * Replaces the previous skeleton-bar book mockup with a *real* book spread
 * that shows live AI-written content. The genre is driven by `genreIndex`,
 * which comes from the parent's typing animation (so "Create your Memoir" on
 * the left always pairs with a memoir excerpt streaming on the right).
 *
 * Behaviour:
 *  - On `genreIndex` change the panel resets and a new chapter title +
 *    outline appears, then the excerpt streams in character-by-character.
 *  - Honours `prefers-reduced-motion`: streaming and ambient breath are
 *    disabled; the full excerpt is shown immediately.
 *  - All colours flow through tokens — book paper uses `--brand-paper`,
 *    "ink" headings use `--brand-ink`, so the panel reads correctly in
 *    light, dark, and system (AAA) themes.
 */

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  BookOpen,
  Headphones,
  FileText,
  Sparkles,
  Download,
  Wand2,
} from 'lucide-react';
import { GENRES } from './genre-content';

interface LiveWritingDemoProps {
  /** Index of the active genre — wraps via modulo, so any integer is safe. */
  genreIndex: number;
}

const STREAM_SPEED_MS = 22;
const STREAM_START_DELAY_MS = 350;

export function LiveWritingDemo({ genreIndex }: LiveWritingDemoProps) {
  const reduce = useReducedMotion();
  const genre = GENRES[((genreIndex % GENRES.length) + GENRES.length) % GENRES.length];
  const [streamed, setStreamed] = useState(reduce ? genre.excerpt : '');

  useEffect(() => {
    if (reduce) {
      setStreamed(genre.excerpt);
      return;
    }
    setStreamed('');
    let i = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const startId = window.setTimeout(() => {
      intervalId = setInterval(() => {
        i += 1;
        if (i > genre.excerpt.length) {
          if (intervalId) clearInterval(intervalId);
          return;
        }
        setStreamed(genre.excerpt.slice(0, i));
      }, STREAM_SPEED_MS);
    }, STREAM_START_DELAY_MS);

    return () => {
      window.clearTimeout(startId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [genre.excerpt, reduce]);

  const isStreaming = streamed.length < genre.excerpt.length;
  const wordsTyped = streamed.trim() ? streamed.trim().split(/\s+/).length : 0;
  const totalWords = genre.excerpt.trim().split(/\s+/).length;

  return (
    <div className="relative max-w-md mx-auto">
      {/* Single calm ambient glow behind the book */}
      <div
        aria-hidden="true"
        className="absolute -inset-8 rounded-3xl blur-3xl"
        style={{ background: 'var(--accent-gradient-soft)', opacity: 0.55 }}
      />

      <div className="relative animate-breath" style={{ perspective: '1200px' }}>
        {/* Floating sparkles — subtle, no pulse. */}
        <div
          className="absolute -top-6 -left-6 w-full h-full pointer-events-none overflow-visible"
          aria-hidden="true"
        >
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float"
              style={{
                left: `${15 + i * 22}%`,
                top: `${10 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${4 + i * 0.5}s`,
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]/40" />
            </div>
          ))}
        </div>

        <div
          className="relative bg-[var(--background-elevated)] rounded-2xl p-6 sm:p-7 border border-[var(--border)] shadow-[var(--shadow-elevated)]"
          style={{ transform: 'rotateY(-5deg) rotateX(3deg)', transformStyle: 'preserve-3d' }}
        >
          {/* Top bar — "Generating: GENRE" */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)] font-semibold">
              <span className="relative inline-flex w-1.5 h-1.5">
                <span
                  className={`absolute inset-0 rounded-full bg-[var(--success)] ${
                    isStreaming ? 'animate-ping opacity-75' : 'opacity-0'
                  }`}
                />
                <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
              </span>
              Live preview
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[var(--accent-text)] bg-[var(--accent-surface)] px-2 py-0.5 rounded-full border border-[var(--accent)]/15">
              {genre.word}
            </div>
          </div>

          {/* Golden spine */}
          <div className="absolute left-0 top-16 bottom-16 w-1.5 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 rounded-l-lg" />

          <div className="flex gap-3 sm:gap-4">
            {/* Left page — chapter title + outline beats */}
            <div
              key={`left-${genreIndex}`}
              className="flex-1 bg-[var(--brand-paper)] rounded-lg p-4 shadow-inner relative overflow-hidden min-h-[260px] animate-fadeIn"
            >
              <div className="text-[var(--text-muted)] text-[10px] uppercase tracking-widest mb-2">
                {genre.chapterTag}
              </div>
              <div
                className="font-display text-[var(--brand-ink)] mb-4 leading-tight"
                style={{ fontSize: '1.15rem', fontVariationSettings: '"opsz" 96, "SOFT" 60' }}
              >
                {genre.chapterTitle}
              </div>

              <ul className="space-y-2.5 text-[11px] text-[var(--text-secondary)]">
                {genre.outline.map((beat) => (
                  <li key={beat} className="flex items-start gap-2 leading-snug">
                    <span
                      aria-hidden="true"
                      className="mt-1 w-1 h-1 rounded-full bg-[var(--accent)] flex-shrink-0"
                    />
                    <span>{beat}</span>
                  </li>
                ))}
              </ul>

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[var(--text-muted)] text-[10px]">
                1
              </div>
            </div>

            {/* Right page — streaming excerpt in book serif */}
            <div
              className="flex-1 bg-[var(--brand-paper)] rounded-lg p-4 shadow-inner relative overflow-hidden min-h-[260px]"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--accent-surface)] rounded-full border border-[var(--accent)]/15">
                  <Wand2 className="w-3 h-3 text-[var(--accent)]" />
                  <span className="text-[10px] text-[var(--accent-text)] font-medium">
                    {isStreaming ? 'AI writing…' : 'AI written'}
                  </span>
                </div>
              </div>

              <p
                className="font-book-serif text-[var(--brand-ink)] text-[11.5px] leading-[1.55] book-text"
                style={{ minHeight: '8.5em' }}
              >
                {streamed}
                {isStreaming && (
                  <span
                    aria-hidden="true"
                    className="inline-block w-[2px] h-[1em] align-text-bottom ml-[1px] bg-[var(--accent)] animate-caret"
                  />
                )}
              </p>

              <div className="absolute bottom-2 right-3 text-[var(--text-muted)] text-[10px] tabular-nums">
                {wordsTyped} / {totalWords} words
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[var(--text-muted)] text-[10px]">
                2
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-5 pt-4 border-t border-[var(--border)]">
            <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[var(--accent)]" /> 12 ch
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[var(--success)]" /> 45k words
                </span>
              </div>
              <span className="flex items-center gap-1.5">
                <Headphones className="w-4 h-4 text-[var(--accent-3)]" /> 3h audio
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {[
              {
                icon: <BookOpen className="w-3 h-3" />,
                label: 'AI Written',
                color: 'text-[var(--success)] bg-[var(--success-light)] border-[var(--success)]/20',
              },
              {
                icon: <Headphones className="w-3 h-3" />,
                label: 'Audio Ready',
                color: 'text-[var(--accent-3)] bg-[var(--accent-3-soft)] border-[var(--accent-3)]/25',
              },
              {
                icon: <Download className="w-3 h-3" />,
                label: 'Export All',
                color: 'text-[var(--accent-2)] bg-[var(--accent-2-soft)] border-[var(--accent-2)]/25',
              },
            ].map((badge) => (
              <div
                key={badge.label}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${badge.color}`}
              >
                {badge.icon}
                {badge.label}
              </div>
            ))}
          </div>
        </div>

        {/* Time-to-publish badge */}
        <div className="absolute -top-3 -right-3 bg-[var(--success)] text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-md">
          10 min to publish
        </div>

        <div
          className="absolute -bottom-2 -right-2 w-full h-full bg-[var(--background-tertiary)] rounded-2xl border border-[var(--border)] -z-10"
          style={{ transform: 'rotateY(-5deg) rotateX(3deg)' }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
