'use client';

import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { Testimonials } from '@/components/home/Testimonials';
import { PricingSection } from '@/components/home/PricingSection';
import { FAQSection } from '@/components/home/FAQSection';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-yellow-600 bg-black sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Logo size="md" />
            <nav className="hidden md:flex space-x-6">
              <a href="#features" className="text-gray-300 hover:text-white">Features</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-white">How It Works</a>
              <a href="#pricing" className="text-gray-300 hover:text-white">Pricing</a>
              <a href="/" className="text-yellow-400 hover:text-yellow-300 font-semibold">App</a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/library'}>
              Sign In
            </Button>
            <Button variant="primary" size="sm" onClick={() => window.location.href = '/'}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

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
      <footer className="border-t border-gray-800 py-12 bg-black">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="bg-yellow-400 text-black font-bold px-3 py-1 text-2xl inline-block mb-4">
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
                <li><a href="/" className="hover:text-white">App</a></li>
                <li><a href="/library" className="hover:text-white">Library</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Community</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
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
