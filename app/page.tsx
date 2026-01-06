'use client';

import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { Testimonials } from '@/components/home/Testimonials';
import { PricingSection } from '@/components/home/PricingSection';
import { FAQSection } from '@/components/home/FAQSection';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <HeroSection />

      {/* Features */}
      <div id="features">
        <FeaturesSection />
      </div>

      {/* How It Works */}
      <div id="how-it-works">
        <HowItWorks />
      </div>

      {/* Testimonials */}
      <Testimonials />

      {/* Pricing */}
      <div id="pricing">
        <PricingSection />
      </div>

      {/* FAQ */}
      <FAQSection />

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 bg-black" style={{ fontFamily: 'var(--font-nav)' }}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="bg-yellow-400 text-black font-bold px-3 py-1 text-2xl inline-block mb-4" style={{ boxShadow: 'var(--shadow-card)' }}>
                PW
              </div>
              <p className="text-gray-400 text-sm">
                AI-powered book generation platform. Write your next masterpiece in minutes.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="/browse" className="hover:text-white">Browse Books</a></li>
                <li><a href="/library" className="hover:text-white">My Library</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="/studio" className="hover:text-white">Create Book</a></li>
                <li><a href="/showcase" className="hover:text-white">Showcase</a></li>
                <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>© 2025 PowerWrite. All rights reserved. Create amazing books with AI.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
