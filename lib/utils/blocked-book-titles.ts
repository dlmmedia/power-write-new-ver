export const BLOCKED_BOOK_TITLES = [
  'Whispers of the Undercurrent',
  'The Twilight Crown',
  'The Resilient Republic',
  'Synth Harmony',
  // Variants seen from unwanted auto-population
  'Sparta reconstructed, reverberations',
  'Sparta reconstructed reverberations',
  'masters',
  "mastering life's rhythms",
  'AI consumer guide',
] as const;

function normalizeTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    // normalize punctuation to spaces (commas/colons/dashes/etc)
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const BLOCKED_TITLES_SET = new Set(BLOCKED_BOOK_TITLES.map(normalizeTitle));

export function isBlockedBookTitle(title: string | null | undefined): boolean {
  if (!title) return false;
  const n = normalizeTitle(title);
  if (BLOCKED_TITLES_SET.has(n)) return true;

  // For longer blocked phrases, also block if the title contains/starts with them.
  // For short/generic titles (e.g. "masters") we keep exact-match only to avoid hiding legit books.
  for (const blocked of BLOCKED_TITLES_SET) {
    const words = blocked.split(' ').filter(Boolean);
    if (words.length >= 3) {
      if (n.startsWith(blocked) || n.includes(blocked)) return true;
    }
  }
  return false;
}

