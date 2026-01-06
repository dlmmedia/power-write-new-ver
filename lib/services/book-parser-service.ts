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
  detectionMethod: 'chapter_heading' | 'numbered_sections' | 'page_breaks' | 'word_count_split' | 'single_chapter';
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

// Chapter detection patterns
const CHAPTER_PATTERNS = [
  // "Chapter 1" or "Chapter One" or "CHAPTER 1" with optional colon and title
  /^(?:chapter|ch\.?)\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|\w+teen|\w+ty(?:-\w+)?)\s*(?:[:.\-–—]\s*)?(.*)$/im,
  // "Part 1" or "Part One" or "PART I"
  /^(?:part)\s*(\d+|[ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:[:.\-–—]\s*)?(.*)$/im,
  // Numbered sections: "1." or "1)" at start of line
  /^(\d+)[.)]\s+(.+)$/m,
  // Roman numerals: "I." or "II." or "III."
  /^([IVXLCDM]+)[.)]\s+(.+)$/m,
  // Section headers
  /^(?:section)\s*(\d+)\s*(?:[:.\-–—]\s*)?(.*)$/im,
];

// Word number to digit mapping
const WORD_TO_NUMBER: Record<string, number> = {
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
  'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
};

/**
 * Parse a number from various formats (digit, word, roman numeral)
 */
function parseChapterNumber(value: string): number {
  const normalized = value.toLowerCase().trim();
  
  // Try direct number
  const num = parseInt(normalized, 10);
  if (!isNaN(num)) return num;
  
  // Try word number
  if (WORD_TO_NUMBER[normalized]) return WORD_TO_NUMBER[normalized];
  
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
 * Clean and normalize text content
 */
function cleanText(text: string): string {
  return text
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
}

/**
 * Detect chapters using pattern matching
 */
function detectChaptersByPattern(content: string): { chapters: ParsedChapter[], method: string } | null {
  const lines = content.split('\n');
  const chapterMarkers: { lineIndex: number; number: number; title: string; pattern: string }[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.length > 200) continue; // Skip empty lines and very long lines
    
    for (const pattern of CHAPTER_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const chapterNum = parseChapterNumber(match[1]);
        const title = match[2]?.trim() || `Chapter ${chapterNum}`;
        
        // Avoid false positives by checking context
        // A chapter heading should typically be followed by content
        const nextLineIndex = i + 1;
        const hasFollowingContent = nextLineIndex < lines.length && 
          (lines[nextLineIndex].trim().length > 0 || 
           (nextLineIndex + 1 < lines.length && lines[nextLineIndex + 1].trim().length > 0));
        
        if (hasFollowingContent) {
          chapterMarkers.push({
            lineIndex: i,
            number: chapterNum,
            title: title || `Chapter ${chapterNum}`,
            pattern: pattern.source,
          });
          break; // Only match one pattern per line
        }
      }
    }
  }
  
  // Need at least 2 chapter markers to consider pattern detection successful
  if (chapterMarkers.length < 2) return null;
  
  // Sort by line index
  chapterMarkers.sort((a, b) => a.lineIndex - b.lineIndex);
  
  // Extract chapters
  const chapters: ParsedChapter[] = [];
  
  for (let i = 0; i < chapterMarkers.length; i++) {
    const marker = chapterMarkers[i];
    const nextMarker = chapterMarkers[i + 1];
    
    const startLine = marker.lineIndex;
    const endLine = nextMarker ? nextMarker.lineIndex : lines.length;
    
    // Include the chapter heading line and all content until next chapter
    const chapterLines = lines.slice(startLine + 1, endLine);
    const chapterContent = chapterLines.join('\n').trim();
    
    if (chapterContent.length > 0) {
      chapters.push({
        number: i + 1, // Renumber sequentially
        title: marker.title,
        content: chapterContent,
        wordCount: countWords(chapterContent),
        startPosition: startLine,
        endPosition: endLine,
      });
    }
  }
  
  // Check if any content before the first chapter marker
  if (chapterMarkers.length > 0 && chapterMarkers[0].lineIndex > 0) {
    const preambleContent = lines.slice(0, chapterMarkers[0].lineIndex).join('\n').trim();
    if (countWords(preambleContent) > 200) {
      // Add preamble as a "Prologue" or "Introduction" chapter
      chapters.unshift({
        number: 0,
        title: 'Introduction',
        content: preambleContent,
        wordCount: countWords(preambleContent),
        startPosition: 0,
        endPosition: chapterMarkers[0].lineIndex,
      });
      // Renumber all chapters
      chapters.forEach((ch, idx) => ch.number = idx + 1);
    }
  }
  
  return chapters.length >= 2 ? { chapters, method: 'chapter_heading' } : null;
}

/**
 * Detect chapters by page breaks (multiple newlines)
 */
