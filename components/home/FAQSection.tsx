'use client';

/**
 * FAQSection — searchable + categorized.
 *
 * Three changes vs the previous version:
 *   1. A small search input at the top filters questions in real time
 *      (matches against question + answer text, case-insensitive).
 *   2. Category pills (All / General / Pricing / Technical) narrow the
 *      list to a topic. Search and category compose — the results show
 *      the intersection.
 *   3. Each FAQ uses the `.disclosure` grid-rows trick from globals.css
 *      so the open/close animates smoothly without measuring height
 *      from JS. Honours `prefers-reduced-motion` (no transition).
 *
 * Empty state: when search/category yields nothing, we show a friendly
 * "no matches" panel with a "contact support" link instead of a void.
 */

import { useMemo, useState } from 'react';
import { ChevronDown, Mail, Search, X } from 'lucide-react';
import { Reveal } from '@/components/home/Reveal';

type Category = 'general' | 'pricing' | 'technical';

interface Faq {
  question: string;
  answer: string;
  category: Category;
}

const FAQS: Faq[] = [
  {
    category: 'general',
    question: 'How does AI book generation work?',
    answer:
      'PowerWrite uses advanced large language models trained on millions of books. You provide the configuration (genre, style, characters, plot), and the AI generates professional-quality content that follows narrative conventions and maintains consistency throughout your book.',
  },
  {
    category: 'general',
    question: 'Can I edit the generated content?',
    answer:
      'Absolutely. Think of the AI as your co-writer — generate a draft, then edit, refine, and personalize it. You can also regenerate specific chapters with different parameters at any time.',
  },
  {
    category: 'general',
    question: 'Who owns the copyright to AI-generated books?',
    answer:
      'You do. All content generated through PowerWrite belongs to you. You can publish, sell, or distribute your books however you like — including on Amazon KDP, traditional publishers, or your own site.',
  },
  {
    category: 'general',
    question: 'What genres can I write?',
    answer:
      "All major genres: Fiction (literary, commercial), Romance, Mystery/Thriller, Science Fiction, Fantasy, Horror, Historical Fiction, Young Adult, Children's Books, Non-Fiction, Business, Self-Help, and more.",
  },
  {
    category: 'general',
    question: 'Is the content plagiarism-free?',
    answer:
      'Yes. The AI generates original content based on patterns learned from training data, not by copying existing works. Each book is unique.',
  },
  {
    category: 'general',
    question: 'Can I collaborate with other writers?',
    answer:
      'Enterprise plans support team collaboration with multiple users, shared projects, version control, and commenting features.',
  },
  {
    category: 'pricing',
    question: 'Do you offer refunds?',
    answer:
      "Yes — we offer a full 30-day money-back guarantee, no questions asked. If you're not satisfied, email support and we'll process the refund the same day.",
  },
  {
    category: 'pricing',
    question: 'Can I use this for commercial purposes?',
    answer:
      'Yes, with Pro and Enterprise plans. You can publish and sell books generated with PowerWrite on any platform: Amazon, Kobo, Apple Books, Google Play Books, and more.',
  },
  {
    category: 'pricing',
    question: 'What happens after the 14-day free trial?',
    answer:
      "Your account stays on the Free plan unless you choose to upgrade. We don't auto-charge — you'll only ever be billed if you explicitly subscribe to Pro or Enterprise.",
  },
  {
    category: 'pricing',
    question: 'Can I switch plans later?',
    answer:
      'Yes — upgrade, downgrade, or cancel any time from your account settings. Annual subscribers can switch to monthly at the next renewal.',
  },
  {
    category: 'technical',
    question: 'How long does it take to generate a book?',
    answer:
      'A typical 80,000-word novel takes 5-15 minutes to generate, depending on server load and your quality settings. Longer books or higher quality modes may take longer.',
  },
  {
    category: 'technical',
    question: 'What formats can I export to?',
    answer:
      'Free plan: PDF. Pro and Enterprise: PDF, DOCX (Microsoft Word), EPUB (e-book format), and MP3 audio narration. All formats are properly typeset and ready for publishing.',
  },
  {
    category: 'technical',
    question: 'Where is my data stored?',
    answer:
      'Your books are stored encrypted at rest in our managed Postgres (Neon, EU and US regions). Audio assets sit on Vercel Blob with private ACLs by default. You can export and delete everything from your account settings at any time.',
  },
  {
    category: 'technical',
    question: 'Do you offer an API?',
    answer:
      'Yes — Enterprise customers get programmatic access to generation, export, and library APIs. Get in touch for documentation and rate-limit details.',
  },
];

