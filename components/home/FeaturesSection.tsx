'use client';

import { 
  Cpu, 
  Zap, 
  Palette, 
  BookOpen, 
  PenTool, 
  Globe2, 
  Layers, 
  Download, 
  RefreshCw 
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

const features = [
  {
    icon: <Cpu className="w-6 h-6" />,
    title: 'AI-Powered Writing',
    description: 'Advanced AI generates compelling narratives, realistic dialogue, and engaging content tailored to your specifications.'
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Lightning Fast',
    description: 'Generate a complete 80,000-word novel in minutes, not months. Focus on creativity while AI handles the heavy lifting.'
  },
  {
    icon: <Palette className="w-6 h-6" />,
    title: 'Complete Customization',
    description: 'Control every aspect: genre, style, characters, plot, tone, and more. Make it truly yours.'
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: 'Multi-Genre Support',
    description: 'From sci-fi to romance, mystery to fantasy. AI adapts to any genre with appropriate conventions and tropes.'
  },
  {
    icon: <PenTool className="w-6 h-6" />,
    title: 'Style Flexibility',
    description: 'Choose POV, tense, pacing, dialogue density, and descriptive richness. Match any writing style you envision.'
  },
  {
    icon: <Globe2 className="w-6 h-6" />,
    title: 'World Building',
    description: 'Create rich, consistent worlds with detailed settings, cultures, and characters that feel alive.'
  },
  {
    icon: <Layers className="w-6 h-6" />,
    title: 'Chapter-by-Chapter',
    description: 'Generate outlines first, then produce chapters individually or all at once. Full control over the process.'
  },
  {
    icon: <Download className="w-6 h-6" />,
    title: 'Export Anywhere',
    description: 'Export your finished book as PDF, DOCX, or EPUB. Publish to Amazon, share with beta readers, or keep private.'
  },
  {
    icon: <RefreshCw className="w-6 h-6" />,
    title: 'Iterative Refinement',
    description: 'Not happy with a chapter? Regenerate it with different parameters. Refine until perfect.'
  }
];

export function FeaturesSection() {
  return (
    <section className="py-20 md:py-28 bg-[var(--background)]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text-primary)] mb-4">
            Everything you need to write
            <span className="text-[var(--accent)]"> amazing books</span>
          </h2>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            Powerful features designed to help you create professional-quality books with ease
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <Card
              key={index}
              variant="interactive"
              padding="md"
              className="group"
            >
              <div className="w-11 h-11 rounded-xl bg-[var(--accent-surface)] text-[var(--accent)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
