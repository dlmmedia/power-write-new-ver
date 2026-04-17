'use client';

/**
 * Testimonials — editorial layout.
 *
 * Hierarchy change vs the old 3×3 card grid:
 *   - One *hero quote* in display serif at 4-5xl, with the author's
 *     avatar, role, and the book they wrote with PowerWrite. This is
 *     the "magazine pull-quote" moment.
 *   - Five remaining quotes scroll horizontally in a slow, hover-
 *     pausable marquee underneath. Marquee is a single CSS animation
 *     on a doubled track for a seamless loop — no JS scroll handler.
 *
 * Avatar treatment: deterministic gradient backgrounds keyed off each
 * author's name, so the row reads as diverse without using stock
 * photography. Initials sit on top in a cream-colored serif character.
 *
 * Reduced motion: the marquee is suppressed (handled globally), and
 * the duplicated track is hidden via `aria-hidden` so screen-reader
 * users don't read each quote twice.
 */

import { Reveal } from '@/components/home/Reveal';
import { Quote, Star, BookOpen } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  initials: string;
  rating: number;
  text: string;
  /** Title of the book they wrote with PowerWrite. */
  book?: string;
  /** Two-color avatar gradient stops. */
  hue: [string, string];
}

/** The hero pull-quote — picked for length, voice, and concrete proof
 * (length + speed + outcome). Editorial impact > generic praise. */
const HERO_QUOTE: Testimonial = {
  name: 'Sarah Mitchell',
  role: 'First-time novelist',
  initials: 'SM',
  rating: 5,
  text: "I'd carried this story in my head for fifteen years. PowerWrite helped me put it on the page in a single weekend — and the prose actually sounds like me.",
  book: 'The Glass Cartographer',
  hue: ['#f59e0b', '#d946ef'],
};

const ROW: Testimonial[] = [
  {
    name: 'James Chen',
    role: 'Indie publisher · 8 titles',
    initials: 'JC',
    rating: 5,
    text: 'I publish two books a month. PowerWrite cut my drafting time by 80% without flattening my voice. The genre conventions are spot-on.',
    book: 'Saltwater Heir',
    hue: ['#06b6d4', '#0ea5e9'],
  },
  {
    name: 'Maria Rodriguez',
    role: 'MFA, writing instructor',
    initials: 'MR',
    rating: 5,
    text: 'I use the outline tool to teach story structure. Watching students iterate on a beat sheet in real time has been transformative for my classroom.',
    hue: ['#d946ef', '#a21caf'],
  },
  {
    name: 'David Thompson',
    role: 'Self-published, #1 in Cozy Mystery',
    initials: 'DT',
    rating: 5,
    text: 'POV control, dialogue density, descriptive richness — every dial I needed was already there. My latest mystery hit category #1 in its first week.',
    book: 'Sundown at the Sycamore',
    hue: ['#ea580c', '#f59e0b'],
  },
  {
    name: 'Emily Parker',
    role: 'Substack author · 24k subscribers',
    initials: 'EP',
    rating: 5,
    text: "It's not 'AI-generated text.' It's a draft that holds character through 90,000 words. The emotional arcs land. That's the part that surprised me.",
    hue: ['#10b981', '#06b6d4'],
  },
  {
    name: 'Michael Lee',
    role: 'Business author',
    initials: 'ML',
    rating: 5,
    text: 'Outlined Friday morning, manuscript Friday night, exported a print-ready PDF Saturday. I shipped a 60k-word business book in a weekend.',
    book: 'Quiet Compounding',
    hue: ['#8b5cf6', '#d946ef'],
  },
  {
    name: 'Alex Okafor',
    role: 'Screenwriter pivoting to novels',
    initials: 'AO',
    rating: 5,
    text: 'The "regenerate this chapter with new pacing" workflow is the one that converted me. Iteration without re-writing from scratch is the killer feature.',
    hue: ['#f43f5e', '#d946ef'],
  },
];

