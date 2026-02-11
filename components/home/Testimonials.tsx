'use client';

import { Card } from '@/components/ui/Card';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'First-Time Author',
    initials: 'SM',
    rating: 5,
    text: "I've always wanted to write a novel but never had the time. PowerWrite helped me create a 90,000-word fantasy epic in just two days. The quality is incredible!",
  },
  {
    name: 'James Chen',
    role: 'Indie Publisher',
    initials: 'JC',
    rating: 5,
    text: "As someone who publishes multiple books a month, PowerWrite has been a game-changer. The AI understands genre conventions perfectly.",
  },
  {
    name: 'Maria Rodriguez',
    role: 'Writing Teacher',
    initials: 'MR',
    rating: 5,
    text: "I use PowerWrite to help my students understand story structure. Being able to generate outlines and see them executed is invaluable for teaching.",
  },
  {
    name: 'David Thompson',
    role: 'Self-Published Author',
    initials: 'DT',
    rating: 5,
    text: "The level of customization is amazing. I can control everything from POV to dialogue style. My AI-generated mystery novel just hit #1 in its category!",
  },
  {
    name: 'Emily Parker',
    role: 'Content Creator',
    initials: 'EP',
    rating: 5,
    text: "PowerWrite doesn't just generate words — it creates compelling narratives with character development and emotional depth. Highly recommend!",
  },
  {
    name: 'Michael Lee',
    role: 'Business Author',
    initials: 'ML',
    rating: 5,
    text: "I needed to publish a business book quickly. PowerWrite helped me create a professional, well-structured manuscript in record time.",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 md:py-28 bg-[var(--background-secondary)]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text-primary)] mb-4">
            Loved by <span className="text-[var(--accent)]">Authors</span>
          </h2>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            See what writers are saying about PowerWrite
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              variant="interactive"
              padding="md"
              className="group flex flex-col"
            >
              {/* Quote icon + Rating */}
              <div className="flex items-center justify-between mb-4">
                <Quote className="w-5 h-5 text-[var(--accent)]/40" />
                <div className="flex gap-0.5">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-[var(--accent)] fill-[var(--accent)]"
                    />
                  ))}
                </div>
              </div>

              {/* Testimonial Text */}
              <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed flex-1">
                &ldquo;{testimonial.text}&rdquo;
              </p>

              {/* Author Info */}
              <div className="flex items-center gap-3 pt-4 border-t border-[var(--border-subtle)]">
                <div className="w-10 h-10 rounded-full bg-[var(--accent-surface)] text-[var(--accent)] flex items-center justify-center text-sm font-bold">
                  {testimonial.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                    {testimonial.name}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
