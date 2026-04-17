'use client';

/**
 * BentoFeatures — magazine-style feature grid.
 *
 * Replaces the previous uniform 3×3 card grid with an asymmetric "bento"
 * where the lead AI Writing tile (2×2) anchors the composition, the
 * Audio Narration tile (2×1) gets a wide canvas for its waveform, and
 * six smaller tiles fill in the remaining cells. Different visual
 * treatment per tile gives the grid editorial rhythm.
 *
 * Responsive cascade:
 *   - mobile  (1 col)  : every tile full width, AI tile naturally taller
 *   - tablet  (2 cols) : AI tile 2 cols × 2 rows, Audio tile 2 cols
 *   - desktop (4 cols) : full 4-column bento, fixed row height
 */

import { Reveal, RevealItem, RevealStagger } from '@/components/home/Reveal';
import { MiniLiveText } from './MiniLiveText';
import { AudioWaveform } from './AudioWaveform';
import {
  Cpu,
  Headphones,
  Zap,
  BookOpen,
  SlidersHorizontal,
  Globe2,
  Download,
  RefreshCw,
  Play,
  FileText,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { type ReactNode } from 'react';

export function BentoFeatures() {
  return (
    <section className="py-20 md:py-28 bg-[var(--background)]">
      <div className="container mx-auto px-4">
        <Reveal as="div" className="text-center mb-12 md:mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">
            Capabilities
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-[var(--text-primary)] mb-4 leading-[1.1]">
            Everything you need to write
            <span className="block font-display-italic text-gradient-accent">amazing books</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Powerful features designed to help you create professional-quality books with ease.
          </p>
        </Reveal>

        <RevealStagger
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 lg:auto-rows-[210px]"
          stagger={0.04}
        >
          {/* AI Writing — 2×2 hero tile */}
          <RevealItem className="sm:col-span-2 lg:col-span-2 lg:row-span-2">
            <AiWritingTile />
          </RevealItem>

          {/* Lightning Fast — 1×1 */}
          <RevealItem>
            <LightningTile />
          </RevealItem>

          {/* Multi-Genre — 1×1 */}
          <RevealItem>
            <MultiGenreTile />
          </RevealItem>

          {/* Customization — 1×1 */}
          <RevealItem>
            <CustomizationTile />
          </RevealItem>

          {/* World Building — 1×1 */}
          <RevealItem>
            <WorldBuildingTile />
          </RevealItem>

          {/* Audio Narration — 2×1 wide tile */}
          <RevealItem className="sm:col-span-2 lg:col-span-2">
            <AudioTile />
          </RevealItem>

          {/* Export — 1×1 */}
          <RevealItem>
            <ExportTile />
          </RevealItem>

          {/* Iterative — 1×1 */}
          <RevealItem>
            <IterativeTile />
          </RevealItem>
        </RevealStagger>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tile primitives                                                            */
/* -------------------------------------------------------------------------- */

interface TileProps {
  children: ReactNode;
  className?: string;
  /** Subtle background flourish: 'accent' (amber), 'magenta', 'cyan', or none. */
  accent?: 'accent' | 'magenta' | 'cyan' | 'none';
}

function Tile({ children, className = '', accent = 'none' }: TileProps) {
  const accentBg =
    accent === 'accent'
      ? 'before:bg-[radial-gradient(circle_at_top_right,var(--accent-surface),transparent_60%)]'
      : accent === 'magenta'
        ? 'before:bg-[radial-gradient(circle_at_top_right,var(--accent-2-soft),transparent_60%)]'
        : accent === 'cyan'
          ? 'before:bg-[radial-gradient(circle_at_top_right,var(--accent-3-soft),transparent_60%)]'
          : '';

  return (
    <div
      className={`group relative h-full min-h-[210px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] transition-all duration-300 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 before:absolute before:inset-0 before:opacity-60 before:pointer-events-none ${accentBg} ${className}`}
    >
      <div className="relative h-full">{children}</div>
    </div>
  );
}

function TileIcon({ children, color = 'accent' }: { children: ReactNode; color?: 'accent' | 'magenta' | 'cyan' | 'success' }) {
  const styles = {
    accent: 'bg-[var(--accent-surface)] text-[var(--accent)]',
    magenta: 'bg-[var(--accent-2-soft)] text-[var(--accent-2)]',
    cyan: 'bg-[var(--accent-3-soft)] text-[var(--accent-3)]',
    success: 'bg-[var(--success-light)] text-[var(--success)]',
  };
  return (
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110 ${styles[color]}`}
    >
      {children}
    </div>
  );
}

function TileTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1.5">{children}</h3>;
}

function TileDescription({ children }: { children: ReactNode }) {
  return <p className="text-sm text-[var(--text-muted)] leading-relaxed">{children}</p>;
}

/* -------------------------------------------------------------------------- */
/*  AI Writing — hero tile (2×2)                                               */
/* -------------------------------------------------------------------------- */

function AiWritingTile() {
  return (
    <Tile accent="accent" className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <TileIcon>
          <Cpu className="w-5 h-5" />
        </TileIcon>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-surface)] border border-[var(--accent)]/20 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-text)]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-70 animate-ping" />
            <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          </span>
          Live
        </span>
      </div>

      <h3 className="font-display text-2xl md:text-3xl text-[var(--text-primary)] leading-tight mb-2">
        AI-powered writing
      </h3>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5 max-w-prose">
        Advanced AI generates compelling narratives, realistic dialogue, and engaging content
        tailored to your specifications.
      </p>

      {/* Mini "page" mockup that streams real prose */}
      <div className="mt-auto rounded-xl border border-[var(--border)] bg-[var(--brand-paper)] p-4 shadow-inner">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold">
            <Wand2 className="w-3 h-3 text-[var(--accent)]" />
            Generating chapter
          </div>
          <div className="text-[10px] tabular-nums text-[var(--text-muted)]">~ 850 wpm</div>
        </div>
        <MiniLiveText
          text='"She turned the brass key, and the door swung open onto a room she had not seen in years."'
          className="font-book-serif text-[var(--brand-ink)] text-[12.5px] leading-[1.55] book-text min-h-[5em]"
          speed={28}
          holdMs={2200}
        />
      </div>
    </Tile>
  );
}

/* -------------------------------------------------------------------------- */
/*  Audio Narration — wide tile (2×1)                                          */
/* -------------------------------------------------------------------------- */

function AudioTile() {
  return (
    <Tile accent="cyan" className="flex flex-col">
      <div className="flex items-start gap-4">
        <TileIcon color="cyan">
          <Headphones className="w-5 h-5" />
        </TileIcon>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <TileTitle>Audio narration</TileTitle>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--accent-3)] bg-[var(--accent-3-soft)] border border-[var(--accent-3)]/20 px-2 py-0.5 rounded-full whitespace-nowrap">
              12 voices
            </span>
          </div>
          <TileDescription>
            Turn any chapter into studio-quality audio. Choose a narrator voice, preview, and
            export as MP3.
          </TileDescription>
        </div>
      </div>

      {/* Waveform + transport row */}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          aria-label="Preview narration"
          className="flex-shrink-0 w-9 h-9 rounded-full bg-[var(--accent-3)] text-white flex items-center justify-center shadow-sm hover:scale-105 transition-transform focus-ring"
        >
          <Play className="w-4 h-4 ml-0.5" />
        </button>
        <div className="flex-1 h-12 sm:h-14">
          <AudioWaveform />
        </div>
        <div className="flex-shrink-0 text-xs tabular-nums text-[var(--text-muted)] font-medium">
          0:42 / 3:08
        </div>
      </div>
    </Tile>
  );
}

/* -------------------------------------------------------------------------- */
/*  Small (1×1) tiles                                                          */
/* -------------------------------------------------------------------------- */

function LightningTile() {
  return (
    <Tile accent="accent" className="flex flex-col">
      <TileIcon>
        <Zap className="w-5 h-5" />
      </TileIcon>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-display text-4xl text-gradient-accent leading-none">10×</span>
        <span className="text-xs text-[var(--text-muted)] font-medium">faster than typing</span>
      </div>
      <TileTitle>Lightning fast</TileTitle>
      <TileDescription>Generate an 80,000-word novel in minutes, not months.</TileDescription>
    </Tile>
  );
}

function MultiGenreTile() {
  const genres = ['Fantasy', 'Mystery', 'Romance', 'Memoir', 'Sci-Fi', 'Thriller'];
  return (
    <Tile className="flex flex-col">
      <TileIcon>
        <BookOpen className="w-5 h-5" />
      </TileIcon>
      <TileTitle>Multi-genre</TileTitle>
      <TileDescription>Adapts to any genre with the right conventions and tone.</TileDescription>
      <div className="mt-auto pt-3 flex flex-wrap gap-1.5">
        {genres.map((g, i) => (
          <span
            key={g}
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
              i === 0
                ? 'bg-[var(--accent-surface)] border-[var(--accent)]/25 text-[var(--accent-text)]'
                : 'bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-muted)]'
            }`}
          >
            {g}
          </span>
        ))}
      </div>
    </Tile>
  );
}

