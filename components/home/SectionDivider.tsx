'use client';

/**
 * SectionDivider — minimal editorial flourish that sits between major
 * page sections. Two thin hairlines flanking a small centered glyph,
 * styled in the brand display serif. Used sparingly so it stays
 * special — pages should not be carved up into a dozen dividers.
 *
 * Token-driven: hairlines use `--border`, the glyph uses `--accent`,
 * so the ornament reads correctly across light/dark/system themes
 * without bespoke overrides.
 */

interface SectionDividerProps {
  /** Optional unicode glyph to centre between the rules. Defaults to a star. */
  glyph?: string;
  className?: string;
  /** Width of the rules in `rem`. Defaults to `4`. Use a smaller value on tighter sections. */
  ruleWidth?: number;
}

export function SectionDivider({
  glyph = '✦',
  className = '',
  ruleWidth = 4,
}: SectionDividerProps) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={`flex items-center justify-center gap-4 py-8 md:py-12 ${className}`}
    >
      <span
        className="block h-px bg-gradient-to-r from-transparent to-[var(--border)]"
        style={{ width: `${ruleWidth}rem` }}
      />
      <span
        className="font-display text-[var(--accent)] text-lg leading-none select-none"
        style={{ fontVariationSettings: '"opsz" 96' }}
      >
        {glyph}
      </span>
      <span
        className="block h-px bg-gradient-to-l from-transparent to-[var(--border)]"
        style={{ width: `${ruleWidth}rem` }}
      />
    </div>
  );
}
