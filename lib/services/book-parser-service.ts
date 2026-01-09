// Book Parser Service - Content extraction and chapter detection for uploaded books
import mammoth from 'mammoth';

// Types for parsed book content
export interface ParsedChapter {
  number: number;
  title: string;
  content: string;
  wordCount: number;
  startPosition?: number;
  endPosition?: number;
}

export interface ParsedBook {
  title: string;
  author: string;
  chapters: ParsedChapter[];
  totalWordCount: number;
  rawContent: string;
  fileType: 'pdf' | 'docx' | 'txt';
  fileName: string;
  fileSize: number;
  detectionMethod: 'chapter_heading' | 'single_chapter';
  confidence: 'high' | 'medium' | 'low';
  confidenceScore: number;
}

export interface ParserOptions {
  minChapterWordCount?: number;
  maxChapters?: number;
  preferredChapterLength?: number;
}

const DEFAULT_OPTIONS: ParserOptions = {
  minChapterWordCount: 500,
  maxChapters: 100,
  preferredChapterLength: 3000,
};

// Strict chapter detection patterns - only match explicit chapter markers
// These patterns are designed to minimize false positives
const STRICT_CHAPTER_PATTERNS = [
  // "Chapter 1" or "Chapter One" or "CHAPTER 1" - must have "chapter" keyword
  {
    pattern: /^(?:chapter|ch\.?)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|twenty[-\s]?one|twenty[-\s]?two|twenty[-\s]?three|twenty[-\s]?four|twenty[-\s]?five|thirty|forty|fifty)\s*(?:[:.\-–—]\s*)?(.*)$/i,
    name: 'chapter_keyword',
    weight: 1.0,
  },
  // "Part 1" or "Part One" - for book parts/sections
  {
    pattern: /^(?:part)\s+(\d+|[ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:[:.\-–—]\s*)?(.*)$/i,
    name: 'part_keyword',
    weight: 0.9,
  },
  // "Section 1" - explicit section headers
  {
    pattern: /^(?:section)\s+(\d+)\s*(?:[:.\-–—]\s*)?(.*)$/i,
    name: 'section_keyword',
    weight: 0.8,
  },
  // "Prologue" or "Epilogue" - special chapters
  {
    pattern: /^(prologue|epilogue|introduction|preface|foreword|afterword)\s*(?:[:.\-–—]\s*)?(.*)$/i,
    name: 'special_chapter',
    weight: 1.0,
  },
];

// Word number to digit mapping
const WORD_TO_NUMBER: Record<string, number> = {
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
  'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
  'twenty-one': 21, 'twenty one': 21, 'twentyone': 21,
  'twenty-two': 22, 'twenty two': 22, 'twentytwo': 22,
  'twenty-three': 23, 'twenty three': 23, 'twentythree': 23,
  'twenty-four': 24, 'twenty four': 24, 'twentyfour': 24,
  'twenty-five': 25, 'twenty five': 25, 'twentyfive': 25,
  'thirty': 30, 'forty': 40, 'fifty': 50,
  'prologue': 0, 'epilogue': 999, 'introduction': 0, 'preface': 0, 
  'foreword': 0, 'afterword': 999,
};

/**
 * Parse a number from various formats (digit, word, roman numeral)
 */
function parseChapterNumber(value: string): number {
  const normalized = value.toLowerCase().trim().replace(/\s+/g, '-');
  
  // Try direct number
  const num = parseInt(normalized, 10);
  if (!isNaN(num)) return num;
  
  // Try word number
  if (WORD_TO_NUMBER[normalized] !== undefined) return WORD_TO_NUMBER[normalized];
  
  // Try without hyphens
  const noHyphens = normalized.replace(/-/g, '');
  if (WORD_TO_NUMBER[noHyphens] !== undefined) return WORD_TO_NUMBER[noHyphens];
  
  // Try roman numerals
  const romanMap: Record<string, number> = {
    'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
    'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10,
    'xi': 11, 'xii': 12, 'xiii': 13, 'xiv': 14, 'xv': 15,
    'xvi': 16, 'xvii': 17, 'xviii': 18, 'xix': 19, 'xx': 20,
  };
  if (romanMap[normalized]) return romanMap[normalized];
  
  return 1; // Default to 1 if parsing fails
}

/**
 * Count words in a string
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Strip standalone page numbers from content
 * Page numbers are typically:
 * - Standalone lines with just 1-4 digits
 * - Sometimes with decoration like "- 5 -" or "[ 5 ]"
 */