const CATEGORIES: Array<{ id: 'all' | Category; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'general', label: 'General' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'technical', label: 'Technical' },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | Category>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.map((faq, originalIndex) => ({ faq, originalIndex })).filter(({ faq }) => {
      if (activeCategory !== 'all' && faq.category !== activeCategory) return false;
      if (!q) return true;
      return (
        faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q)
      );
    });
  }, [activeCategory, query]);

  return (
    <section className="py-20 md:py-28 bg-[var(--background)]">
      <div className="container mx-auto px-4">
        <Reveal as="div" className="text-center mb-10 md:mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">
            Help
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-[var(--text-primary)] mb-4 leading-[1.1]">
            Frequently asked{' '}
            <span className="font-display-italic text-gradient-accent">questions</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Search the answers, browse by category, or get in touch.
          </p>
        </Reveal>

        <div className="max-w-3xl mx-auto">
          {/* Search + tabs row */}
          <Reveal as="div" className="mb-6 space-y-4">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search questions…"
                aria-label="Search frequently asked questions"
                className="w-full pl-11 pr-10 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors focus-ring"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div
              role="tablist"
              aria-label="FAQ categories"
              className="flex flex-wrap gap-2 justify-center sm:justify-start"
            >
              {CATEGORIES.map((cat) => {
                const active = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setOpenIndex(null);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border transition-all focus-ring ${
                      active
                        ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-sm'
                        : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </Reveal>

          {/* Results */}
          {filtered.length > 0 ? (
            <ul className="space-y-3">
              {filtered.map(({ faq, originalIndex }) => {
                const isOpen = openIndex === originalIndex;
                return (
                  <li
                    key={faq.question}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden transition-colors hover:border-[var(--border-strong)]"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? null : originalIndex)}
                      className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-[var(--surface-hover)] transition-colors focus-ring rounded-xl"
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${originalIndex}`}
                    >
                      <span className="font-semibold text-[var(--text-primary)] text-sm md:text-base">
                        {faq.question}
                      </span>
                      <span
                        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isOpen
                            ? 'bg-[var(--accent)] text-white rotate-180'
                            : 'bg-[var(--surface-hover)] text-[var(--text-secondary)]'
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    </button>

                    {/* `.disclosure` animates grid-template-rows from 0fr → 1fr.
                        Wrapper is always rendered for smooth reveal. */}
                    <div
                      id={`faq-panel-${originalIndex}`}
                      className="disclosure"
                      data-open={isOpen ? 'true' : 'false'}
                    >
                      <div className="disclosure-content">
                        <div className="px-5 pb-5 pt-0">
                          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Reveal
              as="div"
              className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-8 text-center"
            >
              <Search className="w-8 h-8 mx-auto text-[var(--text-muted)] mb-3" strokeWidth={1.5} />
              <p className="text-sm text-[var(--text-secondary)] mb-1">
                No matches for{' '}
                <span className="font-semibold text-[var(--text-primary)]">
                  &ldquo;{query}&rdquo;
                </span>
                {activeCategory !== 'all' && (
                  <>
                    {' '}
                    in <span className="font-semibold">{activeCategory}</span>
                  </>
                )}
                .
              </p>
              <p className="text-xs text-[var(--text-muted)] mb-4">
                Try a different search, or reach out — we usually reply within a few hours.
              </p>
              <a
                href="mailto:support@powerwrite.ai"
                className="inline-flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent-hover)] font-semibold text-sm transition-colors"
              >
                <Mail className="w-4 h-4" />
                Contact support
              </a>
            </Reveal>
          )}
        </div>

        <Reveal as="div" className="text-center mt-12" delay={0.05}>
          <p className="text-[var(--text-muted)] mb-3 text-sm">Still have questions?</p>
          <a
            href="mailto:support@powerwrite.ai"
            className="inline-flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent-hover)] font-semibold text-sm transition-colors"
          >
            <Mail className="w-4 h-4" />
            Contact our support team
          </a>
        </Reveal>
      </div>
    </section>
  );
}
