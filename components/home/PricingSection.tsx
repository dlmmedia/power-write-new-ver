'use client';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for testing and learning',
    features: [
      '1 book per month',
      'Up to 20 chapters',
      'Max 50,000 words per book',
      'All genres and styles',
      'PDF export only',
      'Community support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: 'per month',
    description: 'For serious authors',
    features: [
      'Unlimited books',
      'Unlimited chapters',
      'Up to 200,000 words per book',
      'All genres and styles',
      'PDF, DOCX, EPUB export',
      'Priority generation queue',
      'Advanced AI settings',
      'Email support',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    description: 'For publishers and teams',
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'Custom AI training',
      'API access',
      'Bulk generation',
      'White-label options',
      'Dedicated account manager',
      '24/7 phone support',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section className="py-20 md:py-28 bg-[var(--background-secondary)]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text-primary)] mb-4">
            Simple,{' '}
            <span className="text-[var(--accent)]">Transparent</span> Pricing
          </h2>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            Choose the plan that fits your writing goals. Upgrade, downgrade, or
            cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
          {plans.map((plan, index) => (
            <Card
              key={index}
              variant={plan.popular ? 'elevated' : 'default'}
              padding="lg"
              className={`relative flex flex-col ${
                plan.popular
                  ? 'border-2 border-[var(--accent)] shadow-[0_0_30px_var(--accent)]/10 md:-mt-4 md:mb-4'
                  : ''
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge variant="warning" size="lg">
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Plan Name */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-[var(--text-muted)]">
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold text-[var(--accent)]">
                    {plan.price}
                  </span>
                  <span className="text-sm text-[var(--text-muted)]">
                    {plan.period}
                  </span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[var(--text-secondary)]">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                variant={plan.popular ? 'primary' : 'outline'}
                className="w-full"
                size="lg"
              >
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12">
          <p className="text-sm text-[var(--text-muted)]">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}