function stripPageNumbers(text: string): string {
  const lines = text.split('\n');
  const filteredLines: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines (we'll handle them normally)
    if (!trimmed) {
      filteredLines.push(line);
      continue;
    }
    
    // Check if line is a standalone page number
    const isPageNumber = 
      // Just digits: "1", "15", "243"
      /^\d{1,4}$/.test(trimmed) ||
      // Decorated: "- 5 -", "— 12 —", "[ 5 ]", "( 12 )"
      /^[-–—\[\(]\s*\d{1,4}\s*[-–—\]\)]$/.test(trimmed) ||
      // "Page 5" or "Page 15"
      /^page\s+\d{1,4}$/i.test(trimmed) ||
      // Roman numerals alone: "i", "ii", "xv" (for front matter)
      /^[ivxlcdm]{1,6}$/i.test(trimmed);
    
    if (!isPageNumber) {
      filteredLines.push(line);
    }
  }
  
  return filteredLines.join('\n');
}

/**
 * Remove repetitive headers/footers that appear on every page
 * These are typically short lines that repeat frequently throughout the document
 */
function removeRepetitiveHeaders(text: string): string {
  const lines = text.split('\n');
  const lineCount: Map<string, number> = new Map();
  
  // Count occurrences of each line (normalized)
  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();
    // Only consider short lines (headers/footers are usually short)
    if (trimmed.length > 0 && trimmed.length < 100) {
      lineCount.set(trimmed, (lineCount.get(trimmed) || 0) + 1);
    }
  }
  
  // Find lines that appear too frequently (likely headers/footers)
  // If a short line appears more than 5 times, it's probably a header/footer
  const repetitiveLines = new Set<string>();
  for (const [line, count] of lineCount.entries()) {
    // A line appearing 5+ times in a document is likely repetitive
    // But don't remove chapter headings - check if it starts with chapter keywords
    if (count >= 5 && !line.match(/^(chapter|part|section|prologue|epilogue)/i)) {
      repetitiveLines.add(line);
    }
  }
  
  // Filter out repetitive lines
  if (repetitiveLines.size === 0) return text;
  
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim().toLowerCase();
    return !repetitiveLines.has(trimmed);
  });
  
  return filteredLines.join('\n');
}

/**
 * Clean and normalize text content with enhanced preprocessing
 */
function cleanText(text: string): string {
  let cleaned = text
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove excessive whitespace but preserve paragraph breaks
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{4,}/g, '\n\n\n')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim();
  
  // Apply noise filtering
  cleaned = stripPageNumbers(cleaned);
  cleaned = removeRepetitiveHeaders(cleaned);
  
  // Final cleanup after filtering
  return cleaned
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

interface ChapterCandidate {
  lineIndex: number;
  number: number;
  title: string;
  patternName: string;
  patternWeight: number;
  originalLine: string;
}

/**
 * Calculate confidence score for detected chapters
 */
