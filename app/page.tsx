'use client';

import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { Testimonials } from '@/components/home/Testimonials';
import { PricingSection } from '@/components/home/PricingSection';
import { FAQSection } from '@/components/home/FAQSection';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <HeroSection />

      <div id="features">
        <FeaturesSection />
      </div>

      <div id="how-it-works">
        <HowItWorks />
      </div>

      <Testimonials />

      <div id="pricing">
        <PricingSection />
      </div>

      <FAQSection />

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-12 bg-[var(--background)]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="bg-[var(--accent)] text-[var(--text-inverse)] font-bold px-3 py-1.5 text-xl inline-block rounded-lg mb-4 shadow-sm">
                PW
              </div>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                AI-powered book generation platform. Write your next masterpiece in minutes.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4 text-sm uppercase tracking-wide">Product</h3>
              <ul className="space-y-2.5 text-[var(--text-muted)] text-sm">
                <li><a href="#features" className="hover:text-[var(--text-primary)] transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-[var(--text-primary)] transition-colors">Pricing</a></li>
                <li><a href="/browse" className="hover:text-[var(--text-primary)] transition-colors">Browse Books</a></li>
                <li><a href="/library" className="hover:text-[var(--text-primary)] transition-colors">My Library</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4 text-sm uppercase tracking-wide">Resources</h3>
              <ul className="space-y-2.5 text-[var(--text-muted)] text-sm">
                <li><a href="/studio" className="hover:text-[var(--text-primary)] transition-colors">Create Book</a></li>
                <li><a href="/showcase" className="hover:text-[var(--text-primary)] transition-colors">Showcase</a></li>
                <li><a href="#how-it-works" className="hover:text-[var(--text-primary)] transition-colors">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4 text-sm uppercase tracking-wide">Company</h3>
              <ul className="space-y-2.5 text-[var(--text-muted)] text-sm">
                <li><a href="#" className="hover:text-[var(--text-primary)] transition-colors">About</a></li>
                <li><a href="#" className="hover:text-[var(--text-primary)] transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-[var(--text-primary)] transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[var(--border)] pt-8 text-center text-[var(--text-muted)] text-sm">
            <p>&copy; 2025 PowerWrite. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
