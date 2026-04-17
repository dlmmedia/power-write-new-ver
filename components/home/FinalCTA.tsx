'use client';

/**
 * FinalCTA — closing section between FAQ and footer.
 *
 * Editorial closer: a single display-serif headline ("Your first
 * chapter starts now."), a faded chapter excerpt sitting behind it as
 * texture (so the moment *feels* like a book page), and one
 * unambiguous primary CTA. A small reassurance row underneath
 * neutralises last-mile objections (no card, refund, cancel any time).
 *
 * The faded excerpt is purely decorative (`aria-hidden="true"`).
 * It uses the project's existing book serif and ink color so the
 * typography reads as continuous with the rest of the brand.
 */

import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Reveal } from '@/components/home/Reveal';

const FADED_EXCERPT = `Chapter One

She turned the brass key, and the door swung open onto a room she had not seen since the summer her father vanished. The light came through the curtains the colour of old tea. On the desk, beneath a paperweight shaped like a sparrow, lay a letter — unsigned, but in handwriting she recognised at once. It was dated tomorrow.

For a long moment she did not move. The house was still. Outside, in the orchard, the wind turned a single page.`;

export function FinalCTA() {
  const router = useRouter();

  return (
    <section
      className="relative isolate overflow-hidden py-24 md:py-36 bg-[var(--background)]"
      aria-labelledby="final-cta-heading"
    >
      {/* Aurora glow — single ambient effect tying the closer to the hero. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'var(--hero-glow)' }}
      />

      {/* Faded chapter excerpt as background texture. Two columns on
          desktop, one column on mobile — never the focus, just a
          whisper of a real book page behind the headline. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none flex items-center justify-center px-4"
      >
        <pre className="font-book-serif text-[var(--brand-ink)]/8 dark:text-[var(--brand-cream)]/5 max-w-5xl w-full whitespace-pre-wrap text-center text-sm md:text-base lg:text-lg leading-[1.7] select-none">
          {FADED_EXCERPT}
        </pre>
      </div>

      {/* Soft fade-out at the top and bottom so the texture doesn't
          fight the section edges. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-32 pointer-events-none bg-gradient-to-b from-[var(--background)] to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-32 pointer-events-none bg-gradient-to-t from-[var(--background)] to-transparent"
      />

      <div className="container relative mx-auto px-4 z-10">
        <Reveal as="div" className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-5 flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3" />
            Your story is waiting
          </p>

          <h2
            id="final-cta-heading"
            className="font-display text-[2.75rem] sm:text-5xl md:text-6xl lg:text-7xl text-[var(--text-primary)] leading-[1.05] tracking-tight"
          >
            Your first chapter
            <span className="block font-display-italic text-gradient-accent mt-1">
              starts now.
            </span>
          </h2>

          <p className="mt-7 text-lg md:text-xl text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
            Configure your book, generate the outline, and ship a draft this weekend.
            No credit card required.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push('/studio')}
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="min-w-[14rem]"
            >
              Start writing free
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => router.push('/showcase')}
            >
              Browse sample books
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--success)]" />
              30-day money-back guarantee
            </span>
            <span aria-hidden="true" className="hidden sm:inline-block w-1 h-1 rounded-full bg-[var(--border-strong)]" />
            <span>14-day free trial</span>
            <span aria-hidden="true" className="hidden sm:inline-block w-1 h-1 rounded-full bg-[var(--border-strong)]" />
            <span>Cancel any time</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
