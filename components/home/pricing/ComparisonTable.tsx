'use client';

/**
 * ComparisonTable — "How does PowerWrite compare?"
 *
 * Five rows × four columns (PowerWrite + 3 alternatives). PowerWrite
 * column is highlighted with a subtle accent surface and a "winner"
 * checkmark style; competitor cells use neutral icons (check / dash /
 * minus). The table works as a *responsive grid*, not a real <table>,
 * so it doesn't get squashed on mobile — it switches to a stacked
 * card-per-product layout on small screens (rows become rows-within-
 * card).
 */

import { Check, Minus, Sparkles } from 'lucide-react';
import { Reveal } from '@/components/home/Reveal';
import { type ReactNode } from 'react';

type Cell = string | { value: string; tone?: 'good' | 'meh' | 'bad' };

interface Product {
  id: string;
  name: string;
  highlight?: boolean;
  tagline?: string;
}

interface Row {
  feature: string;
  helper?: string;
  values: Record<string, Cell>;
}

const PRODUCTS: Product[] = [
  { id: 'pw', name: 'PowerWrite', highlight: true, tagline: 'Built for full books' },
  { id: 'sudo', name: 'Sudowrite' },
  { id: 'novelai', name: 'NovelAI' },
  { id: 'chatgpt', name: 'ChatGPT' },
];

const ROWS: Row[] = [
  {
    feature: 'Long-form coherence',
    helper: 'Holds plot & voice across 80k+ words',
    values: {
      pw: { value: 'Up to 200k words', tone: 'good' },
      sudo: { value: '~30k', tone: 'meh' },
      novelai: { value: '~25k', tone: 'meh' },
      chatgpt: { value: 'Manual stitching', tone: 'bad' },
    },
  },
  {
    feature: 'Audio narration',
    helper: 'Studio-quality MP3 export',
    values: {
      pw: { value: '12 voices, MP3', tone: 'good' },
      sudo: { value: '—', tone: 'bad' },
      novelai: { value: '—', tone: 'bad' },
      chatgpt: { value: '—', tone: 'bad' },
    },
  },
  {
    feature: 'Export formats',
    helper: 'Print- and store-ready files',
    values: {
      pw: { value: 'PDF · EPUB · DOCX · MP3', tone: 'good' },
      sudo: { value: 'DOCX', tone: 'meh' },
      novelai: { value: 'TXT', tone: 'bad' },
      chatgpt: { value: 'Copy-paste', tone: 'bad' },
    },
  },
  {
    feature: 'Iteration speed',
    helper: 'Regenerate a chapter with new params',
    values: {
      pw: { value: 'One click', tone: 'good' },
      sudo: { value: 'Per paragraph', tone: 'meh' },
      novelai: { value: 'Token-by-token', tone: 'meh' },
      chatgpt: { value: 'Re-prompt manually', tone: 'bad' },
    },
  },
  {
    feature: 'Pricing',
    helper: 'For unlimited generation',
    values: {
      pw: { value: '$29 / mo', tone: 'good' },
      sudo: { value: '$29 / mo', tone: 'meh' },
      novelai: { value: '$25 / mo', tone: 'meh' },
      chatgpt: { value: '$20 / mo + manual', tone: 'meh' },
    },
  },
];

