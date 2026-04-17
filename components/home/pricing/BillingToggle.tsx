'use client';

/**
 * BillingToggle — segmented control for Monthly vs Annual billing.
 *
 * Visual style: pill with a sliding amber capsule that smoothly tracks
 * the active option using transform — no layout-trigger reflow.
 * The "save 20%" badge is anchored to the Annual option so the offer
 * stays visible even when Monthly is selected.
 */

import { type Dispatch, type SetStateAction } from 'react';

export type BillingPeriod = 'monthly' | 'annual';

interface BillingToggleProps {
  value: BillingPeriod;
  onChange: Dispatch<SetStateAction<BillingPeriod>> | ((next: BillingPeriod) => void);
  className?: string;
  /** Discount label on the Annual side, defaults to "Save 20%". */
  annualSavingsLabel?: string;
}

export function BillingToggle({
  value,
  onChange,
  className = '',
  annualSavingsLabel = 'Save 20%',
}: BillingToggleProps) {
  const handleChange = (next: BillingPeriod) => {
    if (next === value) return;
    onChange(next);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Billing period"
      className={`relative inline-flex items-center gap-1 p-1 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] shadow-inner ${className}`}
    >
      {/* Sliding active capsule */}
      <span
        aria-hidden="true"
        className="absolute top-1 bottom-1 left-1 rounded-full bg-[var(--surface)] shadow-sm transition-transform duration-300 ease-out"
        style={{
          width: 'calc(50% - 0.25rem)',
          transform: value === 'annual' ? 'translateX(calc(100% + 0.5rem))' : 'translateX(0)',
        }}
      />

      <button
        type="button"
        role="radio"
        aria-checked={value === 'monthly'}
        onClick={() => handleChange('monthly')}
        className={`relative z-10 px-5 py-2 rounded-full text-sm font-semibold transition-colors focus-ring ${
          value === 'monthly' ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
        }`}
      >
        Monthly
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={value === 'annual'}
        onClick={() => handleChange('annual')}
        className={`relative z-10 px-5 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-2 transition-colors focus-ring ${
          value === 'annual' ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
        }`}
      >
        Annual
        <span
          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-colors ${
            value === 'annual'
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--accent-surface)] text-[var(--accent-text)] border border-[var(--accent)]/30'
          }`}
        >
          {annualSavingsLabel}
        </span>
      </button>
    </div>
  );
}