function CustomizationTile() {
  return (
    <Tile accent="magenta" className="flex flex-col">
      <TileIcon color="magenta">
        <SlidersHorizontal className="w-5 h-5" />
      </TileIcon>
      <TileTitle>Total control</TileTitle>
      <TileDescription>Genre, voice, pacing, POV, dialogue density — all yours.</TileDescription>
      <div className="mt-auto pt-3 space-y-2">
        {[
          { label: 'Pacing', value: 70 },
          { label: 'Dialogue', value: 45 },
          { label: 'Detail', value: 85 },
        ].map((row) => (
          <div key={row.label} className="flex items-center gap-2 text-[10px]">
            <span className="w-14 text-[var(--text-muted)] font-medium uppercase tracking-wider">
              {row.label}
            </span>
            <div className="flex-1 h-1 bg-[var(--surface-active)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${row.value}%`,
                  background: 'var(--accent-gradient)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Tile>
  );
}

function WorldBuildingTile() {
  return (
    <Tile className="flex flex-col">
      <TileIcon color="cyan">
        <Globe2 className="w-5 h-5" />
      </TileIcon>
      <TileTitle>World building</TileTitle>
      <TileDescription>
        Create rich, consistent worlds with characters, settings, and lore that hold together.
      </TileDescription>
      <div className="mt-auto pt-3 flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
        <span className="px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--surface-hover)]">
          Characters
        </span>
        <span className="px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--surface-hover)]">
          Locations
        </span>
        <span className="px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--surface-hover)]">
          Lore
        </span>
      </div>
    </Tile>
  );
}

function ExportTile() {
  const formats: Array<{ label: string; icon: ReactNode; color: string }> = [
    {
      label: 'PDF',
      icon: <FileText className="w-3.5 h-3.5" />,
      color: 'text-[var(--accent)] bg-[var(--accent-surface)] border-[var(--accent)]/20',
    },
    {
      label: 'EPUB',
      icon: <BookOpen className="w-3.5 h-3.5" />,
      color: 'text-[var(--accent-2)] bg-[var(--accent-2-soft)] border-[var(--accent-2)]/25',
    },
    {
      label: 'DOCX',
      icon: <FileText className="w-3.5 h-3.5" />,
      color: 'text-[var(--info)] bg-[var(--info-light)] border-[var(--info)]/20',
    },
    {
      label: 'MP3',
      icon: <Headphones className="w-3.5 h-3.5" />,
      color: 'text-[var(--accent-3)] bg-[var(--accent-3-soft)] border-[var(--accent-3)]/25',
    },
  ];
  return (
    <Tile className="flex flex-col">
      <TileIcon color="success">
        <Download className="w-5 h-5" />
      </TileIcon>
      <TileTitle>Export anywhere</TileTitle>
      <TileDescription>Print-ready PDFs, e-books, manuscripts, audio. One click.</TileDescription>
      <div className="mt-auto pt-3 grid grid-cols-2 gap-1.5">
        {formats.map((f) => (
          <div
            key={f.label}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-semibold border ${f.color}`}
          >
            {f.icon}
            {f.label}
          </div>
        ))}
      </div>
    </Tile>
  );
}

function IterativeTile() {
  return (
    <Tile accent="accent" className="flex flex-col">
      <TileIcon>
        <RefreshCw className="w-5 h-5" />
      </TileIcon>
      <TileTitle>Iterate freely</TileTitle>
      <TileDescription>
        Don&apos;t love a chapter? Regenerate with new parameters. No re-writing required.
      </TileDescription>
      <div className="mt-auto pt-3 flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
        <Sparkles className="w-3 h-3 text-[var(--accent)]" />
        <span className="font-medium">
          <span className="text-[var(--text-primary)] tabular-nums">∞</span> regenerations
        </span>
      </div>
    </Tile>
  );
}
