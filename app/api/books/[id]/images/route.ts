import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chapterImages, generatedBooks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/books/[id]/images
 * Get all images for a book
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id, 10);

    if (isNaN(bookId)) {
      return NextResponse.json({ error: 'Invalid book ID' }, { status: 400 });
    }

    // Verify book exists
    const book = await db
      .select({ id: generatedBooks.id })
      .from(generatedBooks)
      .where(eq(generatedBooks.id, bookId))
      .limit(1);

    if (book.length === 0) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Get all images for the book
    const images = await db
      .select()
      .from(chapterImages)
      .where(eq(chapterImages.bookId, bookId))
      .orderBy(chapterImages.chapterId, chapterImages.position);

    return NextResponse.json({
      success: true,
      images,
    });
  } catch (error) {
    console.error('Error fetching book images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch book images' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/books/[id]/images
 * Add a new image to a book
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id, 10);

    if (isNaN(bookId)) {
      return NextResponse.json({ error: 'Invalid book ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      chapterId,
      imageUrl,
      thumbnailUrl,
      imageType,
      position,
      placement,
      caption,
      altText,
      prompt,
      metadata,
      source,
    } = body;

    // Validate required fields
    if (!imageUrl || !imageType) {
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl, imageType' },
        { status: 400 }
      );
    }

    // Insert the image
    const [newImage] = await db
      .insert(chapterImages)
      .values({
        bookId,
        chapterId: chapterId || null,
        imageUrl,
        thumbnailUrl: thumbnailUrl || null,
        imageType,
        position: position || 0,
        placement: placement || 'center',
        caption: caption || null,
        altText: altText || null,
        prompt: prompt || null,
        metadata: metadata || null,
        source: source || 'generated',
      })
      .returning();

    console.log(`[API] Added image to book ${bookId}:`, newImage.id);

    return NextResponse.json({
      success: true,
      image: newImage,
    });
  } catch (error) {
    console.error('Error adding book image:', error);
    return NextResponse.json(
      { error: 'Failed to add book image' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/books/[id]/images
 * Update multiple images (positions, captions, etc.)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id, 10);

    if (isNaN(bookId)) {
      return NextResponse.json({ error: 'Invalid book ID' }, { status: 400 });
    }

    const body = await request.json();
    const { images } = body as {
      images: Array<{
        id: number;
        position?: number;
        placement?: string;
        caption?: string;
        altText?: string;
      }>;
    };

    if (!images || !Array.isArray(images)) {
      return NextResponse.json(
        { error: 'Missing required field: images (array)' },
        { status: 400 }
      );
    }

    // Update each image
    const updatedImages = await Promise.all(
      images.map(async (image) => {
        const updateData: Record<string, unknown> = {};
        if (image.position !== undefined) updateData.position = image.position;
        if (image.placement !== undefined) updateData.placement = image.placement;
        if (image.caption !== undefined) updateData.caption = image.caption;
        if (image.altText !== undefined) updateData.altText = image.altText;

        if (Object.keys(updateData).length > 0) {
          const [updated] = await db
            .update(chapterImages)
            .set(updateData)
            .where(
              and(
                eq(chapterImages.id, image.id),
                eq(chapterImages.bookId, bookId)
              )
            )
            .returning();
          return updated;
        }
        return null;
      })
    );

    return NextResponse.json({
      success: true,
      updatedCount: updatedImages.filter(Boolean).length,
    });
  } catch (error) {
    console.error('Error updating book images:', error);
    return NextResponse.json(
      { error: 'Failed to update book images' },
      { status: 500 }
    );
  }
}
