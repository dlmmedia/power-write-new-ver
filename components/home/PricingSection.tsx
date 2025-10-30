'use client';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

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
      'Community support'
    ],
    cta: 'Get Started',
    popular: false
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
      'Email support'
    ],
    cta: 'Start Free Trial',
    popular: true
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
      'SLA guarantee'
    ],
    cta: 'Contact Sales',
    popular: false
  }
];

export function PricingSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, <span className="text-yellow-400">Transparent</span> Pricing
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Choose the plan that fits your writing goals. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-gray-900 rounded-lg p-8 ${
                plan.popular
                  ? 'border-2 border-yellow-400 shadow-xl shadow-yellow-400/20'
                  : 'border border-gray-800'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge variant="warning" size="lg">
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Plan Name */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-yellow-400">
                    {plan.price}
                  </span>
                  <span className="text-gray-400">
                    {plan.period}
                  </span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <span className="text-yellow-400 flex-shrink-0 mt-1">✓</span>
                    <span className="text-gray-300">{feature}</span>
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
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12">
          <p className="text-gray-400">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}
