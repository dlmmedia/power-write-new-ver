import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generatedBooks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { PublishingSettings, DEFAULT_PUBLISHING_SETTINGS } from '@/lib/types/publishing';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Fetch publishing settings for a book
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const bookId = parseInt(id);

    if (isNaN(bookId)) {
      return NextResponse.json({ error: 'Invalid book ID' }, { status: 400 });
    }

    const books = await db
      .select()
      .from(generatedBooks)
      .where(eq(generatedBooks.id, bookId))
      .limit(1);

    if (!books.length) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const book = books[0];
    
    // Extract publishing settings from metadata or use defaults
    const metadata = book.metadata as Record<string, unknown> | null;
    const publishingSettings = (metadata?.publishingSettings as PublishingSettings) || DEFAULT_PUBLISHING_SETTINGS;

    return NextResponse.json({
      success: true,
      publishingSettings,
    });
  } catch (error) {
    console.error('Error fetching publishing settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch publishing settings' },
      { status: 500 }
    );
  }
}

// PUT - Update publishing settings for a book
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const bookId = parseInt(id);

    if (isNaN(bookId)) {
      return NextResponse.json({ error: 'Invalid book ID' }, { status: 400 });
    }

    const body = await request.json();
    const { publishingSettings } = body as { publishingSettings: PublishingSettings };

    if (!publishingSettings) {
      return NextResponse.json({ error: 'Publishing settings required' }, { status: 400 });
    }

    // Validate required fields
    if (!publishingSettings.bookType || !publishingSettings.trimSize) {
      return NextResponse.json({ error: 'Invalid publishing settings' }, { status: 400 });
    }

    // Get current book
    const books = await db
      .select()
      .from(generatedBooks)
      .where(eq(generatedBooks.id, bookId))
      .limit(1);

    if (!books.length) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const book = books[0];
    const currentMetadata = (book.metadata as Record<string, unknown>) || {};

    // Update metadata with new publishing settings
    const updatedMetadata = {
      ...currentMetadata,
      publishingSettings,
    };

    // Update the book
    await db
      .update(generatedBooks)
      .set({
        metadata: updatedMetadata,
        updatedAt: new Date(),
      })
      .where(eq(generatedBooks.id, bookId));

    return NextResponse.json({
      success: true,
      message: 'Publishing settings saved successfully',
    });
  } catch (error) {
    console.error('Error saving publishing settings:', error);
    return NextResponse.json(
      { error: 'Failed to save publishing settings' },
      { status: 500 }
    );
  }
}

// PATCH - Partially update publishing settings
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const bookId = parseInt(id);

    if (isNaN(bookId)) {
      return NextResponse.json({ error: 'Invalid book ID' }, { status: 400 });
    }

    const body = await request.json();
    const updates = body as Partial<PublishingSettings>;

    // Get current book
    const books = await db
      .select()
      .from(generatedBooks)
      .where(eq(generatedBooks.id, bookId))
      .limit(1);

    if (!books.length) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const book = books[0];
    const currentMetadata = (book.metadata as Record<string, unknown>) || {};
    const currentSettings = (currentMetadata.publishingSettings as PublishingSettings) || DEFAULT_PUBLISHING_SETTINGS;

    // Merge updates with current settings
    const updatedSettings: PublishingSettings = {
      ...currentSettings,
      ...updates,
      // Deep merge nested objects
      typography: {
        ...currentSettings.typography,
        ...(updates.typography || {}),
      },
      margins: {
        ...currentSettings.margins,
        ...(updates.margins || {}),
      },
      chapters: {
        ...currentSettings.chapters,
        ...(updates.chapters || {}),
      },
      headerFooter: {
        ...currentSettings.headerFooter,
        ...(updates.headerFooter || {}),
      },
      frontMatter: {
        ...currentSettings.frontMatter,
        ...(updates.frontMatter || {}),
      },
      backMatter: {
        ...currentSettings.backMatter,
        ...(updates.backMatter || {}),
      },
      export: {
        ...currentSettings.export,
        pdf: {
          ...currentSettings.export.pdf,
          ...(updates.export?.pdf || {}),
        },
        epub: {
          ...currentSettings.export.epub,
          ...(updates.export?.epub || {}),
        },
        docx: {
          ...currentSettings.export.docx,
          ...(updates.export?.docx || {}),
        },
        html: {
          ...currentSettings.export.html,
          ...(updates.export?.html || {}),
        },
        kindle: {
          ...currentSettings.export.kindle,
          ...(updates.export?.kindle || {}),
        },
      },
    };

    // Update metadata with merged publishing settings
    const updatedMetadata = {
      ...currentMetadata,
      publishingSettings: updatedSettings,
    };

    // Update the book
    await db
      .update(generatedBooks)
      .set({
        metadata: updatedMetadata,
        updatedAt: new Date(),
      })
      .where(eq(generatedBooks.id, bookId));

    return NextResponse.json({
      success: true,
      message: 'Publishing settings updated successfully',
      publishingSettings: updatedSettings,
    });
  } catch (error) {
    console.error('Error updating publishing settings:', error);
    return NextResponse.json(
      { error: 'Failed to update publishing settings' },
      { status: 500 }
    );
  }
}

