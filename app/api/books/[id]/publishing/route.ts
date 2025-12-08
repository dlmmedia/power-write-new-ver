import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generatedBooks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { PublishingSettings, DEFAULT_PUBLISHING_SETTINGS } from '@/lib/types/publishing';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Helper to ensure valid number within range
function safeNum(val: number | undefined | null, def: number, min = 0, max = 1000): number {
  if (val === undefined || val === null || !isFinite(val) || isNaN(val)) return def;
  return Math.max(min, Math.min(max, val));
}

// Sanitize publishing settings to prevent invalid values
function sanitizeSettings(settings: PublishingSettings): PublishingSettings {
  return {
    ...DEFAULT_PUBLISHING_SETTINGS,
    ...settings,
    bookType: settings.bookType || 'novel',
    trimSize: settings.trimSize || 'trade-5.5x8.5',
    orientation: settings.orientation || 'portrait',
    typography: {
      ...DEFAULT_PUBLISHING_SETTINGS.typography,
      ...settings.typography,
      bodyFontSize: safeNum(settings.typography?.bodyFontSize, 11, 6, 72),
      bodyLineHeight: safeNum(settings.typography?.bodyLineHeight, 1.5, 1, 3),
      chapterTitleSize: safeNum(settings.typography?.chapterTitleSize, 24, 12, 72),
      chapterSubtitleSize: safeNum(settings.typography?.chapterSubtitleSize, 14, 8, 48),
      sectionHeadingSize: safeNum(settings.typography?.sectionHeadingSize, 16, 10, 48),
      dropCapLines: safeNum(settings.typography?.dropCapLines, 3, 2, 6),
      paragraphIndent: safeNum(settings.typography?.paragraphIndent, 0.3, 0, 2),
    },
    margins: {
      ...DEFAULT_PUBLISHING_SETTINGS.margins,
      ...settings.margins,
      top: safeNum(settings.margins?.top, 1, 0.25, 3),
      bottom: safeNum(settings.margins?.bottom, 1, 0.25, 3),
      inside: safeNum(settings.margins?.inside, 0.875, 0.25, 3),
      outside: safeNum(settings.margins?.outside, 0.625, 0.25, 3),
      bleed: safeNum(settings.margins?.bleed, 0.125, 0, 0.5),
      headerSpace: safeNum(settings.margins?.headerSpace, 0.3, 0, 1),
      footerSpace: safeNum(settings.margins?.footerSpace, 0.3, 0, 1),
    },
    chapters: {
      ...DEFAULT_PUBLISHING_SETTINGS.chapters,
      ...settings.chapters,
      chapterDropFromTop: safeNum(settings.chapters?.chapterDropFromTop, 2, 0.5, 5),
      afterChapterTitleSpace: safeNum(settings.chapters?.afterChapterTitleSpace, 0.5, 0, 2),
    },
    headerFooter: {
      ...DEFAULT_PUBLISHING_SETTINGS.headerFooter,
      ...settings.headerFooter,
      headerFontSize: safeNum(settings.headerFooter?.headerFontSize, 9, 6, 14),
      footerFontSize: safeNum(settings.headerFooter?.footerFontSize, 10, 6, 14),
    },
    frontMatter: {
      ...DEFAULT_PUBLISHING_SETTINGS.frontMatter,
      ...settings.frontMatter,
    },
    backMatter: {
      ...DEFAULT_PUBLISHING_SETTINGS.backMatter,
      ...settings.backMatter,
    },
    export: {
      ...DEFAULT_PUBLISHING_SETTINGS.export,
      ...settings.export,
    },
    stylePreset: settings.stylePreset || 'classic',
    language: settings.language || 'en-US',
  };
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

    // Sanitize settings to prevent invalid values
    const sanitizedSettings = sanitizeSettings(publishingSettings);

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

    // Update metadata with sanitized publishing settings
    const updatedMetadata = {
      ...currentMetadata,
      publishingSettings: sanitizedSettings,
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

    // Sanitize merged settings
    const sanitizedSettings = sanitizeSettings(updatedSettings);

    // Update metadata with sanitized publishing settings
    const updatedMetadata = {
      ...currentMetadata,
      publishingSettings: sanitizedSettings,
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
      publishingSettings: sanitizedSettings,
    });
  } catch (error) {
    console.error('Error updating publishing settings:', error);
    return NextResponse.json(
      { error: 'Failed to update publishing settings' },
      { status: 500 }
    );
  }
}

