'use client';

import { useState } from 'react';

const faqs = [
  {
    question: 'How does AI book generation work?',
    answer: 'PowerWrite uses advanced large language models trained on millions of books. You provide the configuration (genre, style, characters, plot), and the AI generates professional-quality content that follows narrative conventions and maintains consistency throughout your book.'
  },
  {
    question: 'Can I edit the generated content?',
    answer: 'Absolutely! Think of AI as your co-writer. Generate content, then edit, refine, and personalize it. You can also regenerate specific chapters with different parameters if needed.'
  },
  {
    question: 'Who owns the copyright to AI-generated books?',
    answer: 'You do! All content generated through PowerWrite belongs to you. You can publish, sell, or distribute your books however you like, including on Amazon KDP, other platforms, or traditional publishing.'
  },
  {
    question: 'What genres can I write?',
    answer: 'All major genres: Fiction (literary, commercial), Romance, Mystery/Thriller, Science Fiction, Fantasy, Horror, Historical Fiction, Young Adult, Children\'s Books, Non-Fiction, Business, Self-Help, and more.'
  },
  {
    question: 'How long does it take to generate a book?',
    answer: 'A typical 80,000-word novel takes 5-15 minutes to generate, depending on server load and your quality settings. Longer books or higher quality modes may take longer.'
  },
  {
    question: 'Is the content plagiarism-free?',
    answer: 'Yes! The AI generates original content based on patterns learned from training data, not by copying existing works. Each book is unique.'
  },
  {
    question: 'Can I use this for commercial purposes?',
    answer: 'Yes, with Pro and Enterprise plans. You can publish and sell books generated with PowerWrite on any platform, including Amazon, Kobo, Apple Books, etc.'
  },
  {
    question: 'What formats can I export to?',
    answer: 'Free plan: PDF. Pro and Enterprise: PDF, DOCX (Microsoft Word), and EPUB (e-book format). All formats are properly formatted and ready for publishing.'
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Yes! If you\'re not satisfied within the first 30 days, we offer a full refund, no questions asked. We want you to love PowerWrite.'
  },
  {
    question: 'Can I collaborate with other writers?',
    answer: 'Enterprise plans support team collaboration with multiple users, shared projects, version control, and commenting features.'
  }
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-header)', letterSpacing: 'var(--letter-spacing-header)' }}>
            Frequently Asked <span className="text-yellow-400">Questions</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-nav)' }}>
            Everything you need to know about PowerWrite
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-yellow-400 transition-all"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-gray-800/50 transition-colors"
              >
                <span className="font-semibold text-lg text-white" style={{ fontFamily: 'var(--font-nav)' }}>
                  {faq.question}
                </span>
                <span className={`text-yellow-400 text-2xl flex-shrink-0 transition-transform ${
                  openIndex === index ? 'rotate-180' : ''
                }`}>
                  ▼
                </span>
              </button>

              {openIndex === index && (
                <div className="px-6 pb-5 pt-2">
                  <p className="text-gray-300 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Additional Help */}
        <div className="text-center mt-12">
          <p className="text-gray-400 mb-4">
            Still have questions?
          </p>
          <a
            href="mailto:support@powerwrite.ai"
            className="text-yellow-400 hover:text-yellow-300 font-semibold"
          >
            Contact our support team →
          </a>
        </div>
      </div>
    </section>
  );
}
