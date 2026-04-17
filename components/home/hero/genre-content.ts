/**
 * Genre-specific content shown in the Hero "live writing" demo.
 *
 * The order of `GENRES` matches the order of `typingWords` in `HeroSection`
 * — the typing word and the demo content advance together so what the user
 * sees on the left ("Create your Memoir") and the right (the actual memoir
 * excerpt being typed by the AI) always agree.
 *
 * Excerpts are intentionally short (~140-180 chars), evocative, and use the
 * tonal cues a reader expects from each genre. They are written, not
 * generated, so the demo always shows polished prose.
 */

export interface GenreContent {
  /** Matches `typingWords` in HeroSection.tsx (kept in sync). */
  word: string;
  /** Tag pill copy shown on the left page (e.g. "CHAPTER 1"). */
  chapterTag: string;
  /** Display-serif chapter title shown on the left page. */
  chapterTitle: string;
  /** A short outline of three "beats" — gives the left page real content. */
  outline: string[];
  /** The chapter excerpt streamed character-by-character on the right page. */
  excerpt: string;
}

export const GENRES: GenreContent[] = [
  {
    word: 'Novel',
    chapterTag: 'Chapter 1',
    chapterTitle: 'The Discovery',
    outline: ['A locked study', 'An unsigned letter', 'A name from the past'],
    excerpt:
      'She turned the brass key, and the door swung open onto a room she had not seen since the summer her father vanished. The light came through the curtains the colour of old tea.',
  },
  {
    word: 'Memoir',
    chapterTag: 'Chapter 1',
    chapterTitle: 'Beginnings',
    outline: ['The house on Linden Street', "My mother's hands", 'Snow, in April'],
    excerpt:
      "I was born in a small town where everyone knew everyone, where the seasons arrived on time and the bells of St. Mary's carried a mile in still air. I remember the sound of them most of all.",
  },
  {
    word: 'Cookbook',
    chapterTag: 'Chapter 1',
    chapterTitle: 'On Butter',
    outline: ['Cold from the fridge', 'Salt at the very end', 'When in doubt, more'],
    excerpt:
      'Begin with butter — always real butter, cold from the fridge, cut into small even cubes. Let it melt slowly. Watch the pan, not the clock. The colour will tell you everything.',
  },
  {
    word: 'Thriller',
    chapterTag: 'Chapter 1',
    chapterTitle: 'The Warning',
    outline: ['3:17 a.m.', 'An unmarked van', 'Run, do not call'],
    excerpt:
      'The phone rang at 3:17 a.m. He let it ring twice before answering, already knowing exactly who it would be, and exactly what they would say. He was already reaching for the keys.',
  },
  {
    word: 'Guide',
    chapterTag: 'Chapter 1',
    chapterTitle: 'Getting Started',
    outline: ['Know your reader', 'Write the wrong thing first', 'Fix it tomorrow'],
    excerpt:
      'Before you write a single word, take a quiet moment to think about the person on the other side of the page. They are tired. They are hopeful. Write for them, and only them.',
  },
  {
    word: 'Epic',
    chapterTag: 'Book One',
    chapterTitle: 'The Old Kingdom',
    outline: ['Seven cities of stone', 'A king with no name', 'The first crow at dawn'],
    excerpt:
      'Long before the towers fell and the rivers ran red, there was a kingdom of seven cities where stars were counted as gold and the wind carried the names of dead kings on its back.',
  },
  {
    word: 'Story',
    chapterTag: 'A Short Tale',
    chapterTitle: 'The Wind-Speaker',
    outline: ['A village by the sea', 'A man who spoke to wind', 'One last fire on the cliff'],
    excerpt:
      'Once, in a village by the sea, there lived a fisherman who could speak with the wind. The villagers thought him strange, until the night the great storm came rolling in from the dark water.',
  },
];
