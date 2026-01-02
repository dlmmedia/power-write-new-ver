import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chapterImages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/books/[id]/images/[imageId]
 * Get a specific image
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id, imageId } = await params;
    const bookId = parseInt(id, 10);
    const imgId = parseInt(imageId, 10);

    if (isNaN(bookId) || isNaN(imgId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const [image] = await db
      .select()
      .from(chapterImages)
      .where(
        and(
          eq(chapterImages.id, imgId),
          eq(chapterImages.bookId, bookId)
        )
      )
      .limit(1);

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      image,
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/books/[id]/images/[imageId]
 * Update a specific image
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id, imageId } = await params;
    const bookId = parseInt(id, 10);
    const imgId = parseInt(imageId, 10);

    if (isNaN(bookId) || isNaN(imgId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      chapterId,
      position,
      placement,
      caption,
      altText,
      metadata,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (chapterId !== undefined) updateData.chapterId = chapterId;
    if (position !== undefined) updateData.position = position;
    if (placement !== undefined) updateData.placement = placement;
    if (caption !== undefined) updateData.caption = caption;
    if (altText !== undefined) updateData.altText = altText;
    if (metadata !== undefined) updateData.metadata = metadata;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const [updatedImage] = await db
      .update(chapterImages)
      .set(updateData)
      .where(
        and(
          eq(chapterImages.id, imgId),
          eq(chapterImages.bookId, bookId)
        )
      )
      .returning();

    if (!updatedImage) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      image: updatedImage,
    });
  } catch (error) {
    console.error('Error updating image:', error);
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/books/[id]/images/[imageId]
 * Delete a specific image
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id, imageId } = await params;
    const bookId = parseInt(id, 10);
    const imgId = parseInt(imageId, 10);

    if (isNaN(bookId) || isNaN(imgId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Get the image first to check if it exists and get the URL for blob cleanup
    const [existingImage] = await db
      .select()
      .from(chapterImages)
      .where(
        and(
          eq(chapterImages.id, imgId),
          eq(chapterImages.bookId, bookId)
        )
      )
      .limit(1);

    if (!existingImage) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Delete the image record
    await db
      .delete(chapterImages)
      .where(
        and(
          eq(chapterImages.id, imgId),
          eq(chapterImages.bookId, bookId)
        )
      );

    // Optionally delete from blob storage
    if (existingImage.imageUrl && existingImage.imageUrl.includes('blob.vercel-storage.com')) {
      try {
        const { del } = await import('@vercel/blob');
        await del(existingImage.imageUrl, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        console.log(`[API] Deleted blob: ${existingImage.imageUrl}`);
      } catch (blobError) {
        console.warn('[API] Failed to delete blob:', blobError);
        // Continue anyway - the DB record is deleted
      }
    }

    console.log(`[API] Deleted image ${imgId} from book ${bookId}`);

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
