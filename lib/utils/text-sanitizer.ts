/**
 * Text Sanitization Utility
 * Removes AI artifacts, fixes formatting, and ensures clean text output
 */

export interface SanitizationOptions {
  removeMarkdown?: boolean;
  fixQuotes?: boolean;
  fixDashes?: boolean;
  removeNumbering?: boolean;
  fixSpacing?: boolean;
  removeMetaText?: boolean;
}

const DEFAULT_OPTIONS: SanitizationOptions = {
  removeMarkdown: true,
  fixQuotes: true,
  fixDashes: true,
  removeNumbering: true,
  fixSpacing: true,
  removeMetaText: true,
};

/**
 * Main sanitization function
 */
export function sanitizeText(
  text: string,
  options: SanitizationOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let sanitized = text;

  // Remove meta text (e.g., [END CHAPTER], [CONTINUE], etc.)
  if (opts.removeMetaText) {
    sanitized = removeMetaText(sanitized);
  }

  // Remove markdown formatting
  if (opts.removeMarkdown) {
    sanitized = removeMarkdown(sanitized);
  }

  // Fix quotes
  if (opts.fixQuotes) {
    sanitized = fixQuotes(sanitized);
  }

  // Fix dashes
  if (opts.fixDashes) {
    sanitized = fixDashes(sanitized);
  }

  // Remove numbering artifacts
  if (opts.removeNumbering) {
    sanitized = removeNumbering(sanitized);
  }

  // Fix spacing issues
  if (opts.fixSpacing) {
    sanitized = fixSpacing(sanitized);
  }

  return sanitized.trim();
}

/**
 * Remove markdown formatting (headers, bold, italic, code blocks)
 */
