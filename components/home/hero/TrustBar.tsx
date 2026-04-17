'use client';

/**
 * TrustBar — compact inline trust strip placed under the hero CTAs.
 *
 * Shows star rating, total books / words / authors, and a small
 * "featured in" strip. Designed to read at a glance without competing
 * with the headline. All numbers are tokens passed via props so they can
 * be wired to a real source later (currently driven by sensible defaults
 * in HeroSection).
 *
 * Theme behaviour:
 *  - Stars use --accent (warms in dark mode, deepens in system AAA).
 *  - "Featured in" wordmarks use --text-muted with explicit tracking so
 *    they read as logos, not headings, in any theme.
 */

import { Star } from 'lucide-react';

interface TrustBarProps {
  rating?: number;
  ratingOf?: number;
  authors?: string;
  books?: string;
  words?: string;
  className?: string;
}

const PRESS = ['Product Hunt', 'Indie Hackers', 'TechCrunch', 'Hacker News'];

export function TrustBar({
  rating = 4.9,
  ratingOf = 5,
  authors = '1,200+',
  books = '10,247',
  words = '612M',
  className = '',
}: TrustBarProps) {
  const fullStars = Math.round(rating);

  return (
    <div className={className}>
      {/* Inline metrics row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="flex" role="img" aria-label={`${rating} out of ${ratingOf} stars`}>
            {[...Array(ratingOf)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < fullStars
                    ? 'fill-[var(--accent)] text-[var(--accent)]'
                    : 'text-[var(--border-strong)]'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
          <span className="font-semibold text-[var(--text-primary)]">{rating}</span>
          <span className="text-[var(--text-muted)]">
            from <span className="font-medium text-[var(--text-secondary)]">{authors}</span>{' '}
            authors
          </span>
        </div>

        <Separator />

        <span className="text-[var(--text-muted)]">
          <span className="font-semibold text-[var(--text-primary)] tabular-nums">{books}</span>{' '}
          books created
        </span>

        <Separator />

        <span className="text-[var(--text-muted)]">
          <span className="font-semibold text-[var(--text-primary)] tabular-nums">{words}</span>{' '}
          words generated
        </span>
      </div>

      {/* Featured-in strip */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[var(--text-muted)]">
          Featured in
        </span>
        {PRESS.map((name) => (
          <span
            key={name}
            className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[var(--text-muted)]/80 hover:text-[var(--text-secondary)] transition-colors select-none"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

function Separator() {
  return (
    <span
      aria-hidden="true"
      className="hidden sm:inline w-1 h-1 rounded-full bg-[var(--border-strong)]"
    />
  );
}
