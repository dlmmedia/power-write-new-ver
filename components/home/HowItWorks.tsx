'use client';

/**
 * HowItWorks — 5-step "process" section.
 *
 * Two presentations, swapped purely by viewport:
 *   - Mobile / tablet (< lg): the original vertical card list with a
 *     connector line. Reads naturally on a phone where horizontal
 *     scroll feels unnatural inside a vertical-flowing page.
 *   - Desktop (lg+): a horizontal "film strip" of device-frame
 *     mockups (`ProcessFilmStrip`) — each step is shown as a
 *     stylised in-app screen with its own description and number.
 */

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import {
  SlidersHorizontal,
  Palette,
  ListChecks,
  Wand2,
  Rocket,
  ArrowRight,
} from 'lucide-react';
import { type ReactNode } from 'react';
import { Reveal, RevealStagger, RevealItem } from '@/components/home/Reveal';
import { ProcessFilmStrip } from '@/components/home/process/ProcessFilmStrip';
import type { StepVariant } from '@/components/home/process/StepMockup';

interface Step {
  number: number;
  title: string;
  description: string;
  icon: ReactNode;
  variant: StepVariant;
}

const steps: Step[] = [
  {
    number: 1,
    title: 'Configure Your Book',
    description:
      'Set up basic details: title, author, genre, target word count, and number of chapters. Add characters and world-building details.',
    icon: <SlidersHorizontal className="w-5 h-5" />,
    variant: 'configure',
  },
  {
    number: 2,
    title: 'Define Style & Voice',
    description:
      'Choose writing style, POV, narrative tense, pacing, and tone. Fine-tune dialogue style and descriptive density.',
    icon: <Palette className="w-5 h-5" />,
    variant: 'style',
  },
  {
    number: 3,
    title: 'Generate Outline',
    description:
      'AI creates a comprehensive chapter-by-chapter outline with plot points and structure. Review and edit as needed.',
    icon: <ListChecks className="w-5 h-5" />,
    variant: 'outline',
  },
  {
    number: 4,
    title: 'Create Your Book',
    description:
      'Generate the complete manuscript. AI writes each chapter following your specifications and outline.',
    icon: <Wand2 className="w-5 h-5" />,
    variant: 'generate',
  },
  {
    number: 5,
    title: 'Export & Publish',
    description:
      'Download your finished book in multiple formats (PDF, DOCX, EPUB). Ready to publish or share immediately.',
    icon: <Rocket className="w-5 h-5" />,
    variant: 'export',
  },
];

export function HowItWorks() {
  const router = useRouter();

  return (
    <section className="relative py-20 md:py-28 bg-[var(--background)] overflow-hidden">
      {/* Subtle accent glow */}
      <div className="absolute inset-x-0 pointer-events-none">
        <div
          className="mx-auto w-96 h-48 rounded-full blur-[120px] opacity-10"
          style={{ background: 'var(--accent)' }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <Reveal as="div" className="text-center mb-12 md:mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">
            The process
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-[var(--text-primary)] mb-4 leading-[1.1]">
            How it <span className="font-display-italic text-gradient-accent">works</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            From idea to finished book in 5 simple steps.
          </p>
        </Reveal>

        {/* Desktop: horizontal film strip */}
        <Reveal as="div" className="hidden lg:block">
          <ProcessFilmStrip steps={steps} />
        </Reveal>

        {/* Mobile / tablet: vertical card list with connector line */}
        <RevealStagger className="lg:hidden max-w-3xl mx-auto">
          {steps.map((step, index) => (
            <RevealItem key={step.number} className="relative mb-8 last:mb-0 group">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className="absolute left-7 top-[4.5rem] w-px h-[calc(100%-1rem)] bg-gradient-to-b from-[var(--accent)]/40 to-[var(--border)]"
                />
              )}

              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[var(--accent-surface)] border-2 border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] font-bold text-lg relative z-10 group-hover:border-[var(--accent)] transition-all duration-300">
                  {step.number}
                </div>

                <Card variant="interactive" padding="md" className="flex-1 group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-surface)] text-[var(--accent)] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      {step.icon}
                    </div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed pl-[3.25rem]">
                    {step.description}
                  </p>
                </Card>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>

        <Reveal as="div" className="text-center mt-12 md:mt-16" delay={0.05}>
          <Button
            variant="primary"
            size="lg"
            onClick={() => router.push('/studio')}
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            Get Started Now
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
