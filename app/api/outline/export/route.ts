import { NextRequest, NextResponse } from 'next/server';
import { ExportServiceAdvanced } from '@/lib/services/export-service-advanced';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { outline, format } = body as {
      outline: {
        title: string;
        author: string;
        description?: string;
        chapters: Array<{
          number: number;
          title: string;
          summary: string;
          wordCount: number;
        }>;
        themes?: string[];
        characters?: Array<{ name: string; role: string }>;
      };
      format: 'pdf' | 'docx';
    };

    // Validate required fields
    if (!outline || !format) {
      return NextResponse.json(
        { error: 'Missing required fields: outline, format' },
        { status: 400 }
      );
    }

    if (!['pdf', 'docx'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be pdf or docx' },
        { status: 400 }
      );
    }

    const baseFilename = outline.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    let content: Buffer;
    let mimeType: string;
    let filename: string;

    // Generate export based on format
    switch (format) {
      case 'pdf':
        content = await ExportServiceAdvanced.exportOutlineAsPDF(outline);
        mimeType = 'application/pdf';
        filename = `${baseFilename}_outline.pdf`;
        break;

      case 'docx':
        content = await ExportServiceAdvanced.exportOutlineAsDOCX(outline);
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = `${baseFilename}_outline.docx`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid format' },
          { status: 400 }
        );
    }

    console.log(`Exported outline "${outline.title}" as ${format}`);

    // Return the content with appropriate headers for download
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(content.length),
      },
    });
  } catch (error) {
    console.error('Error exporting outline:', error);
    return NextResponse.json(
      { 
        error: 'Failed to export outline', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
