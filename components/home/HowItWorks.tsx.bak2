'use client';

import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

const steps = [
  {
    number: 1,
    title: 'Configure Your Book',
    description: 'Set up basic details: title, author, genre, target word count, and number of chapters. Add characters and world-building details.',
    icon: '⚙️'
  },
  {
    number: 2,
    title: 'Define Style & Voice',
    description: 'Choose writing style, POV, narrative tense, pacing, and tone. Fine-tune dialogue style and descriptive density.',
    icon: '✍️'
  },
  {
    number: 3,
    title: 'Generate Outline',
    description: 'AI creates a comprehensive chapter-by-chapter outline with plot points and structure. Review and edit as needed.',
    icon: '📋'
  },
  {
    number: 4,
    title: 'Create Your Book',
    description: 'Generate the complete manuscript. AI writes each chapter following your specifications and outline.',
    icon: '📚'
  },
  {
    number: 5,
    title: 'Export & Publish',
    description: 'Download your finished book in multiple formats (PDF, DOCX, EPUB). Ready to publish or share immediately.',
    icon: '🚀'
  }
];

export function HowItWorks() {
  const router = useRouter();

  return (
    <section className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It <span className="text-yellow-400">Works</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            From idea to finished book in 5 simple steps
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative mb-12 last:mb-0">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-8 top-20 w-0.5 h-full bg-gradient-to-b from-yellow-400 to-transparent" />
              )}

              <div className="flex items-start gap-6">
                {/* Number Badge */}
                <div className="flex-shrink-0 w-16 h-16 bg-yellow-400 text-black rounded-full flex items-center justify-center text-2xl font-bold shadow-lg shadow-yellow-400/50 relative z-10">
                  {step.number}
                </div>

                {/* Content */}
                <div className="flex-1 bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-yellow-400 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{step.icon}</span>
                    <h3 className="text-2xl font-bold text-white">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-gray-400 text-lg">
                    {step.description}
                  </p>
                </div>
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
            className="text-lg px-10 py-4"
          >
            Get Started Now →
          </Button>
        </div>
      </div>
    </section>
  );
}
