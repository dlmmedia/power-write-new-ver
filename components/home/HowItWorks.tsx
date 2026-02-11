'use client';

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

interface Step {
  number: number;
  title: string;
  description: string;
  icon: ReactNode;
}

const steps: Step[] = [
  {
    number: 1,
    title: 'Configure Your Book',
    description:
      'Set up basic details: title, author, genre, target word count, and number of chapters. Add characters and world-building details.',
    icon: <SlidersHorizontal className="w-6 h-6" />,
  },
  {
    number: 2,
    title: 'Define Style & Voice',
    description:
      'Choose writing style, POV, narrative tense, pacing, and tone. Fine-tune dialogue style and descriptive density.',
    icon: <Palette className="w-6 h-6" />,
  },
  {
    number: 3,
    title: 'Generate Outline',
    description:
      'AI creates a comprehensive chapter-by-chapter outline with plot points and structure. Review and edit as needed.',
    icon: <ListChecks className="w-6 h-6" />,
  },
  {
    number: 4,
    title: 'Create Your Book',
    description:
      'Generate the complete manuscript. AI writes each chapter following your specifications and outline.',
    icon: <Wand2 className="w-6 h-6" />,
  },
  {
    number: 5,
    title: 'Export & Publish',
    description:
      'Download your finished book in multiple formats (PDF, DOCX, EPUB). Ready to publish or share immediately.',
    icon: <Rocket className="w-6 h-6" />,
  },
];

export function HowItWorks() {
  const router = useRouter();

  return (
    <section className="py-20 md:py-28 bg-[var(--background)]">
      {/* Subtle accent glow */}
      <div className="absolute inset-x-0 pointer-events-none">
        <div
          className="mx-auto w-96 h-48 rounded-full blur-[120px] opacity-10"
          style={{ background: 'var(--accent)' }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text-primary)] mb-4">
            How It <span className="text-[var(--accent)]">Works</span>
          </h2>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            From idea to finished book in 5 simple steps
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative mb-8 last:mb-0 group">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-7 top-[4.5rem] w-px h-[calc(100%-1rem)] bg-gradient-to-b from-[var(--accent)]/40 to-[var(--border)]" />
              )}

              <div className="flex items-start gap-5">
                {/* Number Badge */}
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[var(--accent-surface)] border-2 border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] font-bold text-lg relative z-10 group-hover:border-[var(--accent)] group-hover:shadow-[0_0_16px_var(--accent)]/15 transition-all duration-300">
                  {step.number}
                </div>

                {/* Content Card */}
                <Card
                  variant="interactive"
                  padding="md"
                  className="flex-1 group"
                >
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
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Button
            variant="primary"
            size="lg"
            onClick={() => router.push('/studio')}
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            Get Started Now
          </Button>
        </div>
      </div>
    </section>
  );
}
