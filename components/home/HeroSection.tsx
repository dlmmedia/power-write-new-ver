'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { Reveal, RevealStagger, RevealItem } from '@/components/home/Reveal';
import { LiveWritingDemo } from '@/components/home/hero/LiveWritingDemo';
import { TrustBar } from '@/components/home/hero/TrustBar';
import { WritersOnlinePill } from '@/components/home/hero/WritersOnlinePill';
import { GENRES } from '@/components/home/hero/genre-content';
import {
  BookOpen,
  Headphones,
  FileText,
  Sparkles,
  ArrowRight,
  Play,
  ChevronRight,
} from 'lucide-react';

// The list of genres the typing animation cycles through. Order matches
// `GENRES` in `hero/genre-content.ts` so the headline word and the live
// excerpt on the right always describe the same kind of book.
const typingWords = GENRES.map((g) => g.word);

export function HeroSection() {
  const router = useRouter();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedWord, setDisplayedWord] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const word = typingWords[currentWordIndex];
    if (isTyping) {
      if (displayedWord.length < word.length) {
        const timeout = setTimeout(
          () => setDisplayedWord(word.slice(0, displayedWord.length + 1)),
          150,
        );
        return () => clearTimeout(timeout);
      } else {
        // Hold the word longer than the excerpt takes to stream.
        const timeout = setTimeout(() => setIsTyping(false), 5500);
        return () => clearTimeout(timeout);
      }
    } else {
      if (displayedWord.length > 0) {
        const timeout = setTimeout(() => setDisplayedWord(displayedWord.slice(0, -1)), 80);
        return () => clearTimeout(timeout);
      } else {
        setCurrentWordIndex((prev) => (prev + 1) % typingWords.length);
        setIsTyping(true);
      }
    }
  }, [displayedWord, isTyping, currentWordIndex]);

  return (
    <section className="relative overflow-hidden bg-[var(--background)]">
      {/* Single ambient glow — replaces the previous stack of competing pulse blobs.
       * Token-driven so it adapts to light / dark / system themes automatically. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 animate-aurora"
        style={{ background: 'var(--hero-glow)' }}
      />

      <div className="container mx-auto px-4 relative z-10 py-16 md:py-24">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-14 items-center">
          {/* ---------- Left column ---------- */}
          <Reveal as="div" className="text-center lg:text-left">
            {/* Eyebrow row — badge + live-writers pill */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent-surface)] border border-[var(--accent)]/20">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="text-[var(--accent-text)] text-xs font-medium uppercase tracking-wider">
                  AI Book Studio
                </span>
              </div>
              <WritersOnlinePill />
            </div>

            {/* Display heading — Fraunces serif, gradient italic typing word */}
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl mb-6 leading-[1.05] text-[var(--text-primary)]">
              Create your
              <span className="block mt-2 min-h-[1.15em]">
                <span className="text-gradient-accent font-display-italic">
                  {displayedWord || '\u00A0'}
                </span>
                <span
                  aria-hidden="true"
                  className="inline-block w-[2px] h-[0.85em] align-middle ml-1 bg-[var(--accent)] animate-caret translate-y-[-0.05em]"
                />
              </span>
            </h1>

            <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-7 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Transform ideas into complete books with AI. Generate chapters, create audio
              narration, and export in any format.
            </p>

            {/* Step rail */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-7 text-sm">
              {[
                { num: '1', text: 'Describe your book' },
                { num: '2', text: 'AI writes chapters' },
                { num: '3', text: 'Export & publish' },
              ].map((step, i) => (
                <div key={step.num} className="flex items-center gap-2">
                  {i > 0 && (
                    <ChevronRight className="w-4 h-4 text-[var(--text-muted)] hidden sm:block" />
                  )}
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <div className="w-6 h-6 rounded-full bg-[var(--accent-surface)] text-[var(--accent)] flex items-center justify-center text-xs font-bold border border-[var(--accent)]/15">
                      {step.num}
                    </div>
                    <span>{step.text}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* CTAs — primary uses the brand gradient. Stacked until the
             * hero switches to its two-column layout so the buttons never
             * end up squeezed into a half-column at 640–1023px and wrap
             * mid-label. `whitespace-nowrap` is a belt-and-braces guard
             * against label wrapping at unusual zoom levels. */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mb-6">
              <SignedOut>
                <SignUpButton mode="modal">
                  <button
                    className="group relative inline-flex items-center justify-center gap-2 w-full lg:w-auto px-8 py-3.5 text-[var(--text-inverse)] font-semibold rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all overflow-hidden focus-ring whitespace-nowrap"
                    style={{ background: 'var(--accent-gradient)' }}
                  >
                    <Sparkles className="w-5 h-5" />
                    Start Creating for Free
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => router.push('/studio')}
                  leftIcon={<Sparkles className="w-5 h-5" />}
                  className="w-full lg:w-auto whitespace-nowrap"
                >
                  Create New Book
                </Button>
              </SignedIn>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => router.push('/showcase')}
                leftIcon={<Play className="w-5 h-5" />}
                className="w-full lg:w-auto whitespace-nowrap"
              >
                Browse Sample Books
              </Button>
            </div>

            {/* Trust bar — rating + counts + featured-in strip */}
            <TrustBar className="mb-6 mx-auto lg:mx-0 max-w-xl flex flex-col items-center lg:items-start" />

            {/* Export formats */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 text-xs text-[var(--text-muted)]">
              <span className="font-medium">Export to:</span>
              {[
                { icon: <FileText className="w-3 h-3" />, label: 'PDF' },
                { icon: <BookOpen className="w-3 h-3" />, label: 'EPUB' },
                { icon: <FileText className="w-3 h-3" />, label: 'DOCX' },
                { icon: <Headphones className="w-3 h-3" />, label: 'MP3' },
              ].map((fmt) => (
                <div
                  key={fmt.label}
                  className="flex items-center gap-1 px-2 py-1 bg-[var(--surface-hover)] rounded-md border border-[var(--border)]"
                >
                  {fmt.icon}
                  {fmt.label}
                </div>
              ))}
            </div>
          </Reveal>

          {/* ---------- Right column: live writing demo ---------- */}
          <Reveal as="div" delay={0.08} className="relative">
            <LiveWritingDemo genreIndex={currentWordIndex} />
          </Reveal>
        </div>

        {/* Stats — kept as a section divider; values use the gradient display face. */}
        <RevealStagger className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-12 border-t border-[var(--border)]">
          {[
            { value: '10K+', label: 'Books Created' },
            { value: '500M+', label: 'Words Generated' },
            { value: '50K+', label: 'Hours of Audio' },
            { value: '95%', label: 'Satisfaction' },
          ].map((stat) => (
            <RevealItem key={stat.label} className="text-center p-4">
              <div className="font-display text-4xl md:text-5xl text-gradient-accent mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-[var(--text-muted)]">{stat.label}</div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