function calculateConfidenceScore(
  candidates: ChapterCandidate[],
  chapters: ParsedChapter[],
  totalWordCount: number
): number {
  if (candidates.length < 2 || chapters.length < 2) {
    return 0;
  }
  
  let score = 0;
  const maxScore = 100;
  
  // 1. Sequential numbering check (25 points)
  // Chapters should be numbered somewhat sequentially (allowing for prologue/epilogue)
  const chapterNumbers = candidates
    .map(c => c.number)
    .filter(n => n > 0 && n < 999) // Exclude prologue/epilogue markers
    .sort((a, b) => a - b);
  
  if (chapterNumbers.length >= 2) {
    let sequentialCount = 0;
    for (let i = 1; i < chapterNumbers.length; i++) {
      const diff = chapterNumbers[i] - chapterNumbers[i - 1];
      // Allow gaps of 1-2 (sometimes chapters are skipped)
      if (diff >= 1 && diff <= 2) {
        sequentialCount++;
      }
    }
    const sequentialRatio = sequentialCount / (chapterNumbers.length - 1);
    score += Math.round(sequentialRatio * 25);
  }
  
  // 2. Consistent formatting check (20 points)
  // All chapters should use the same pattern type
  const patternCounts: Record<string, number> = {};
  for (const candidate of candidates) {
    patternCounts[candidate.patternName] = (patternCounts[candidate.patternName] || 0) + 1;
  }
  const dominantPattern = Math.max(...Object.values(patternCounts));
  const consistencyRatio = dominantPattern / candidates.length;
  score += Math.round(consistencyRatio * 20);
  
  // 3. Minimum content per chapter (20 points)
  // Each chapter should have at least 200 words
  const chaptersWithContent = chapters.filter(ch => ch.wordCount >= 200);
  const contentRatio = chaptersWithContent.length / chapters.length;
  score += Math.round(contentRatio * 20);
  
  // 4. Reasonable chapter count (15 points)
  // Should be between 3-50 chapters for a typical book
  if (chapters.length >= 3 && chapters.length <= 50) {
    score += 15;
  } else if (chapters.length >= 2 && chapters.length <= 75) {
    score += 8;
  }
  
  // 5. Similar chapter lengths (10 points)
  // Chapters shouldn't vary wildly in length (within 5x of each other)
  const wordCounts = chapters.map(ch => ch.wordCount).filter(wc => wc > 0);
  if (wordCounts.length >= 2) {
    const minWords = Math.min(...wordCounts);
    const maxWords = Math.max(...wordCounts);
    if (minWords > 0 && maxWords / minWords <= 5) {
      score += 10;
    } else if (minWords > 0 && maxWords / minWords <= 10) {
      score += 5;
    }
  }
  
  // 6. Total coverage (10 points)
  // Detected chapters should cover most of the content
  const coveredWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
  const coverageRatio = coveredWords / totalWordCount;
  if (coverageRatio >= 0.8) {
    score += 10;
  } else if (coverageRatio >= 0.6) {
    score += 5;
  }
  
  return Math.min(score, maxScore);
}

/**
 * Get confidence level from score
 */
function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Detect chapters using strict pattern matching with confidence scoring
 */
function detectChaptersByPattern(content: string, options: ParserOptions): { 
  chapters: ParsedChapter[]; 
  method: string;
  confidence: 'high' | 'medium' | 'low';
  confidenceScore: number;
} | null {
  const lines = content.split('\n');
  const candidates: ChapterCandidate[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines, very long lines, and lines that are too short
    if (!line || line.length > 150 || line.length < 3) continue;
    
    for (const { pattern, name, weight } of STRICT_CHAPTER_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const chapterNum = parseChapterNumber(match[1]);
        let title = match[2]?.trim() || '';
        
        // For special chapters (prologue, epilogue, etc.), use the keyword as title
        if (name === 'special_chapter' && !title) {
          title = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
        } else if (!title) {
          title = `Chapter ${chapterNum}`;
        }
        
        // Verify there's substantial content after this heading
        // Look ahead at least 3 lines and check for meaningful content
        let contentWordCount = 0;
        for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
          const nextLine = lines[j].trim();
          if (nextLine.length > 0) {
            contentWordCount += countWords(nextLine);
          }
          // Stop if we've verified there's enough content
          if (contentWordCount >= 50) break;
        }
        
        // Only accept if there's meaningful content after the heading
        if (contentWordCount >= 20) {
          candidates.push({
            lineIndex: i,
            number: chapterNum,
            title: title || `Chapter ${chapterNum}`,
            patternName: name,
            patternWeight: weight,
            originalLine: line,
          });
          break; // Only match one pattern per line
        }
      }
    }
  }
  
  // Need at least 2 chapter markers
  if (candidates.length < 2) return null;
  
  // Sort by line index
  candidates.sort((a, b) => a.lineIndex - b.lineIndex);
  
  // Extract chapters
  const chapters: ParsedChapter[] = [];
  
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    const nextCandidate = candidates[i + 1];
    
    const startLine = candidate.lineIndex;
    const endLine = nextCandidate ? nextCandidate.lineIndex : lines.length;
    
    // Get content (excluding the chapter heading line itself)
    const chapterLines = lines.slice(startLine + 1, endLine);
    const chapterContent = chapterLines.join('\n').trim();
    const wordCount = countWords(chapterContent);
    
    // Only include chapters with meaningful content
    if (wordCount >= 50) {
      chapters.push({
        number: i + 1,
        title: candidate.title,
        content: chapterContent,
        wordCount,
        startPosition: startLine,
        endPosition: endLine,
      });
    }
  }
  
  // Check if there's substantial content before the first chapter
  if (candidates.length > 0 && candidates[0].lineIndex > 0) {
    const preambleContent = lines.slice(0, candidates[0].lineIndex).join('\n').trim();
    const preambleWords = countWords(preambleContent);
    
    // Only add preamble if it's substantial (not just title page content)
    if (preambleWords >= 300) {
      chapters.unshift({
        number: 0,
        title: 'Introduction',
        content: preambleContent,
        wordCount: preambleWords,
        startPosition: 0,
        endPosition: candidates[0].lineIndex,
      });
      // Renumber all chapters
      chapters.forEach((ch, idx) => ch.number = idx + 1);
    }
  }
  
  if (chapters.length < 2) return null;
  
  // Calculate confidence score
  const totalWordCount = countWords(content);
  const confidenceScore = calculateConfidenceScore(candidates, chapters, totalWordCount);
  const confidence = getConfidenceLevel(confidenceScore);
  
  return { 
    chapters, 
    method: 'chapter_heading',
    confidence,
    confidenceScore,
  };
}