export function ComparisonTable() {
  return (
    <Reveal as="div" className="max-w-6xl mx-auto mt-16 md:mt-24">
      <div className="text-center mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-3">
          Side-by-side
        </p>
        <h3 className="font-display text-3xl md:text-4xl text-[var(--text-primary)] leading-[1.15]">
          How PowerWrite{' '}
          <span className="font-display-italic text-gradient-accent">compares</span>
        </h3>
        <p className="mt-3 text-[var(--text-secondary)] max-w-xl mx-auto">
          The shortlist most authors evaluate. Here&apos;s where PowerWrite wins, and where it
          doesn&apos;t.
        </p>
      </div>

      {/* Desktop / tablet — true grid */}
      <div className="hidden md:block rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] overflow-hidden">
        <div
          className="grid"
          style={{ gridTemplateColumns: '1.4fr repeat(4, 1fr)' }}
          role="table"
          aria-label="PowerWrite vs alternatives"
        >
          {/* Header row */}
          <div role="row" className="contents">
            <div role="columnheader" className="px-5 py-5 text-xs uppercase tracking-widest font-semibold text-[var(--text-muted)] bg-[var(--surface-hover)] border-b border-[var(--border)]">
              Feature
            </div>
            {PRODUCTS.map((p) => (
              <div
                key={p.id}
                role="columnheader"
                className={`px-4 py-5 border-b border-[var(--border)] ${
                  p.highlight
                    ? 'bg-[var(--accent-surface)] border-x border-[var(--accent)]/30'
                    : 'bg-[var(--surface-hover)]'
                }`}
              >
                <div className="flex flex-col items-center gap-1 text-center">
                  <div
                    className={`text-base font-semibold ${
                      p.highlight ? 'text-[var(--accent-text)]' : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {p.name}
                  </div>
                  {p.tagline && (
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--accent)] flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      {p.tagline}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Body rows */}
          {ROWS.map((row, rowIdx) => (
            <div role="row" key={row.feature} className="contents">
              <div
                role="rowheader"
                className={`px-5 py-5 border-t border-[var(--border)] ${
                  rowIdx % 2 === 1 ? 'bg-[var(--surface-hover)]/40' : ''
                }`}
              >
                <div className="font-medium text-[var(--text-primary)] text-sm">{row.feature}</div>
                {row.helper && (
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">{row.helper}</div>
                )}
              </div>
              {PRODUCTS.map((p) => (
                <div
                  key={p.id}
                  role="cell"
                  className={`px-4 py-5 border-t border-[var(--border)] ${
                    p.highlight ? 'bg-[var(--accent-surface)]/40 border-x border-[var(--accent)]/15' : ''
                  } ${rowIdx % 2 === 1 && !p.highlight ? 'bg-[var(--surface-hover)]/40' : ''}`}
                >
                  <CellRender cell={row.values[p.id]} highlight={p.highlight} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile — stacked per-feature cards */}
      <div className="md:hidden space-y-3">
        {ROWS.map((row) => (
          <div
            key={row.feature}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] overflow-hidden"
          >
            <div className="px-4 py-3 bg-[var(--surface-hover)] border-b border-[var(--border)]">
              <div className="font-semibold text-[var(--text-primary)] text-sm">{row.feature}</div>
              {row.helper && (
                <div className="text-xs text-[var(--text-muted)] mt-0.5">{row.helper}</div>
              )}
            </div>
            <div className="divide-y divide-[var(--border)]">
              {PRODUCTS.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between gap-3 px-4 py-3 ${
                    p.highlight ? 'bg-[var(--accent-surface)]/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-sm font-medium truncate ${
                        p.highlight ? 'text-[var(--accent-text)]' : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {p.name}
                    </span>
                    {p.highlight && (
                      <Sparkles className="w-3 h-3 text-[var(--accent)] flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-right">
                    <CellRender cell={row.values[p.id]} highlight={p.highlight} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Reveal>
  );
}

function CellRender({ cell, highlight }: { cell: Cell; highlight?: boolean }): ReactNode {
  const value = typeof cell === 'string' ? cell : cell.value;
  const tone = typeof cell === 'string' ? undefined : cell.tone;

  const isDash = value === '—';
  const Icon = isDash ? Minus : tone === 'good' ? Check : null;

  const colorClass = highlight
    ? 'text-[var(--accent-text)] font-semibold'
    : tone === 'good'
      ? 'text-[var(--success)] font-medium'
      : tone === 'bad'
        ? 'text-[var(--text-muted)]'
        : 'text-[var(--text-secondary)]';

  return (
    <div className={`flex items-center justify-center gap-1.5 text-sm text-center ${colorClass}`}>
      {Icon && (
        <Icon
          className={`w-3.5 h-3.5 flex-shrink-0 ${
            highlight ? 'text-[var(--accent)]' : ''
          }`}
          strokeWidth={3}
          aria-hidden="true"
        />
      )}
      <span>{value}</span>
    </div>
  );
}
