import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  parseBookFile, 
  getFileType, 
  getSupportedMimeTypes,
  type ParsedBook 
} from '@/lib/services/book-parser-service';

// Set max duration for parsing large files
export const maxDuration = 60;

// Max file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * POST /api/books/upload
 * Upload and parse a book file (PDF, DOCX, TXT)
 * Returns parsed content with detected chapters for review
 */
export async function POST(request: NextRequest) {
  console.log('[Upload] Book upload request received');
  
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the form data with the uploaded file
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    console.log(`[Upload] File received: ${file.name}, size: ${file.size}, type: ${file.type}`);

    // Validate file type by extension
    const fileType = getFileType(file.name);
    if (!fileType) {
      return NextResponse.json(
        { 
          error: 'Unsupported file type',
          details: 'Please upload a PDF, DOCX, or TXT file.',
          supportedTypes: ['pdf', 'docx', 'txt'],
        },
        { status: 400 }
      );
    }

    // Validate MIME type
    const supportedMimes = getSupportedMimeTypes();
    if (!supportedMimes.includes(file.type) && file.type !== 'application/octet-stream') {
      console.warn(`[Upload] Unexpected MIME type: ${file.type}, but extension is valid`);
      // Continue anyway if extension is valid
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: 'File too large',
          details: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
        },
        { status: 400 }
      );
    }

    // Check for empty file
    if (file.size === 0) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      );
    }

    console.log(`[Upload] Parsing ${fileType.toUpperCase()} file...`);

    // Parse the book file
    let parsedBook: ParsedBook;
    try {
      parsedBook = await parseBookFile(file, file.name, fileType);
    } catch (parseError) {
      console.error('[Upload] Parse error:', parseError);
      return NextResponse.json(
        { 
          error: 'Failed to parse file',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
        },
        { status: 422 }
      );
    }

    console.log(`[Upload] Successfully parsed: ${parsedBook.chapters.length} chapters, ${parsedBook.totalWordCount} words`);
    console.log(`[Upload] Detection method: ${parsedBook.detectionMethod}, confidence: ${parsedBook.confidence} (score: ${parsedBook.confidenceScore})`);

    // Return parsed data for review (don't include raw content to save bandwidth)
    return NextResponse.json({
      success: true,
      data: {
        title: parsedBook.title,
        author: parsedBook.author,
        chapters: parsedBook.chapters.map(ch => ({
          number: ch.number,
          title: ch.title,
          content: ch.content,
          wordCount: ch.wordCount,
        })),
        totalWordCount: parsedBook.totalWordCount,
        chapterCount: parsedBook.chapters.length,
        fileType: parsedBook.fileType,
        fileName: parsedBook.fileName,
        fileSize: parsedBook.fileSize,
        detectionMethod: parsedBook.detectionMethod,
        confidence: parsedBook.confidence,
        confidenceScore: parsedBook.confidenceScore,
      },
    });
  } catch (error) {
    console.error('[Upload] Error processing upload:', error);
    return NextResponse.json(
      {
        error: 'Failed to process upload',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
