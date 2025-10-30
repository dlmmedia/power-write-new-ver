import { NextRequest, NextResponse } from 'next/server';
import { getBookWithChapters, ensureDemoUser } from '@/lib/db/operations';
import { ExportService } from '@/lib/services/export-service';
import { ExportServiceAdvanced } from '@/lib/services/export-service-advanced';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, bookId, format } = body as {
      userId: string;
      bookId: string | number;
      format: 'txt' | 'md' | 'html' | 'pdf' | 'docx';
    };

    // Validate required fields
    if (!userId || !bookId || !format) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, bookId, format' },
        { status: 400 }
      );
    }

    if (!['txt', 'md', 'html', 'pdf', 'docx'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be txt, md, html, pdf, or docx' },
        { status: 400 }
      );
    }

    // Ensure demo user exists
    await ensureDemoUser(userId);

    // Get book with chapters
    const book = await getBookWithChapters(bookId);
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (book.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Prepare export data
    const exportData = {
      title: book.title,
      author: book.author,
      description: book.description || '',
      genre: book.genre,
      chapters: book.chapters
        .sort((a, b) => a.chapterNumber - b.chapterNumber)
        .map(ch => ({
          number: ch.chapterNumber,
          title: ch.title,
          content: ch.content,
        })),
    };

    const baseFilename = book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    let content: Buffer | string;
    let mimeType: string;
    let filename: string;

    // Generate export based on format
    switch (format) {
      case 'txt':
        content = ExportService.exportAsText(exportData);
        mimeType = 'text/plain';
        filename = `${baseFilename}.txt`;
        break;
      
      case 'md':
        content = ExportService.exportAsMarkdown(exportData);
        mimeType = 'text/markdown';
        filename = `${baseFilename}.md`;
        break;
      
      case 'html':
        content = ExportService.exportAsHTML(exportData);
        mimeType = 'text/html';
        filename = `${baseFilename}.html`;
        break;

      case 'pdf':
        content = await ExportServiceAdvanced.exportBookAsPDF(exportData);
        mimeType = 'application/pdf';
        filename = `${baseFilename}.pdf`;
        break;

      case 'docx':
        content = await ExportServiceAdvanced.exportBookAsDOCX(exportData);
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = `${baseFilename}.docx`;
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid format' },
          { status: 400 }
        );
    }

    console.log(`Exported book ${bookId} as ${format}`);

    // Return the content with appropriate headers for download
    const contentBuffer = typeof content === 'string' ? Buffer.from(content) : content;
    return new NextResponse(contentBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(contentBuffer.length),
      },
    });
  } catch (error) {
    console.error('Error exporting book:', error);
    return NextResponse.json(
      { 
        error: 'Failed to export book', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
