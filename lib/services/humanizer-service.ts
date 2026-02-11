/**
 * Humanizer Service
 * 
 * Detects and scores AI writing patterns in generated text.
 * Based on Wikipedia's "Signs of AI writing" guide (24 patterns).
 * Can auto-fix simple patterns and flag complex ones for review.
 */

// ===== PATTERN DEFINITIONS =====

/** AI vocabulary words that appear far more frequently in AI-generated text */
const AI_VOCABULARY = [
  'additionally', 'delve', 'tapestry', 'landscape', 'interplay',
  'intricate', 'intricacies', 'foster', 'fostering', 'underscore',
  'underscores', 'showcase', 'showcasing', 'vibrant', 'garner',
  'pivotal', 'crucial', 'enduring', 'testament', 'encompasses',
  'embark', 'multifaceted', 'nuanced', 'comprehensive', 'furthermore',
  'moreover', 'notably', 'remarkably', 'spearheaded',
];

/** Inflated significance phrases */
const INFLATED_SIGNIFICANCE = [
  /\bserves?\s+as\b/gi,
  /\bstands?\s+as\b/gi,
  /\b(?:is|was)\s+a\s+testament\s+to\b/gi,
  /\bpivotal\s+(?:moment|role|point)\b/gi,
  /\bcrucial\s+(?:role|moment|step)\b/gi,
  /\bkey\s+turning\s+point\b/gi,
  /\bsetting\s+the\s+stage\b/gi,
  /\bmarks?\s+a\s+(?:significant|pivotal)\b/gi,
  /\bevolving\s+landscape\b/gi,
  /\bindelible\s+mark\b/gi,
  /\bdeeply\s+rooted\b/gi,
  /\bbroader\s+(?:implications|trends|movement)\b/gi,
  /\benduring\s+legacy\b/gi,
];

/** Promotional language */
const PROMOTIONAL_LANGUAGE = [
  /\bgroundbreaking\b/gi,
  /\bbreathtaking\b/gi,
  /\bstunning\b/gi,
  /\brenowned\b/gi,
  /\bnestled\b/gi,
  /\bboasts?\s+a?\b/gi,
  /\bmust-visit\b/gi,
  /\bin\s+the\s+heart\s+of\b/gi,
  /\brich\s+(?:cultural\s+)?heritage\b/gi,
  /\bnatural\s+beauty\b/gi,
];

/** Filler phrases that can be simplified */
const FILLER_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bIn\s+order\s+to\b/g, replacement: 'To' },
  { pattern: /\bDue\s+to\s+the\s+fact\s+that\b/gi, replacement: 'Because' },
  { pattern: /\bAt\s+this\s+point\s+in\s+time\b/gi, replacement: 'Now' },
  { pattern: /\bIn\s+the\s+event\s+that\b/gi, replacement: 'If' },
  { pattern: /\bhas\s+the\s+ability\s+to\b/gi, replacement: 'can' },
  { pattern: /\bIt\s+is\s+important\s+to\s+note\s+that\b/gi, replacement: '' },
  { pattern: /\bIt\s+is\s+worth\s+noting\s+that\b/gi, replacement: '' },
  { pattern: /\bIt\s+should\s+be\s+noted\s+that\b/gi, replacement: '' },
  { pattern: /\bAs\s+a\s+matter\s+of\s+fact\b/gi, replacement: 'In fact' },
  { pattern: /\bFor\s+the\s+purpose\s+of\b/gi, replacement: 'For' },
];

/** Vague attribution phrases */
const VAGUE_ATTRIBUTIONS = [
  /\b(?:industry|some)\s+(?:experts?|observers?|analysts?|reports?)\s+(?:say|argue|suggest|believe|note|indicate)\b/gi,
  /\bseveral\s+(?:sources|publications)\b/gi,
  /\baccording\s+to\s+(?:experts?|some|many)\b/gi,
];

/** Negative parallelism patterns */
const NEGATIVE_PARALLELISMS = [
  /\bIt'?s\s+not\s+(?:just|merely|only)\s+(?:about\s+)?[^,.;]+,\s*it'?s\b/gi,
  /\bNot\s+only\b[^,.;]+\bbut\s+(?:also\s+)?/gi,
];

/** Superficial -ing analyses */
const ING_ANALYSES = [
  /,\s*(?:highlighting|underscoring|emphasizing|ensuring|reflecting|symbolizing|contributing\s+to|cultivating|fostering|encompassing|showcasing)\b[^.]*\./gi,
];

// ===== SCORING =====

export interface HumanizerScore {
  /** Overall humanness score 0-100 (100 = most human) */
  score: number;
  /** Total pattern violations found */
  totalViolations: number;
  /** Breakdown by category */
  categories: {
    aiVocabulary: number;
    inflatedSignificance: number;
    promotionalLanguage: number;
    fillerPhrases: number;
    vagueAttributions: number;
    negativeParallelisms: number;
    ingAnalyses: number;
    emDashOveruse: number;
    ruleOfThree: number;
  };
  /** Specific flagged passages with line context */
  flagged: Array<{
    category: string;
    match: string;
    context: string;
  }>;
}

/**
 * Score text for AI writing patterns.
 * Returns a score from 0-100 where 100 = most human-sounding.
 */
