'use client';

import dynamic from 'next/dynamic';

import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { ScrollProgress } from '@/components/home/ScrollProgress';
import { SectionDivider } from '@/components/home/SectionDivider';

/* Below-the-fold sections are split into their own chunks so the initial
 * JS bundle stays small and the hero / features paint quickly.
 *
 * `ssr: true` (the default) keeps the markup in the server-rendered HTML
 * for SEO and content visibility before hydration — only the JS that
 * makes them interactive is deferred. The `loading` placeholders reserve
 * vertical space so deferred chunks don't shift the page when they
 * arrive (CLS = 0). */

const Testimonials = dynamic(
  () => import('@/components/home/Testimonials').then((m) => m.Testimonials),
  { loading: () => <SectionPlaceholder minHeight="40rem" /> },
);

const PricingSection = dynamic(
  () => import('@/components/home/PricingSection').then((m) => m.PricingSection),
  { loading: () => <SectionPlaceholder minHeight="64rem" /> },
);

const FAQSection = dynamic(
  () => import('@/components/home/FAQSection').then((m) => m.FAQSection),
  { loading: () => <SectionPlaceholder minHeight="48rem" /> },
);

const FinalCTA = dynamic(
  () => import('@/components/home/FinalCTA').then((m) => m.FinalCTA),
  { loading: () => <SectionPlaceholder minHeight="32rem" /> },
);

const SiteFooter = dynamic(
  () => import('@/components/home/SiteFooter').then((m) => m.SiteFooter),
  { loading: () => <SectionPlaceholder minHeight="24rem" /> },
);

function SectionPlaceholder({ minHeight }: { minHeight: string }) {
  return (
    <div
      aria-hidden="true"
      className="bg-[var(--background)]"
      style={{ minHeight }}
    />
  );
}

export default function HomePage() {
  return (
    <>
      <ScrollProgress />

      <main
        id="main-content"
        className="min-h-screen bg-[var(--background)] text-[var(--foreground)]"
      >
        <HeroSection />

        <section id="features" aria-label="Features">
          <FeaturesSection />
        </section>

        <section id="how-it-works" aria-label="How it works">
          <HowItWorks />
        </section>

        <Testimonials />

        <section id="pricing" aria-label="Pricing">
          <PricingSection />
        </section>

        <SectionDivider />

        <FAQSection />

        <FinalCTA />

        <SiteFooter />
      </main>
    </>
  );
}
