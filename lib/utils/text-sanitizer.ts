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
  removeAIArtifacts?: boolean;
}

const DEFAULT_OPTIONS: SanitizationOptions = {
  removeMarkdown: true,
  fixQuotes: true,
  fixDashes: true,
  removeNumbering: true,
  fixSpacing: true,
  removeMetaText: true,
  removeAIArtifacts: true,
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

  // Remove AI artifacts first (before other processing)
  if (opts.removeAIArtifacts) {
    sanitized = removeAIArtifacts(sanitized);
  }

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
 * Remove common AI formatting artifacts
 * This includes double underscores, double hyphens, and other AI-specific patterns
 * All AI-specific symbols are REMOVED, not converted to other characters
 */
export function removeAIArtifacts(text: string): string {
  let clean = text;

  // ==============================================
  // DOUBLE UNDERSCORES & EMPHASIS MARKERS
  // ==============================================
  
  // Remove __text__ emphasis patterns → text
  clean = clean.replace(/_{2,}([^_]+)_{2,}/g, '$1');
  
  // Remove standalone double/triple underscores: __ or ___ → nothing
  clean = clean.replace(/_{2,}/g, '');
  
  // Remove _text_ single underscore emphasis → text
  clean = clean.replace(/_([^_\s][^_]*)_/g, '$1');

  // ==============================================
  // DOUBLE HYPHENS & DASHES (REMOVE, not convert)
  // ==============================================
  
  // Remove standalone double/triple hyphens: -- or --- → space
  clean = clean.replace(/\s*-{2,}\s*/g, ' ');
  
  // Remove spaced single hyphen patterns (often AI formatting): word - word → word word
  clean = clean.replace(/\s+-\s+/g, ' ');
  
  // Remove multiple consecutive em-dashes or en-dashes
  clean = clean.replace(/[—–]{2,}/g, '');
  
  // Remove standalone em-dashes and en-dashes at start/end of sentences
  clean = clean.replace(/^[—–]\s*/gm, '');
  clean = clean.replace(/\s*[—–]$/gm, '');

  // ==============================================
  // ASTERISKS & EMPHASIS
  // ==============================================
  
  // Remove triple asterisks used for emphasis: ***text*** → text
  clean = clean.replace(/\*{3,}([^*]+)\*{3,}/g, '$1');
  
  // Remove double asterisks used for bold: **text** → text
  clean = clean.replace(/\*\*([^*]+)\*\*/g, '$1');
  
  // Remove single asterisks used for italic (but preserve scene breaks)
  // Only match if not a scene break pattern like * * * or ***
  clean = clean.replace(/(?<!\*)\*(?!\s*\*\s*\*|\*\*)([^*\n]+)\*(?!\*)/g, '$1');
  
  // Remove standalone asterisks (not scene breaks)
  clean = clean.replace(/(?<!\*|\s\*\s)\*(?!\s*\*)/g, '');

  // ==============================================
  // AI INSTRUCTION ARTIFACTS
  // ==============================================
  
  // Remove text in angle brackets (AI instructions): <instruction> → nothing
  clean = clean.replace(/<[^>]+>/g, '');
  
  // Remove curly brace placeholders: {placeholder} → nothing
  clean = clean.replace(/\{[^}]+\}/g, '');
  
  // Remove text between double curly braces: {{variable}} → nothing
  clean = clean.replace(/\{\{[^}]+\}\}/g, '');
  
  // Remove square bracket instructions: [instruction here] → nothing
  clean = clean.replace(/\[[^\]]*\]/g, '');

  // ==============================================
  // EXTRA PUNCTUATION PATTERNS
  // ==============================================
  
  // Remove ellipsis artifacts (more than 3 dots)
  clean = clean.replace(/\.{4,}/g, '...');
  
  // Fix spaced ellipsis: . . . → ...
  clean = clean.replace(/\.\s*\.\s*\./g, '...');
  
  // Remove leading/trailing special characters per line
  clean = clean.replace(/^[_*~`—–-]+|[_*~`—–-]+$/gm, '');
  
  // Remove double colons often used by AI: :: → :
  clean = clean.replace(/::/g, ':');
  
  // Remove double equals signs: == → nothing
  clean = clean.replace(/={2,}/g, '');
  
  // Remove pound/hash symbols used for headers: ### → nothing
  clean = clean.replace(/^#{1,6}\s*/gm, '');

  // ==============================================
  // AI GENERATION MARKERS
  // ==============================================
  
  // Remove [placeholder] style markers
  clean = clean.replace(/\[\s*(insert|add|include|placeholder|here|todo|tbd|note|continue|continued|end|start|begin|section|chapter)\s*[^\]]*\]/gi, '');
  
  // Remove (Note: ...) style AI notes
  clean = clean.replace(/\(Note:\s*[^)]+\)/gi, '');
  
  // Remove (TBD) (TODO) etc
  clean = clean.replace(/\((TBD|TODO|FIXME|NOTE|WIP|DRAFT)\)/gi, '');
  
  // Remove AI meta comments
  clean = clean.replace(/^(Note:|Author's Note:|Editor's Note:|AI Note:).*$/gim, '');
  
  // Remove "Chapter X:" patterns at start of content (duplicate titles)
  clean = clean.replace(/^Chapter\s+\d+[:\s]*$/gim, '');

  // ==============================================
  // FORMATTING CLEANUP
  // ==============================================
  
  // Remove tilde formatting: ~~text~~ → text
  clean = clean.replace(/~~([^~]+)~~/g, '$1');
  
  // Remove backtick code formatting: `text` → text
  clean = clean.replace(/`+([^`]+)`+/g, '$1');
  
  // Remove HTML-like emphasis tags: <em>text</em> → text
  clean = clean.replace(/<\/?(?:em|strong|b|i|u|s|del|ins|mark|span)>/gi, '');
  
  // Remove markdown link syntax: [text](url) → text
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove bare URLs on their own lines (often AI artifacts)
  clean = clean.replace(/^https?:\/\/[^\s]+$/gm, '');

  // ==============================================
  // COMMON AI PHRASE ARTIFACTS
  // ==============================================
  
  // Remove "continued..." patterns
  clean = clean.replace(/\(continued\.{0,3}\)/gi, '');
  clean = clean.replace(/\.{0,3}continued\.{0,3}$/gim, '');
  
  // Remove "to be continued" patterns
  clean = clean.replace(/\(?to be continued\.{0,3}\)?/gi, '');
  
  // Remove "The End" if it appears mid-text
  clean = clean.replace(/^(THE END|The End|\[END\]|\[THE END\])$/gm, '');

  // ==============================================
  // WHITESPACE NORMALIZATION
  // ==============================================
  
  // Fix multiple spaces created by removals
  clean = clean.replace(/  +/g, ' ');
  
  // Fix multiple newlines created by removals (max 2)
  clean = clean.replace(/\n{3,}/g, '\n\n');
  
  // Remove spaces at start/end of lines
  clean = clean.replace(/^[ \t]+|[ \t]+$/gm, '');
  
  // Remove empty lines at the very start/end
  clean = clean.replace(/^\n+|\n+$/g, '');

  return clean;
}

/**
 * Sanitize content specifically for reading/display
 * Optimized for clean reading experience
 */
export function sanitizeForReading(text: string): string {
  return sanitizeText(text, {
    removeMarkdown: true,
    fixQuotes: true,
    fixDashes: true,
    removeNumbering: false, // Keep paragraph structure
    fixSpacing: true,
    removeMetaText: true,
    removeAIArtifacts: true,
  });
}

/**
 * Sanitize content for export (PDF, HTML, etc.)
 * Applies all cleaning for final output
 */
export function sanitizeForExport(text: string): string {
  return sanitizeText(text, {
    removeMarkdown: true,
    fixQuotes: true,
    fixDashes: true,
    removeNumbering: false, // Keep chapter structure
    fixSpacing: true,
    removeMetaText: true,
    removeAIArtifacts: true,
  });
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
