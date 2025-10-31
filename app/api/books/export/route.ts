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
      author: book.author || 'Unknown Author',
      description: book.summary || '',
      genre: book.genre || 'Unknown Genre',
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
    try {
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
          console.log(`Generating PDF for book: ${book.title} with ${exportData.chapters.length} chapters`);
          content = await ExportServiceAdvanced.exportBookAsPDF(exportData);
          mimeType = 'application/pdf';
          filename = `${baseFilename}.pdf`;
          console.log(`PDF generated successfully, size: ${content.length} bytes`);
          break;

        case 'docx':
          console.log(`Generating DOCX for book: ${book.title}`);
          content = await ExportServiceAdvanced.exportBookAsDOCX(exportData);
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          filename = `${baseFilename}.docx`;
          console.log(`DOCX generated successfully, size: ${content.length} bytes`);
          break;
        
        default:
          return NextResponse.json(
            { error: 'Invalid format' },
            { status: 400 }
          );
      }
    } catch (exportError) {
      console.error(`Error generating ${format} export:`, exportError);
      return NextResponse.json(
        { 
          error: `Failed to generate ${format.toUpperCase()} export`, 
          details: exportError instanceof Error ? exportError.message : 'Unknown error' 
        },
        { status: 500 }
      );
    }

    console.log(`Exported book ${bookId} as ${format}`);

    // Return the content with appropriate headers for download
    const contentBuffer = typeof content === 'string' ? Buffer.from(content) : content;
    return new NextResponse(new Uint8Array(contentBuffer), {
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