function removeMarkdown(text: string): string {
  let clean = text;

  // Remove code blocks
  clean = clean.replace(/```[\s\S]*?```/g, '');
  clean = clean.replace(/`([^`]+)`/g, '$1');

  // Remove headers
  clean = clean.replace(/^#{1,6}\s+/gm, '');

  // Remove bold/italic
  clean = clean.replace(/\*\*\*(.+?)\*\*\*/g, '$1');
  clean = clean.replace(/\*\*(.+?)\*\*/g, '$1');
  clean = clean.replace(/\*(.+?)\*/g, '$1');
  clean = clean.replace(/___(.+?)___/g, '$1');
  clean = clean.replace(/__(.+?)__/g, '$1');
  clean = clean.replace(/_(.+?)_/g, '$1');

  // Remove links
  clean = clean.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

  // Remove horizontal rules
  clean = clean.replace(/^[\-\*_]{3,}$/gm, '');

  return clean;
}

/**
 * Convert straight quotes to smart quotes
 */
function fixQuotes(text: string): string {
  let fixed = text;

  // Fix double quotes
  fixed = fixed.replace(/"([^"]*)"/g, '\u201c$1\u201d');
  
  // Fix single quotes (apostrophes and quotes)
  fixed = fixed.replace(/(\w)'(\w)/g, '$1\u2019$2'); // apostrophes
  fixed = fixed.replace(/'([^']*)'/g, '\u2018$1\u2019'); // single quotes

  // Handle edge cases at start/end of strings
  fixed = fixed.replace(/^"/gm, '\u201c');
  fixed = fixed.replace(/"$/gm, '\u201d');
  fixed = fixed.replace(/^'/gm, '\u2018');
  fixed = fixed.replace(/'$/gm, '\u2019');

  return fixed;
}

/**
 * Fix dashes (em-dash and en-dash)
 */
function fixDashes(text: string): string {
  let fixed = text;

  // Convert double/triple hyphens to em-dash
  fixed = fixed.replace(/---/g, '\u2014');
  fixed = fixed.replace(/--/g, '\u2014');

  // Fix spaced em-dashes
  fixed = fixed.replace(/\s+-\s+/g, '\u2014');

  // Convert single hyphen between numbers to en-dash
  fixed = fixed.replace(/(\d+)-(\d+)/g, '$1\u2013$2');

  return fixed;
}

/**
 * Remove chapter numbering and list numbering artifacts
 */
function removeNumbering(text: string): string {
  let clean = text;

  // Remove chapter numbering at start of paragraphs
  clean = clean.replace(/^Chapter\s+\d+:?\s*/gim, '');
  clean = clean.replace(/^\d+\.\s+Chapter/gim, 'Chapter');

  // Remove list numbering at start of lines
  clean = clean.replace(/^\d+\.\s+/gm, '');
  clean = clean.replace(/^[a-z]\)\s+/gmi, '');

  // Remove bullet points
  clean = clean.replace(/^[\u2022\-\*]\s+/gm, '');

  return clean;
}

/**
 * Fix spacing issues (multiple spaces, line breaks, etc.)
 */
function fixSpacing(text: string): string {
  let fixed = text;

  // Remove multiple spaces (but preserve paragraph indentation)
  fixed = fixed.replace(/[^\S\n]+/g, ' ');

  // Fix multiple line breaks (max 2)
  fixed = fixed.replace(/\n{3,}/g, '\n\n');

  // Remove spaces at start/end of lines
  fixed = fixed.replace(/[ \t]+$/gm, '');
  fixed = fixed.replace(/^[ \t]+/gm, '');

  // Fix space before punctuation
  fixed = fixed.replace(/\s+([.,!?;:])/g, '$1');

  // Ensure space after punctuation
  fixed = fixed.replace(/([.,!?;:])([A-Za-z])/g, '$1 $2');

  return fixed;
}

/**
 * Remove meta text and AI artifacts
 */
function removeMetaText(text: string): string {
  let clean = text;

  // Remove common AI meta markers
  const metaPatterns = [
    /\[END CHAPTER\]/gi,
    /\[CHAPTER END\]/gi,
    /\[CONTINUE\]/gi,
    /\[CONTINUED\]/gi,
    /\[TO BE CONTINUED\]/gi,
    /\[END\]/gi,
    /\[START\]/gi,
    /\[BEGIN\]/gi,
    /Chapter \d+ - .+?\n/gi,
    /---+\n/g,
    /\*\*\*+\n/g,
  ];

  metaPatterns.forEach((pattern) => {
    clean = clean.replace(pattern, '');
  });

  // Remove instruction text
  clean = clean.replace(/^\[.*?\]$/gm, '');
  clean = clean.replace(/^Note:.*$/gm, '');
  clean = clean.replace(/^Author's Note:.*$/gm, '');

  return clean;
}

/**
 * Sanitize chapter content specifically
 */
export function sanitizeChapter(chapter: string): string {
  return sanitizeText(chapter, {
    removeMarkdown: true,
    fixQuotes: true,
    fixDashes: true,
    removeNumbering: false, // Keep chapter structure
    fixSpacing: true,
    removeMetaText: true,
  });
}

/**
 * Sanitize book title
 */
export function sanitizeTitle(title: string): string {
  let clean = title.trim();

  // Remove quotes
  clean = clean.replace(/^["']|["']$/g, '');

  // Remove extra formatting
  clean = removeMarkdown(clean);

  // Fix spacing
  clean = clean.replace(/\s+/g, ' ');

  return clean;
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 0;
  return cleaned.split(' ').filter((word) => word.length > 0).length;
}

/**
 * Estimate reading time (average 250 words per minute)
 */
export function estimateReadingTime(wordCount: number): number {
  return Math.ceil(wordCount / 250);
}

/**
 * Validate text quality (returns issues found)
 */
export function validateText(text: string): string[] {
  const issues: string[] = [];

  // Check for markdown artifacts
  if (/```|#{2,}|\*\*/.test(text)) {
    issues.push('Contains markdown formatting');
  }

  // Check for meta text
  if (/\[END|CONTINUE|CHAPTER\]/i.test(text)) {
    issues.push('Contains meta text markers');
  }

  // Check for numbering artifacts
  if (/^\d+\.\s+/m.test(text)) {
    issues.push('Contains list numbering');
  }

  // Check for excessive spacing
  if (/\n{4,}/.test(text)) {
    issues.push('Contains excessive line breaks');
  }

  // Check for straight quotes (should be curly)
  if (/"[^"]*"/.test(text)) {
    issues.push('Uses straight quotes instead of smart quotes');
  }

  return issues;
}

/**
 * Format paragraph with proper indentation
 */
export function formatParagraph(text: string, indent: boolean = true): string {
  const cleaned = sanitizeText(text);
  return indent ? `    ${cleaned}` : cleaned;
}

/**
 * Split text into paragraphs
 */
export function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * Join paragraphs with proper spacing
 */
export function joinParagraphs(paragraphs: string[]): string {
  return paragraphs.join('\n\n');
}