/**
 * Parse PDF file content
 */
async function parsePDF(buffer: Buffer): Promise<string> {
  // Dynamic import to avoid issues with pdf-parse in edge runtime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParseModule = await import('pdf-parse') as any;
  const pdfParse = pdfParseModule.default || pdfParseModule;
  
  try {
    const data = await pdfParse(buffer);
    return cleanText(data.text);
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF file. The file may be corrupted or password-protected.');
  }
}

/**
 * Parse DOCX file content
 */
async function parseDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return cleanText(result.value);
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw new Error('Failed to parse DOCX file. The file may be corrupted.');
  }
}

/**
 * Parse TXT file content
 */
async function parseTXT(buffer: Buffer): Promise<string> {
  // Try UTF-8 first, then fallback to latin1
  let text: string;
  
  try {
    text = buffer.toString('utf-8');
    // Check for encoding issues
    if (text.includes('\ufffd')) {
      // Try latin1 encoding
      text = buffer.toString('latin1');
    }
  } catch {
    text = buffer.toString('latin1');
  }
  
  return cleanText(text);
}

/**
 * Extract potential title and author from content
 */
function extractMetadata(content: string, fileName: string): { title: string; author: string } {
  const lines = content.split('\n').slice(0, 20); // Check first 20 lines
  let title = '';
  let author = '';
  
  // Look for title in first few lines
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    if (line && line.length > 2 && line.length < 150 && !line.match(/^(chapter|part|section)/i)) {
      // First substantial line is likely the title
      if (!title) {
        title = line;
        continue;
      }
      // Second line might be author
      if (line.toLowerCase().startsWith('by ')) {
        author = line.replace(/^by\s+/i, '').trim();
        break;
      }
      if (line.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+$/)) {
        // Looks like a name (First Last)
        author = line;
        break;
      }
    }
  }
  
  // Fallback to filename for title
  if (!title) {
    title = fileName
      .replace(/\.(pdf|docx|txt)$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  return { title, author: author || 'Unknown Author' };
}

/**
 * Main function to parse an uploaded book file
 * Uses conservative approach: only detect chapters when confident,
 * otherwise keep as single chapter for user to split manually
 */
export async function parseBookFile(
  file: File | Buffer,
  fileName: string,
  fileType: 'pdf' | 'docx' | 'txt',
  options: ParserOptions = {}
): Promise<ParsedBook> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Get buffer from file
  let buffer: Buffer;
  if (Buffer.isBuffer(file)) {
    buffer = file;
  } else if ('arrayBuffer' in file && typeof file.arrayBuffer === 'function') {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else {
    throw new Error('Invalid file input: expected Buffer or File');
  }
  
  const fileSize = buffer.length;
  
  // Parse content based on file type
  let rawContent: string;
  
  switch (fileType) {
    case 'pdf':
      rawContent = await parsePDF(buffer);
      break;
    case 'docx':
      rawContent = await parseDOCX(buffer);
      break;
    case 'txt':
      rawContent = await parseTXT(buffer);
      break;
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
  
  if (!rawContent || rawContent.trim().length === 0) {
    throw new Error('No text content could be extracted from the file.');
  }
  
  const totalWordCount = countWords(rawContent);
  
  if (totalWordCount < 100) {
    throw new Error('The file contains too little text content (less than 100 words).');
  }
  
  // Extract metadata
  const { title, author } = extractMetadata(rawContent, fileName);
  
  // Try chapter detection with strict patterns
  const detectionResult = detectChaptersByPattern(rawContent, opts);
  
  let result: {
    chapters: ParsedChapter[];
    method: 'chapter_heading' | 'single_chapter';
    confidence: 'high' | 'medium' | 'low';
    confidenceScore: number;
  };
  
  // Only use detected chapters if confidence is medium or higher
  if (detectionResult && detectionResult.confidenceScore >= 40) {
    result = {
      chapters: detectionResult.chapters,
      method: 'chapter_heading',
      confidence: detectionResult.confidence,
      confidenceScore: detectionResult.confidenceScore,
    };
    
    console.log(`[Parser] Detected ${result.chapters.length} chapters with ${result.confidence} confidence (score: ${result.confidenceScore})`);
  } else {
    // Conservative fallback: keep as single chapter
    // Let user manually split if needed
    result = {
      chapters: [{
        number: 1,
        title: 'Full Content',
        content: rawContent,
        wordCount: totalWordCount,
      }],
      method: 'single_chapter',
      confidence: 'low',
      confidenceScore: detectionResult?.confidenceScore || 0,
    };
    
    console.log(`[Parser] No confident chapter detection (score: ${result.confidenceScore}), keeping as single chapter`);
  }
  
  // Limit number of chapters
  if (result.chapters.length > (opts.maxChapters || 100)) {
    result.chapters = result.chapters.slice(0, opts.maxChapters || 100);
  }
  
  return {
    title,
    author,
    chapters: result.chapters,
    totalWordCount,
    rawContent,
    fileType,
    fileName,
    fileSize,
    detectionMethod: result.method,
    confidence: result.confidence,
    confidenceScore: result.confidenceScore,
  };
}

/**
 * Merge two adjacent chapters
 */
export function mergeChapters(chapters: ParsedChapter[], index1: number, index2: number): ParsedChapter[] {
  if (index1 < 0 || index2 >= chapters.length || Math.abs(index1 - index2) !== 1) {
    throw new Error('Invalid chapter indices for merge');
  }
  
  const minIndex = Math.min(index1, index2);
  const chapter1 = chapters[minIndex];
  const chapter2 = chapters[minIndex + 1];
  
  const mergedChapter: ParsedChapter = {
    number: chapter1.number,
    title: chapter1.title,
    content: chapter1.content + '\n\n' + chapter2.content,
    wordCount: chapter1.wordCount + chapter2.wordCount,
  };
  
  const newChapters = [
    ...chapters.slice(0, minIndex),
    mergedChapter,
    ...chapters.slice(minIndex + 2),
  ];
  
  // Renumber chapters
  return newChapters.map((ch, idx) => ({ ...ch, number: idx + 1 }));
}

/**
 * Split a chapter at a specific position
 */
export function splitChapter(
  chapters: ParsedChapter[],
  chapterIndex: number,
  splitPosition: number,
  newTitle?: string
): ParsedChapter[] {
  if (chapterIndex < 0 || chapterIndex >= chapters.length) {
    throw new Error('Invalid chapter index for split');
  }
  
  const chapter = chapters[chapterIndex];
  const content1 = chapter.content.substring(0, splitPosition).trim();
  const content2 = chapter.content.substring(splitPosition).trim();
  
  if (!content1 || !content2) {
    throw new Error('Split position would result in an empty chapter');
  }
  
  const chapter1: ParsedChapter = {
    number: chapter.number,
    title: chapter.title,
    content: content1,
    wordCount: countWords(content1),
  };
  
  const chapter2: ParsedChapter = {
    number: chapter.number + 1,
    title: newTitle || `Chapter ${chapter.number + 1}`,
    content: content2,
    wordCount: countWords(content2),
  };
  
  const newChapters = [
    ...chapters.slice(0, chapterIndex),
    chapter1,
    chapter2,
    ...chapters.slice(chapterIndex + 1),
  ];
  
  // Renumber chapters
  return newChapters.map((ch, idx) => ({ ...ch, number: idx + 1 }));
}

/**
 * Validate file type from filename
 */
export function getFileType(fileName: string): 'pdf' | 'docx' | 'txt' | null {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'pdf':
      return 'pdf';
    case 'docx':
    case 'doc':
      return 'docx';
    case 'txt':
      return 'txt';
    default:
      return null;
  }
}

/**
 * Get supported file types
 */
export function getSupportedFileTypes(): string[] {
  return ['pdf', 'docx', 'doc', 'txt'];
}

/**
 * Get MIME types for supported files
 */
export function getSupportedMimeTypes(): string[] {
  return [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
  ];
}
