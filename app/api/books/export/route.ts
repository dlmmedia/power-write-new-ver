import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getBookWithChaptersAndBibliography } from '@/lib/db/operations';
import { ExportService } from '@/lib/services/export-service';
import { ExportServiceAdvanced } from '@/lib/services/export-service-advanced';
import { BibliographyConfig, Reference, Author } from '@/lib/types/bibliography';
import { PublishingSettings, DEFAULT_PUBLISHING_SETTINGS } from '@/lib/types/publishing';
import { BookLayoutType, BOOK_LAYOUTS } from '@/lib/types/book-layouts';
import { getUserInfo } from '@/lib/services/user-service';

// Configure route for longer execution time and Node.js runtime
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for export generation

export async function POST(request: NextRequest) {
  try {
    // Use Clerk server-side authentication
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to export books' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookId, format, layoutType } = body as {
      bookId: string | number;
      format: 'txt' | 'md' | 'html' | 'pdf' | 'docx' | 'epub';
      layoutType?: BookLayoutType; // Optional layout type for PDF export
    };

    // Validate required fields
    if (!bookId || !format) {
      return NextResponse.json(
        { error: 'Missing required fields: bookId, format' },
        { status: 400 }
      );
    }

    if (!['txt', 'md', 'html', 'pdf', 'docx', 'epub'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be txt, md, html, pdf, docx, or epub' },
        { status: 400 }
      );
    }

    // Get book with chapters and bibliography
    const book = await getBookWithChaptersAndBibliography(bookId);
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Check if user is Pro - Pro users can export any book
    const userInfo = await getUserInfo(clerkUserId);
    const isProUser = userInfo?.tier === 'pro';
    
    // Verify ownership using Clerk userId OR if user is Pro
    if (book.userId !== clerkUserId && !isProUser) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not own this book' },
        { status: 403 }
      );
    }
    
    // Pro users can export any book, but log for audit purposes
    if (book.userId !== clerkUserId && isProUser) {
      console.log(`[Export] Pro user ${clerkUserId} exporting book ${bookId} owned by ${book.userId}`);
    }

    // Convert database bibliography to export format
    let bibliographyData = undefined;
    if (book.bibliography?.config?.enabled && book.bibliography.references.length > 0) {
      // Convert database references to the Reference type expected by export
      const convertedReferences: Reference[] = book.bibliography.references.map(ref => {
        // Parse authors from JSONB
        const authors: Author[] = Array.isArray(ref.authors) 
          ? (ref.authors as any[]).map((a: any) => ({
              firstName: a.firstName || '',
              middleName: a.middleName,
              lastName: a.lastName || '',
              suffix: a.suffix,
              organization: a.organization,
            }))
          : [];
        
        // Get type-specific data
        const typeData = (ref.typeSpecificData as Record<string, any>) || {};
        
        // Build base reference
        const baseRef = {
          id: ref.id,
          type: ref.type as any,
          title: ref.title,
          authors,
          year: ref.year || undefined,
          url: ref.url || undefined,
          doi: ref.doi || undefined,
          accessDate: ref.accessDate || undefined,
          notes: ref.notes || undefined,
          tags: Array.isArray(ref.tags) ? ref.tags as string[] : undefined,
          citationKey: ref.citationKey || undefined,
          createdAt: ref.createdAt || new Date(),
          updatedAt: ref.updatedAt || new Date(),
          // Spread type-specific data
          ...typeData,
        };
        
        return baseRef as Reference;
      });

      // Convert config to BibliographyConfig format
      const config = book.bibliography.config;
      const bibliographyConfig: BibliographyConfig = {
        enabled: config.enabled || false,
        citationStyle: (config.citationStyle as any) || 'APA',
        location: Array.isArray(config.location) ? config.location as any[] : ['bibliography'],
        sortBy: (config.sortBy as any) || 'author',
        sortDirection: (config.sortDirection as any) || 'asc',
        includeAnnotations: config.includeAnnotations || false,
        includeAbstracts: config.includeAbstracts || false,
        hangingIndent: config.hangingIndent ?? true,
        lineSpacing: (config.lineSpacing as any) || 'single',
        groupByType: config.groupByType || false,
        numberingStyle: (config.numberingStyle as any) || 'none',
        showDOI: config.showDOI ?? true,
        showURL: config.showURL ?? true,
        showAccessDate: config.showAccessDate ?? true,
      };

      bibliographyData = {
        config: bibliographyConfig,
        references: convertedReferences,
      };
      
      console.log(`Book has bibliography enabled with ${convertedReferences.length} references`);
    }

    // Get backCoverUrl and publishingSettings from metadata
    const bookMetadata = (book.metadata as Record<string, unknown>) || {};
    const publishingSettings: PublishingSettings = (bookMetadata.publishingSettings as PublishingSettings) || DEFAULT_PUBLISHING_SETTINGS;
    
    // Determine the layout type: request param > publishing settings > default
    const effectiveLayoutType: BookLayoutType = layoutType || 
      publishingSettings.layoutType || 
      'novel-classic';
    
    // Validate layout type exists
    if (!BOOK_LAYOUTS[effectiveLayoutType]) {
      console.warn(`Unknown layout type: ${effectiveLayoutType}, falling back to novel-classic`);
    }
    
    // Prepare export data
    const exportData = {
      title: book.title,
      author: book.author || 'Unknown Author',
      description: book.summary || '',
      genre: book.genre || 'Unknown Genre',
      coverUrl: book.coverUrl || undefined, // Include front cover image URL if available
      backCoverUrl: (bookMetadata.backCoverUrl as string) || undefined, // Include back cover image URL from metadata
      chapters: book.chapters
        .sort((a, b) => a.chapterNumber - b.chapterNumber)
        .map(ch => ({
          number: ch.chapterNumber,
          title: ch.title,
          content: ch.content,
        })),
      bibliography: bibliographyData,
      publishingSettings, // Include publishing settings for formatted exports
      layoutType: effectiveLayoutType, // Include layout type for PDF export
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
          try {
            console.log(`Generating PDF for book: ${book.title} with ${exportData.chapters.length} chapters`);
            console.log(`Using layout: ${effectiveLayoutType} (${BOOK_LAYOUTS[effectiveLayoutType]?.name || 'Unknown'})`);
            content = await ExportServiceAdvanced.exportBookAsPDF(exportData);
            mimeType = 'application/pdf';
            filename = `${baseFilename}.pdf`;
            console.log(`PDF generated successfully, size: ${content.length} bytes`);
          } catch (pdfError) {
            console.error('PDF generation error details:', pdfError);
            throw new Error(`PDF generation failed: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
          }
          break;

        case 'docx':
          console.log(`Generating DOCX for book: ${book.title}`);
          content = await ExportServiceAdvanced.exportBookAsDOCX(exportData);
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          filename = `${baseFilename}.docx`;
          console.log(`DOCX generated successfully, size: ${content.length} bytes`);
          break;

        case 'epub':
          try {
            console.log(`Generating EPUB for book: ${book.title} with ${exportData.chapters.length} chapters`);
            content = await ExportServiceAdvanced.exportBookAsEPUB(exportData);
            mimeType = 'application/epub+zip';
            filename = `${baseFilename}.epub`;
            console.log(`EPUB generated successfully, size: ${content.length} bytes`);
          } catch (epubError) {
            console.error('EPUB generation error details:', epubError);
            throw new Error(`EPUB generation failed: ${epubError instanceof Error ? epubError.message : 'Unknown error'}`);
          }
          break;
        
        default:
          return NextResponse.json(
            { error: 'Invalid format' },
            { status: 400 }
          );
      }
    } catch (exportError) {
      console.error(`Error generating ${format} export:`, exportError);
      console.error('Export error stack:', exportError instanceof Error ? exportError.stack : 'No stack');
      
      const errorResponse = { 
        error: `Failed to generate ${format.toUpperCase()} export`, 
        details: exportError instanceof Error ? exportError.message : 'Unknown error',
        format,
        timestamp: new Date().toISOString()
      };
      
      console.error('Sending export error response:', JSON.stringify(errorResponse));
      
      return new NextResponse(
        JSON.stringify(errorResponse),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
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
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = { 
      error: 'Failed to export book', 
      details: errorMessage,
      timestamp: new Date().toISOString()
    };
    
    console.error('Returning error response:', JSON.stringify(errorResponse));
    
    return new NextResponse(
      JSON.stringify(errorResponse),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}
