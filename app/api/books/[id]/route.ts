import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getBookWithChaptersAndBibliography } from '@/lib/db/operations';
import { BibliographyConfig, Reference, Author } from '@/lib/types/bibliography';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params;
    
    // Get current user ID for ownership check
    let currentUserId: string | null = null;
    try {
      const { userId } = await auth();
      currentUserId = userId;
    } catch {
      // Not authenticated, that's ok - just won't have ownership info
    }

    // Get book with all chapters and bibliography from database
    const bookWithChapters = await getBookWithChaptersAndBibliography(bookId);

    if (!bookWithChapters) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Format the response
    const metadata = bookWithChapters.metadata as any || {};
    
    // Convert database bibliography to response format
    let bibliographyData = undefined;
    if (bookWithChapters.bibliography?.config?.enabled && bookWithChapters.bibliography.references.length > 0) {
      // Convert database references to the Reference type
      const convertedReferences: Reference[] = bookWithChapters.bibliography.references.map(ref => {
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
      const config = bookWithChapters.bibliography.config;
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
    }
    
    // Check if current user owns this book
    const isOwner = currentUserId ? bookWithChapters.userId === currentUserId : false;
    
    const book = {
      id: bookWithChapters.id,
      title: bookWithChapters.title,
      author: bookWithChapters.author,
      genre: bookWithChapters.genre,
      subgenre: '',
      status: bookWithChapters.status,
      coverUrl: bookWithChapters.coverUrl || undefined, // Include cover URL
      backCoverUrl: metadata.backCoverUrl || undefined, // Include back cover URL from metadata
      isPublic: bookWithChapters.isPublic || false, // Include public showcase status
      isOwner, // Whether the current user owns this book
      createdAt: bookWithChapters.createdAt?.toISOString() || new Date().toISOString(),
      metadata: {
        wordCount: metadata.wordCount || 0,
        chapters: bookWithChapters.chapters.length,
        targetWordCount: metadata.targetWordCount || 0,
        description: bookWithChapters.summary || '',
        backCoverUrl: metadata.backCoverUrl || undefined, // Also include in metadata for reference
        modelUsed: metadata.modelUsed || undefined, // Model used for generation
      },
      chapters: bookWithChapters.chapters.map(ch => ({
        id: ch.id,
        number: ch.chapterNumber,
        title: ch.title,
        content: ch.content,
        wordCount: ch.wordCount || 0,
        status: ch.isEdited ? 'edited' : 'draft',
        audioUrl: ch.audioUrl || null,
        audioDuration: ch.audioDuration || null,
        audioMetadata: ch.audioMetadata || null,
      })),
      bibliography: bibliographyData,
    };

    return NextResponse.json({
      success: true,
      book
    });
  } catch (error) {
    console.error('Error fetching book detail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch book details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id, 10);
    const updates = await request.json();

    const { updateBook } = await import('@/lib/db/operations');
    const updatedBook = await updateBook(bookId, updates);

    if (!updatedBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      book: updatedBook
    });
  } catch (error) {
    console.error('Error updating book:', error);
    return NextResponse.json(
      { error: 'Failed to update book' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id, 10);

    const { deleteBook, getBook } = await import('@/lib/db/operations');
    const book = await getBook(bookId);

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    await deleteBook(bookId);

    return NextResponse.json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json(
      { error: 'Failed to delete book' },
      { status: 500 }
    );
  }
}
