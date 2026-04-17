'use client';

/**
 * PricingSection — three plans, billing toggle, animated gradient
 * border on the popular tier, comparison table underneath.
 *
 * What changed from the previous version:
 *   - Top: `BillingToggle` (Monthly / Annual save 20%). Annual prices
 *     are derived (monthly × 12 × 0.8) and shown in the same slot, so
 *     the layout doesn't shift when toggling.
 *   - Middle: cards lose their flat amber border — the popular Pro
 *     tier now wears a slowly-rotating conic gradient ring
 *     (`.gradient-border` in globals.css). All three cards share the
 *     same surface treatment so the hierarchy comes from typography
 *     and the ring, not from heavy shadows.
 *   - Inline money-back guarantee badge below the cards.
 *   - Below: the side-by-side `ComparisonTable` against Sudowrite,
 *     NovelAI, ChatGPT.
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Check, ShieldCheck, Sparkles } from 'lucide-react';
import { Reveal, RevealStagger, RevealItem } from '@/components/home/Reveal';
import { BillingToggle, type BillingPeriod } from './pricing/BillingToggle';
import { ComparisonTable } from './pricing/ComparisonTable';

interface Plan {
  name: string;
  /** Monthly price in USD. `null` = custom (Enterprise). 0 = Free. */
  monthlyPrice: number | null;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    monthlyPrice: 0,
    description: 'Perfect for testing the waters',
    features: [
      '1 book per month',
      'Up to 20 chapters',
      'Max 50,000 words per book',
      'All genres and styles',
      'PDF export only',
      'Community support',
    ],
    cta: 'Get Started',
  },
  {
    name: 'Pro',
    monthlyPrice: 29,
    description: 'For authors shipping books',
    features: [
      'Unlimited books',
      'Unlimited chapters',
      'Up to 200,000 words per book',
      'PDF, DOCX, EPUB, MP3 export',
      'Audio narration · 12 voices',
      'Priority generation queue',
      'Advanced AI settings',
      'Email support',
    ],
    cta: 'Start 14-day Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    monthlyPrice: null,
    description: 'For publishers and teams',
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'Custom AI training',
      'API access',
      'Bulk generation',
      'White-label options',
      'Dedicated account manager',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
  },
];

const ANNUAL_DISCOUNT = 0.2; // 20% off

export function PricingSection() {
  const [period, setPeriod] = useState<BillingPeriod>('annual');

  return (
    <section className="py-20 md:py-28 bg-[var(--background-secondary)]">
      <div className="container mx-auto px-4">
        <Reveal as="div" className="text-center mb-10 md:mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">
            Plans
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-[var(--text-primary)] mb-4 leading-[1.1]">
            Simple,{' '}
            <span className="font-display-italic text-gradient-accent">transparent</span> pricing
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            One price. No per-word charges. Cancel any time.
          </p>
        </Reveal>

        <Reveal as="div" className="flex justify-center mb-10 md:mb-14">
          <BillingToggle value={period} onChange={setPeriod} />
        </Reveal>

        <RevealStagger className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {PLANS.map((plan) => (
            <RevealItem key={plan.name} className="h-full flex">
              <PlanCard plan={plan} period={period} />
            </RevealItem>
          ))}
        </RevealStagger>

        {/* Money-back guarantee + trial copy */}
        <Reveal as="div" className="mt-10 md:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--success)]" />
            <span>
              <span className="font-semibold text-[var(--text-primary)]">30-day</span> money-back
              guarantee
            </span>
          </span>
          <span aria-hidden="true" className="hidden sm:inline-block w-1 h-1 rounded-full bg-[var(--border-strong)]" />
          <span>14-day free trial · No credit card required</span>
        </Reveal>

        {/* Comparison */}
        <ComparisonTable />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Plan card                                                                  */
/* -------------------------------------------------------------------------- */

function PlanCard({ plan, period }: { plan: Plan; period: BillingPeriod }) {
  const { displayPrice, displayPeriod, sub } = useMemo(
    () => formatPrice(plan, period),
    [plan, period],
  );

  return (
    <div className={`relative h-full w-full flex ${plan.popular ? 'gradient-border rounded-2xl' : ''}`}>
      <Card
        variant={plan.popular ? 'elevated' : 'default'}
        padding="lg"
        className={`relative flex flex-col w-full h-full rounded-2xl ${
          plan.popular
            ? 'md:-mt-2 md:mb-2 shadow-[0_30px_60px_-30px_var(--accent-surface)]'
            : ''
        }`}
      >
        {plan.popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest text-white shadow-md"
                 style={{ background: 'var(--accent-gradient)' }}>
              <Sparkles className="w-3 h-3" />
              Most Popular
            </div>
          </div>
        )}

        <div className="text-center mb-6 mt-2">
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-1">{plan.name}</h3>
          <p className="text-sm text-[var(--text-muted)]">{plan.description}</p>
        </div>

        <div className="text-center mb-2 min-h-[5rem]">
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="font-display text-5xl text-gradient-accent leading-none">
              {displayPrice}
            </span>
            {displayPeriod && (
              <span className="text-sm text-[var(--text-muted)]">{displayPeriod}</span>
            )}
          </div>
          {sub && (
            <div className="mt-2 text-xs text-[var(--text-muted)]">{sub}</div>
          )}
        </div>

        <Button
          variant={plan.popular ? 'primary' : 'outline'}
          className="w-full mt-6 mb-7"
          size="lg"
        >
          {plan.cta}
        </Button>

        <ul className="space-y-3 flex-1">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <span
                className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 ${
                  plan.popular
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--success-light)] text-[var(--success)]'
                }`}
              >
                <Check className="w-2.5 h-2.5" strokeWidth={3.5} />
              </span>
              <span className="text-sm text-[var(--text-secondary)]">{feature}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pricing math                                                               */
/* -------------------------------------------------------------------------- */

function formatPrice(plan: Plan, period: BillingPeriod) {
  if (plan.monthlyPrice === null) {
    return { displayPrice: 'Custom', displayPeriod: '', sub: 'Talk to sales' };
  }
  if (plan.monthlyPrice === 0) {
    return { displayPrice: '$0', displayPeriod: 'forever', sub: 'No card required' };
  }
  if (period === 'monthly') {
    return {
      displayPrice: `$${plan.monthlyPrice}`,
      displayPeriod: '/ mo',
      sub: 'Billed monthly',
    };
  }
  // Annual: 20% off, displayed as the *equivalent* monthly to keep the
  // headline number readable at a glance, with the real annual total
  // beneath it.
  const annualTotal = Math.round(plan.monthlyPrice * 12 * (1 - ANNUAL_DISCOUNT));
  const effectiveMonthly = (annualTotal / 12).toFixed(2).replace(/\.00$/, '');
  return {
    displayPrice: `$${effectiveMonthly}`,
    displayPeriod: '/ mo',
    sub: `$${annualTotal} billed annually · save 20%`,
  };
}
