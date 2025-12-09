import { NextRequest, NextResponse } from 'next/server';
import {
  getBookBibliography,
  getBibliographyConfig,
  upsertBibliographyConfig,
  createBibliographyReference,
  updateBibliographyReference,
  deleteBibliographyReference,
  getBibliographyReferences,
  ensureDemoUser,
  getBook,
} from '@/lib/db/operations';

export const runtime = 'nodejs';

// GET - Fetch bibliography data for a book
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id, 10);

    if (isNaN(bookId)) {
      return NextResponse.json(
        { error: 'Invalid book ID' },
        { status: 400 }
      );
    }

    const bibliography = await getBookBibliography(bookId);
    
    return NextResponse.json({
      success: true,
      data: bibliography,
    });
  } catch (error) {
    console.error('Error fetching bibliography:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bibliography' },
      { status: 500 }
    );
  }
}

// POST - Create or update bibliography config and add references
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id, 10);
    const body = await request.json();
    const { userId, config, reference, action } = body;

    if (isNaN(bookId)) {
      return NextResponse.json(
        { error: 'Invalid book ID' },
        { status: 400 }
      );
    }

    // Verify user owns the book
    await ensureDemoUser(userId);
    const book = await getBook(bookId);
    if (!book || book.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Handle config update
    if (config) {
      const updatedConfig = await upsertBibliographyConfig({
        bookId,
        enabled: config.enabled ?? false,
        citationStyle: config.citationStyle ?? 'APA',
        location: config.location ?? ['bibliography'],
        sortBy: config.sortBy ?? 'author',
        sortDirection: config.sortDirection ?? 'asc',
        includeAnnotations: config.includeAnnotations ?? false,
        includeAbstracts: config.includeAbstracts ?? false,
        hangingIndent: config.hangingIndent ?? true,
        lineSpacing: config.lineSpacing ?? 'single',
        groupByType: config.groupByType ?? false,
        numberingStyle: config.numberingStyle ?? 'none',
        showDOI: config.showDOI ?? true,
        showURL: config.showURL ?? true,
        showAccessDate: config.showAccessDate ?? true,
      });

      return NextResponse.json({
        success: true,
        data: { config: updatedConfig },
      });
    }

    // Handle reference operations
    if (reference) {
      if (action === 'create') {
        // Create new reference
        const newRef = await createBibliographyReference({
          id: reference.id,
          bookId,
          type: reference.type,
          title: reference.title,
          authors: reference.authors,
          year: reference.year,
          publisher: reference.publisher,
          url: reference.url,
          doi: reference.doi,
          accessDate: reference.accessDate,
          typeSpecificData: reference.typeSpecificData || extractTypeSpecificData(reference),
          notes: reference.notes,
          tags: reference.tags,
          citationKey: reference.citationKey,
        });

        return NextResponse.json({
          success: true,
          data: { reference: newRef },
        });
      }

      if (action === 'update') {
        const updatedRef = await updateBibliographyReference(reference.id, {
          type: reference.type,
          title: reference.title,
          authors: reference.authors,
          year: reference.year,
          publisher: reference.publisher,
          url: reference.url,
          doi: reference.doi,
          accessDate: reference.accessDate,
          typeSpecificData: reference.typeSpecificData || extractTypeSpecificData(reference),
          notes: reference.notes,
          tags: reference.tags,
          citationKey: reference.citationKey,
        });

        return NextResponse.json({
          success: true,
          data: { reference: updatedRef },
        });
      }

      if (action === 'delete') {
        await deleteBibliographyReference(reference.id);
        return NextResponse.json({
          success: true,
          message: 'Reference deleted',
        });
      }
    }

    return NextResponse.json(
      { error: 'Invalid request - must provide config or reference with action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error managing bibliography:', error);
    return NextResponse.json(
      { error: 'Failed to manage bibliography' },
      { status: 500 }
    );
  }
}

// Helper to extract type-specific data from a reference
function extractTypeSpecificData(reference: any): Record<string, any> {
  const commonFields = [
    'id', 'bookId', 'type', 'title', 'authors', 'year',
    'publisher', 'url', 'doi', 'accessDate', 'notes', 'tags',
    'citationKey', 'createdAt', 'updatedAt'
  ];

  const typeSpecific: Record<string, any> = {};
  
  Object.keys(reference).forEach(key => {
    if (!commonFields.includes(key)) {
      typeSpecific[key] = reference[key];
    }
  });

  return typeSpecific;
}







