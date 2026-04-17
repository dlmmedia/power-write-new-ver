'use client';

/**
 * StepMockup — stylised "in-app screenshot" cards used inside the
 * horizontal process film strip. Each variant shows a different,
 * recognisable slice of the actual product UX:
 *
 *   1. configure  — basic info form (title, genre, length)
 *   2. style      — POV / pacing toggles
 *   3. outline    — chapter-by-chapter list with checkmarks
 *   4. generate   — live writing demo (mini)
 *   5. export     — format buttons (PDF / EPUB / DOCX / MP3)
 *
 * Mockups are CSS-only so they render fast, work in any theme, and never
 * need to be regenerated when the real UI changes. They communicate
 * *what happens* at each step without pretending to be a screenshot.
 */

import {
  Check,
  ChevronDown,
  Circle,
  CircleDot,
  Download,
  FileText,
  Headphones,
  BookOpen,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { type ReactNode } from 'react';
import { MiniLiveText } from '@/components/home/features/MiniLiveText';

export type StepVariant = 'configure' | 'style' | 'outline' | 'generate' | 'export';

interface StepMockupProps {
  variant: StepVariant;
}

export function StepMockup({ variant }: StepMockupProps) {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-[var(--brand-paper)] border border-[var(--border-strong)] shadow-inner">
      {/* Faux app chrome — adds the "this is an app screen" recognition. */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-hover)]">
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] opacity-60" />
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-2)] opacity-60" />
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-3)] opacity-60" />
        <span className="ml-3 text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold">
          {chromeLabel(variant)}
        </span>
      </div>

      <div className="p-5 h-[calc(100%-2.625rem)] overflow-hidden">
        {variant === 'configure' && <ConfigureMock />}
        {variant === 'style' && <StyleMock />}
        {variant === 'outline' && <OutlineMock />}
        {variant === 'generate' && <GenerateMock />}
        {variant === 'export' && <ExportMock />}
      </div>
    </div>
  );
}

function chromeLabel(v: StepVariant): string {
  switch (v) {
    case 'configure':
      return 'Studio · Basic info';
    case 'style':
      return 'Studio · Style & voice';
    case 'outline':
      return 'Outline · 12 chapters';
    case 'generate':
      return 'Editor · Chapter 3';
    case 'export':
      return 'Library · Export';
  }
}

/* -------------------------------------------------------------------------- */
/*  Mock sub-components                                                        */
/* -------------------------------------------------------------------------- */

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[9px] uppercase tracking-widest font-semibold text-[var(--text-muted)]">
      {children}
    </span>
  );
}

function FauxInput({ value, accent = false }: { value: string; accent?: boolean }) {
  return (
    <div
      className={`mt-1 px-3 py-2 rounded-md border text-xs font-medium ${
        accent
          ? 'border-[var(--accent)]/40 bg-[var(--accent-surface)] text-[var(--accent-text)]'
          : 'border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)]'
      }`}
    >
      {value}
    </div>
  );
}

function FauxSelect({ value }: { value: string }) {
  return (
    <div className="mt-1 px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-xs font-medium text-[var(--text-primary)] flex items-center justify-between">
      <span>{value}</span>
      <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
    </div>
  );
}

function ConfigureMock() {
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Title</FieldLabel>
        <FauxInput value="The Last Cartographer" accent />
      </div>
      <div>
        <FieldLabel>Genre</FieldLabel>
        <FauxSelect value="Historical Fiction" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Chapters</FieldLabel>
          <FauxInput value="12" />
        </div>
        <div>
          <FieldLabel>Words / chapter</FieldLabel>
          <FauxInput value="6,500" />
        </div>
      </div>
      <div className="pt-1 flex items-center justify-end">
        <span className="px-3 py-1.5 rounded-md text-[11px] font-semibold text-white bg-[var(--accent)] shadow-sm">
          Continue →
        </span>
      </div>
    </div>
  );
}