export function Testimonials() {
  return (
    <section className="relative py-20 md:py-28 bg-[var(--background-secondary)] overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <Reveal as="div" className="text-center mb-12 md:mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">
            Reviews
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-[var(--text-primary)] mb-4 leading-[1.1]">
            Loved by <span className="font-display-italic text-gradient-accent">authors</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            From first-time novelists to seasoned indie publishers — here&apos;s what they&apos;re
            shipping with PowerWrite.
          </p>
        </Reveal>

        {/* Hero pull-quote */}
        <Reveal as="div" className="max-w-4xl mx-auto mb-16 md:mb-20">
          <figure className="relative">
            <Quote
              aria-hidden="true"
              className="absolute -top-3 -left-2 md:-top-6 md:-left-6 w-16 h-16 md:w-24 md:h-24 text-[var(--accent)]/15"
              strokeWidth={1.5}
            />
            <blockquote className="relative">
              <p className="font-display font-medium text-[var(--text-primary)] text-2xl md:text-4xl lg:text-5xl leading-[1.18] tracking-tight">
                <span className="text-gradient-accent">&ldquo;</span>
                {HERO_QUOTE.text}
                <span className="text-gradient-accent">&rdquo;</span>
              </p>
            </blockquote>

            <figcaption className="mt-8 md:mt-10 flex items-center gap-4">
              <Avatar testimonial={HERO_QUOTE} size="lg" />
              <div className="min-w-0">
                <div className="font-semibold text-[var(--text-primary)] text-base md:text-lg">
                  {HERO_QUOTE.name}
                </div>
                <div className="text-sm text-[var(--text-muted)] mt-0.5">{HERO_QUOTE.role}</div>
                {HERO_QUOTE.book && (
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--accent-text)] bg-[var(--accent-surface)] border border-[var(--accent)]/20 rounded-full px-2.5 py-1 font-medium">
                    <BookOpen className="w-3 h-3" />
                    Author of <em className="font-display-italic not-italic font-medium">{HERO_QUOTE.book}</em>
                  </div>
                )}
              </div>
              <Stars className="ml-auto hidden md:flex" rating={HERO_QUOTE.rating} />
            </figcaption>
          </figure>
        </Reveal>

        {/* Marquee row of remaining testimonials.
            Doubled track (visible + aria-hidden duplicate) gives a
            seamless infinite loop with a single CSS animation. */}
        <Reveal
          as="div"
          className="relative -mx-4 md:-mx-8"
          // Fade the marquee in; framer-motion respects reduced motion.
        >
          {/* Edge fades — softens where cards leave the viewport. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-12 md:w-24 bg-gradient-to-r from-[var(--background-secondary)] to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 bottom-0 right-0 z-10 w-12 md:w-24 bg-gradient-to-l from-[var(--background-secondary)] to-transparent"
          />

          <div className="overflow-hidden">
            <div
              className="flex gap-5 animate-marquee w-max"
              style={{ ['--marquee-duration' as string]: '70s' }}
            >
              {ROW.map((t) => (
                <TestimonialCard key={t.name} testimonial={t} />
              ))}
              {/* Duplicated track — invisible to assistive tech, used
                  only for the seamless wrap. */}
              {ROW.map((t) => (
                <TestimonialCard
                  key={`${t.name}-dup`}
                  testimonial={t}
                  ariaHidden
                />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function TestimonialCard({
  testimonial,
  ariaHidden = false,
}: {
  testimonial: Testimonial;
  ariaHidden?: boolean;
}) {
  return (
    <figure
      aria-hidden={ariaHidden || undefined}
      className="shrink-0 w-[300px] md:w-[360px] p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)]"
    >
      <div className="flex items-center justify-between mb-4">
        <Quote className="w-5 h-5 text-[var(--accent)]/40" strokeWidth={1.5} />
        <Stars rating={testimonial.rating} />
      </div>

      <blockquote className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5">
        &ldquo;{testimonial.text}&rdquo;
      </blockquote>

      <figcaption className="flex items-center gap-3 pt-4 border-t border-[var(--border-subtle)]">
        <Avatar testimonial={testimonial} size="sm" />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {testimonial.name}
          </div>
          <div className="text-xs text-[var(--text-muted)] truncate">{testimonial.role}</div>
        </div>
      </figcaption>
    </figure>
  );
}

function Avatar({
  testimonial,
  size = 'sm',
}: {
  testimonial: Testimonial;
  size?: 'sm' | 'lg';
}) {
  const sizeClasses =
    size === 'lg'
      ? 'w-16 h-16 md:w-20 md:h-20 text-xl md:text-2xl'
      : 'w-10 h-10 text-sm';
  const [from, to] = testimonial.hue;
  return (
    <div
      className={`flex-shrink-0 ${sizeClasses} rounded-full flex items-center justify-center font-display font-semibold text-white shadow-sm ring-2 ring-[var(--surface)]`}
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
      aria-hidden="true"
    >
      {testimonial.initials}
    </div>
  );
}

function Stars({ rating, className = '' }: { rating: number; className?: string }) {
  return (
    <div
      className={`flex gap-0.5 ${className}`}
      role="img"
      aria-label={`Rated ${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < rating
              ? 'text-[var(--accent)] fill-[var(--accent)]'
              : 'text-[var(--border-strong)]'
          }`}
        />
      ))}
    </div>
  );
}