export function scoreHumanness(text: string): HumanizerScore {
  const words = text.split(/\s+/);
  const wordCount = words.length;
  const flagged: HumanizerScore['flagged'] = [];

  // Count AI vocabulary
  let aiVocabCount = 0;
  const lowerText = text.toLowerCase();
  for (const word of AI_VOCABULARY) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      aiVocabCount += matches.length;
      matches.forEach(m => flagged.push({ category: 'AI Vocabulary', match: m, context: getContext(text, m) }));
    }
  }

  // Count inflated significance
  let inflatedCount = 0;
  for (const pattern of INFLATED_SIGNIFICANCE) {
    const matches = text.match(pattern);
    if (matches) {
      inflatedCount += matches.length;
      matches.forEach(m => flagged.push({ category: 'Inflated Significance', match: m, context: getContext(text, m) }));
    }
  }

  // Count promotional language
  let promotionalCount = 0;
  for (const pattern of PROMOTIONAL_LANGUAGE) {
    const matches = text.match(pattern);
    if (matches) {
      promotionalCount += matches.length;
      matches.forEach(m => flagged.push({ category: 'Promotional Language', match: m, context: getContext(text, m) }));
    }
  }

  // Count filler phrases
  let fillerCount = 0;
  for (const { pattern } of FILLER_REPLACEMENTS) {
    const matches = text.match(pattern);
    if (matches) {
      fillerCount += matches.length;
      matches.forEach(m => flagged.push({ category: 'Filler Phrase', match: m, context: getContext(text, m) }));
    }
  }

  // Count vague attributions
  let vagueCount = 0;
  for (const pattern of VAGUE_ATTRIBUTIONS) {
    const matches = text.match(pattern);
    if (matches) {
      vagueCount += matches.length;
      matches.forEach(m => flagged.push({ category: 'Vague Attribution', match: m, context: getContext(text, m) }));
    }
  }

  // Count negative parallelisms
  let negParCount = 0;
  for (const pattern of NEGATIVE_PARALLELISMS) {
    const matches = text.match(pattern);
    if (matches) {
      negParCount += matches.length;
      matches.forEach(m => flagged.push({ category: 'Negative Parallelism', match: m, context: getContext(text, m) }));
    }
  }

  // Count -ing analyses
  let ingCount = 0;
  for (const pattern of ING_ANALYSES) {
    const matches = text.match(pattern);
    if (matches) {
      ingCount += matches.length;
      matches.forEach(m => flagged.push({ category: '-ing Analysis', match: m, context: getContext(text, m) }));
    }
  }

  // Count em dash overuse
  const emDashCount = (text.match(/\u2014/g) || []).length;
  const emDashOveruse = Math.max(0, emDashCount - Math.floor(wordCount / 500)); // Allow ~1 per 500 words

  // Detect rule of three (3 comma-separated adjectives/items)
  const ruleOfThreeMatches = text.match(/\b\w+,\s+\w+,\s+and\s+\w+\b/gi) || [];
  const ruleOfThreeCount = ruleOfThreeMatches.length;
  ruleOfThreeMatches.forEach(m => flagged.push({ category: 'Rule of Three', match: m, context: getContext(text, m) }));

  const totalViolations = aiVocabCount + inflatedCount + promotionalCount + fillerCount + vagueCount + negParCount + ingCount + emDashOveruse + ruleOfThreeCount;

  // Calculate score: start at 100, subtract weighted penalties
  const penaltyPerViolation = 1000 / Math.max(wordCount, 1); // Normalize by text length
  const rawPenalty = totalViolations * penaltyPerViolation * 10;
  const score = Math.max(0, Math.min(100, Math.round(100 - rawPenalty)));

  return {
    score,
    totalViolations,
    categories: {
      aiVocabulary: aiVocabCount,
      inflatedSignificance: inflatedCount,
      promotionalLanguage: promotionalCount,
      fillerPhrases: fillerCount,
      vagueAttributions: vagueCount,
      negativeParallelisms: negParCount,
      ingAnalyses: ingCount,
      emDashOveruse,
      ruleOfThree: ruleOfThreeCount,
    },
    flagged: flagged.slice(0, 50), // Limit to 50 most relevant
  };
}

// ===== AUTO-FIX =====

/**
 * Apply automatic fixes for simple AI writing patterns.
 * Only fixes patterns that have clear, safe replacements.
 */
export function autoFixPatterns(text: string): string {
  let result = text;

  // Fix filler phrases
  for (const { pattern, replacement } of FILLER_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  // Reduce em dash overuse: replace chains of em dashes with commas
  // Keep some em dashes but replace excessive ones
  let emDashCount = 0;
  result = result.replace(/\u2014/g, () => {
    emDashCount++;
    // Keep first few, replace extras with commas
    if (emDashCount > 3) return ',';
    return '\u2014';
  });

  // Replace curly quotes with straight quotes for consistency
  result = result.replace(/[\u201C\u201D]/g, '"');
  result = result.replace(/[\u2018\u2019]/g, "'");

  // Clean up double spaces that may result from removals
  result = result.replace(/  +/g, ' ');
  result = result.replace(/ ,/g, ',');
  result = result.replace(/\. +\./g, '.');

  return result;
}

/**
 * Full humanization pipeline: score, auto-fix, re-score.
 */
export function humanizeText(text: string): { text: string; beforeScore: HumanizerScore; afterScore: HumanizerScore } {
  const beforeScore = scoreHumanness(text);
  const fixedText = autoFixPatterns(text);
  const afterScore = scoreHumanness(fixedText);

  return {
    text: fixedText,
    beforeScore,
    afterScore,
  };
}

// ===== HELPERS =====

function getContext(text: string, match: string): string {
  const index = text.indexOf(match);
  if (index === -1) return match;
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + match.length + 40);
  return (start > 0 ? '...' : '') + text.slice(start, end).trim() + (end < text.length ? '...' : '');
}