function StyleMock() {
  const toggles: Array<{ label: string; value: string; active?: boolean }> = [
    { label: 'POV', value: 'Third-person limited', active: true },
    { label: 'Tense', value: 'Past' },
    { label: 'Voice', value: 'Lyrical, measured' },
  ];
  return (
    <div className="space-y-3">
      {toggles.map((t) => (
        <div key={t.label} className="flex items-center justify-between gap-3">
          <FieldLabel>{t.label}</FieldLabel>
          <span
            className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
              t.active
                ? 'bg-[var(--accent-surface)] border-[var(--accent)]/30 text-[var(--accent-text)]'
                : 'bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-secondary)]'
            }`}
          >
            {t.value}
          </span>
        </div>
      ))}
      <div className="pt-2 space-y-2.5">
        {[
          { label: 'Pacing', value: 60 },
          { label: 'Dialogue', value: 40 },
          { label: 'Description', value: 80 },
        ].map((row) => (
          <div key={row.label} className="flex items-center gap-2 text-[10px]">
            <span className="w-16 text-[var(--text-muted)] font-medium uppercase tracking-wider">
              {row.label}
            </span>
            <div className="flex-1 h-1 bg-[var(--surface-active)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${row.value}%`, background: 'var(--accent-gradient)' }}
              />
            </div>
            <span className="w-8 text-right tabular-nums text-[var(--text-muted)]">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OutlineMock() {
  const chapters = [
    { num: 1, title: 'A locked study', done: true },
    { num: 2, title: 'The unsigned letter', done: true },
    { num: 3, title: 'A name from the past', done: true, current: true },
    { num: 4, title: 'Across the channel', done: false },
    { num: 5, title: 'The cartographer\u2019s widow', done: false },
    { num: 6, title: 'What the maps remember', done: false },
  ];
  return (
    <ul className="space-y-2">
      {chapters.map((c) => (
        <li
          key={c.num}
          className={`flex items-start gap-3 px-3 py-2 rounded-md border text-xs ${
            c.current
              ? 'border-[var(--accent)]/40 bg-[var(--accent-surface)]'
              : 'border-[var(--border)] bg-[var(--background)]'
          }`}
        >
          <span className="flex-shrink-0 mt-0.5">
            {c.done ? (
              <span className="w-4 h-4 rounded-full bg-[var(--success)] text-white flex items-center justify-center">
                <Check className="w-2.5 h-2.5" strokeWidth={3} />
              </span>
            ) : c.current ? (
              <CircleDot className="w-4 h-4 text-[var(--accent)]" />
            ) : (
              <Circle className="w-4 h-4 text-[var(--text-muted)]" />
            )}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-widest font-semibold text-[var(--text-muted)]">
              Chapter {c.num}
            </div>
            <div className="font-medium text-[var(--text-primary)] truncate">{c.title}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function GenerateMock() {
  return (
    <div className="space-y-3 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-[var(--text-muted)]">
          <Wand2 className="w-3 h-3 text-[var(--accent)]" />
          Generating chapter 3
        </div>
        <div className="text-[10px] tabular-nums text-[var(--text-muted)]">3 / 12</div>
      </div>

      <div className="flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] p-3 overflow-hidden">
        <div className="text-[10px] uppercase tracking-widest font-semibold text-[var(--text-muted)] mb-1">
          Chapter 3 · A name from the past
        </div>
        <MiniLiveText
          text='He read the name once, then twice, and felt the room tilt slightly under his feet. It had been twenty-two years since anyone had spoken it aloud. The handwriting belonged to no one she knew, and yet—'
          className="font-book-serif text-[var(--brand-ink)] text-[11.5px] leading-[1.55] book-text"
          speed={26}
          holdMs={2400}
        />
      </div>

      <div className="flex items-center gap-2 text-[10px]">
        <div className="flex-1 h-1.5 bg-[var(--surface-active)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: '38%', background: 'var(--accent-gradient)' }}
          />
        </div>
        <span className="tabular-nums text-[var(--text-muted)]">38%</span>
      </div>
    </div>
  );
}

function ExportMock() {
  const formats: Array<{ label: string; sub: string; icon: ReactNode; tone: string }> = [
    {
      label: 'PDF',
      sub: 'Print-ready',
      icon: <FileText className="w-4 h-4" />,
      tone: 'text-[var(--accent)] bg-[var(--accent-surface)] border-[var(--accent)]/25',
    },
    {
      label: 'EPUB',
      sub: 'Reflowable',
      icon: <BookOpen className="w-4 h-4" />,
      tone: 'text-[var(--accent-2)] bg-[var(--accent-2-soft)] border-[var(--accent-2)]/25',
    },
    {
      label: 'DOCX',
      sub: 'Manuscript',
      icon: <FileText className="w-4 h-4" />,
      tone: 'text-[var(--info)] bg-[var(--info-light)] border-[var(--info)]/25',
    },
    {
      label: 'MP3',
      sub: 'Narrated',
      icon: <Headphones className="w-4 h-4" />,
      tone: 'text-[var(--accent-3)] bg-[var(--accent-3-soft)] border-[var(--accent-3)]/25',
    },
  ];
  return (
    <div className="space-y-3 h-full flex flex-col">
      <div className="grid grid-cols-2 gap-2">
        {formats.map((f) => (
          <div
            key={f.label}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-md border ${f.tone}`}
          >
            {f.icon}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold leading-tight">{f.label}</div>
              <div className="text-[9px] uppercase tracking-wider opacity-70 leading-tight">
                {f.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto rounded-md border border-[var(--accent)]/40 bg-[var(--accent-surface)] p-3 flex items-center gap-2.5">
        <Download className="w-4 h-4 text-[var(--accent)]" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-[var(--accent-text)] leading-tight">
            Download all formats
          </div>
          <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5">
            <Sparkles className="w-2.5 h-2.5 text-[var(--accent)]" />
            Bundled · 12.4 MB
          </div>
        </div>
      </div>
    </div>
  );
}