function detectChaptersByPageBreaks(content: string, options: ParserOptions): { chapters: ParsedChapter[], method: string } | null {
  // Split by multiple newlines (3+)
  const sections = content.split(/\n{3,}/);
  
  if (sections.length < 2) return null;
  
  const chapters: ParsedChapter[] = [];
  let currentContent = '';
  let chapterNumber = 1;
  
  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;
    
    currentContent += (currentContent ? '\n\n' : '') + trimmed;
    const wordCount = countWords(currentContent);
    
    // Create a new chapter if we have enough content
    if (wordCount >= (options.minChapterWordCount || 500)) {
      // Try to extract a title from the first line
      const lines = currentContent.split('\n');
      const firstLine = lines[0].trim();
      let title = `Chapter ${chapterNumber}`;
      let chapterContent = currentContent;
      
      // If first line is short and looks like a title, use it
      if (firstLine.length < 100 && firstLine.length > 0 && lines.length > 1) {
        const restContent = lines.slice(1).join('\n').trim();
        if (restContent.length > 0) {
          title = firstLine;
          chapterContent = restContent;
        }
      }
      
      chapters.push({
        number: chapterNumber,
        title,
        content: chapterContent,
        wordCount: countWords(chapterContent),
      });
      
      chapterNumber++;
      currentContent = '';
    }
  }
  
  // Add any remaining content
  if (currentContent.trim()) {
    const wordCount = countWords(currentContent);
    if (wordCount > 100) { // Don't add very short trailing content
      chapters.push({
        number: chapterNumber,
        title: `Chapter ${chapterNumber}`,
        content: currentContent.trim(),
        wordCount,
      });
    } else if (chapters.length > 0) {
      // Append to last chapter
      chapters[chapters.length - 1].content += '\n\n' + currentContent.trim();
      chapters[chapters.length - 1].wordCount = countWords(chapters[chapters.length - 1].content);
    }
  }
  
  return chapters.length >= 2 ? { chapters, method: 'page_breaks' } : null;
}

/**
 * Split content by word count when no other structure is detected
 */
function splitByWordCount(content: string, options: ParserOptions): { chapters: ParsedChapter[], method: string } {
  const targetLength = options.preferredChapterLength || 3000;
  const words = content.split(/\s+/);
  const chapters: ParsedChapter[] = [];
  
  let currentWords: string[] = [];
  let chapterNumber = 1;
  
  for (const word of words) {
    currentWords.push(word);
    
    if (currentWords.length >= targetLength) {
      // Try to break at a sentence end
      const chapterContent = currentWords.join(' ');
      const lastPeriod = chapterContent.lastIndexOf('. ');
      
      if (lastPeriod > chapterContent.length * 0.7) {
        // Break at the sentence
        const content1 = chapterContent.substring(0, lastPeriod + 1);
        const content2 = chapterContent.substring(lastPeriod + 2);
        
        chapters.push({
          number: chapterNumber,
          title: `Chapter ${chapterNumber}`,
          content: content1.trim(),
          wordCount: countWords(content1),
        });
        
        chapterNumber++;
        currentWords = content2.split(/\s+/);
      } else {
        chapters.push({
          number: chapterNumber,
          title: `Chapter ${chapterNumber}`,
          content: chapterContent.trim(),
          wordCount: currentWords.length,
        });
        
        chapterNumber++;
        currentWords = [];
      }
    }
  }
  
  // Add remaining content
  if (currentWords.length > 0) {
    const content = currentWords.join(' ').trim();
    if (content) {
      chapters.push({
        number: chapterNumber,
        title: `Chapter ${chapterNumber}`,
        content,
        wordCount: currentWords.length,
      });
    }
  }
  
  return { chapters, method: 'word_count_split' };
}

/**
 * Parse PDF file content
 */
async function parsePDF(buffer: Buffer): Promise<string> {
  // Dynamic import to avoid issues with pdf-parse in edge runtime
  const pdfParse = (await import('pdf-parse')).default;
  
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
  if (file instanceof Buffer) {
    buffer = file;
  } else {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
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
  
  // Try chapter detection methods in order of preference
  let result = detectChaptersByPattern(rawContent);
  
  if (!result) {
    result = detectChaptersByPageBreaks(rawContent, opts);
  }
  
  if (!result) {
    // If content is short enough, keep as single chapter
    if (totalWordCount < (opts.preferredChapterLength || 3000) * 2) {
      result = {
        chapters: [{
          number: 1,
          title: 'Full Content',
          content: rawContent,
          wordCount: totalWordCount,
        }],
        method: 'single_chapter',
      };
    } else {
      result = splitByWordCount(rawContent, opts);
    }
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
    detectionMethod: result.method as ParsedBook['detectionMethod'],
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
