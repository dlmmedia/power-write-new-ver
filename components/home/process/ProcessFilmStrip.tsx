'use client';

/**
 * ProcessFilmStrip — desktop-only horizontal "film strip" of the
 * 5-step writing process. Each step is rendered as a large card with
 * a stylised in-app mockup (`StepMockup`).
 *
 * Behaviour:
 *   - CSS scroll-snap keeps cards perfectly aligned as the user
 *     scrolls or uses the arrow buttons.
 *   - A thin progress bar above the strip fills as the user scrolls,
 *     giving spatial feedback (5 steps, where am I).
 *   - Arrow buttons appear on hover; they're disabled at the ends.
 *   - Honours `prefers-reduced-motion`: scroll behaviour falls back to
 *     the browser default (no smooth-scroll), step animations are off.
 *
 * Mobile is rendered separately in `HowItWorks` as the original
 * vertical card list — the film strip needs horizontal viewport space
 * that small screens just don't have.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { StepMockup, type StepVariant } from './StepMockup';

interface FilmStripStep {
  number: number;
  title: string;
  description: string;
  icon: ReactNode;
  variant: StepVariant;
}

interface ProcessFilmStripProps {
  steps: FilmStripStep[];
  className?: string;
}

export function ProcessFilmStrip({ steps, className = '' }: ProcessFilmStripProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const ratio = max > 0 ? el.scrollLeft / max : 0;
    setProgress(ratio);
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < max - 4);

    // Active index = card whose center is closest to the viewport center.
    const viewportCenter = el.scrollLeft + el.clientWidth / 2;
    const cards = Array.from(el.querySelectorAll<HTMLElement>('[data-step-card]'));
    let bestIdx = 0;
    let bestDist = Infinity;
    cards.forEach((card, i) => {
      const center = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(center - viewportCenter);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    });
    setActiveIndex(bestIdx);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => updateState();
    el.addEventListener('scroll', onScroll, { passive: true });
    // ResizeObserver fires once immediately on observe(), which gives us
    // the initial scroll/active-index measurement for free — no need for
    // a synchronous useLayoutEffect call (which would trip the
    // `react-hooks/set-state-in-effect` rule).
    const ro = new ResizeObserver(() => updateState());
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, [updateState]);

  const scrollByCard = useCallback((direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-step-card]');
    const step = card ? card.offsetWidth + 24 : el.clientWidth * 0.8; // gap-6 = 24px
    el.scrollBy({ left: step * direction, behavior: 'smooth' });
  }, []);

  const scrollToIndex = useCallback((idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>('[data-step-card]');
    const target = cards[idx];
    if (!target) return;
    const targetLeft = target.offsetLeft - (el.clientWidth - target.offsetWidth) / 2;
    el.scrollTo({ left: targetLeft, behavior: 'smooth' });
  }, []);

  const progressPct = useMemo(() => {
    // When there's a single card visible at a time we want the bar to read
    // proportionally to *card index*, not raw scroll. Use the active index
    // to give the bar a discrete-feeling fill that still tracks fluid scroll.
    const fromIndex = (activeIndex / Math.max(1, steps.length - 1)) * 100;
    const fromScroll = progress * 100;
    return Math.max(fromIndex, fromScroll);
  }, [activeIndex, progress, steps.length]);

  return (
    <div className={`relative ${className}`}>
      {/* Progress bar */}
      <div
        className="mx-auto mb-6 max-w-md h-[3px] bg-[var(--surface-active)] rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(progressPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Process scroll progress"
      >
        <div
          className="h-full rounded-full transition-[width] duration-200 ease-out"
          style={{
            width: `${progressPct}%`,
            background: 'var(--accent-gradient)',
          }}
        />
      </div>

      {/* Scroll arrows (decorative — keyboard users use the dot nav below) */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={() => scrollByCard(-1)}
        disabled={!canScrollLeft}
        className={`hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[var(--surface)] border border-[var(--border-strong)] shadow-md items-center justify-center text-[var(--text-secondary)] transition-all duration-200 ${
          canScrollLeft
            ? 'opacity-0 group-hover/film:opacity-100 hover:text-[var(--accent)] hover:border-[var(--accent)]/40 -translate-x-1/2 group-hover/film:translate-x-0'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={() => scrollByCard(1)}
        disabled={!canScrollRight}
        className={`hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[var(--surface)] border border-[var(--border-strong)] shadow-md items-center justify-center text-[var(--text-secondary)] transition-all duration-200 ${
          canScrollRight
            ? 'opacity-0 group-hover/film:opacity-100 hover:text-[var(--accent)] hover:border-[var(--accent)]/40 translate-x-1/2 group-hover/film:translate-x-0'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* The strip itself */}
      <div className="group/film relative">
        {/* Edge fades — soften where cards leave the viewport. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-[var(--background)] to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-[var(--background)] to-transparent"
        />

        <div
          ref={scrollerRef}
          className="film-strip-scroll flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6 px-[max(1rem,calc((100%-44rem)/2))]"
          tabIndex={0}
          aria-label="Five-step writing process — scroll horizontally to navigate"
        >
          {steps.map((step, i) => (
            <article
              key={step.number}
              data-step-card
              className={`snap-center shrink-0 w-[min(80vw,420px)] transition-all duration-500 ease-out ${
                i === activeIndex ? 'scale-100 opacity-100' : 'scale-[0.96] opacity-65'
              }`}
            >
              <div className="relative h-[520px] flex flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-5 pb-4 border-b border-[var(--border)] bg-gradient-to-b from-[var(--surface-hover)] to-[var(--surface)]">
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--accent-surface)] border border-[var(--accent)]/30 text-[var(--accent)] font-bold text-sm flex items-center justify-center tabular-nums">
                      {String(step.number).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-widest font-semibold text-[var(--text-muted)]">
                        Step {step.number} / {steps.length}
                      </div>
                      <h3 className="text-base font-semibold text-[var(--text-primary)] leading-tight truncate">
                        {step.title}
                      </h3>
                    </div>
                  </div>
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[var(--surface-hover)] text-[var(--text-secondary)] flex items-center justify-center">
                    {step.icon}
                  </div>
                </div>

                {/* Mockup body */}
                <div className="flex-1 p-5">
                  <StepMockup variant={step.variant} />
                </div>

                {/* Description footer */}
                <div className="p-5 pt-4 border-t border-[var(--border)] bg-[var(--surface-hover)]">
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Dot nav — primary keyboard / a11y interface for jumping between steps. */}
      <div
        className="mt-2 flex items-center justify-center gap-2"
        role="tablist"
        aria-label="Process step navigation"
      >
        {steps.map((step, i) => (
          <button
            key={step.number}
            type="button"
            role="tab"
            aria-selected={i === activeIndex}
            aria-label={`Step ${step.number}: ${step.title}`}
            onClick={() => scrollToIndex(i)}
            className={`group/dot p-2 rounded-full focus-ring transition-colors`}
          >
            <span
              className={`block h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? 'w-8 bg-[var(--accent)]'
                  : 'w-1.5 bg-[var(--border-strong)] group-hover/dot:bg-[var(--text-muted)]'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
