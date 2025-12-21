import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { coverGallery, generatedBooks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { del } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Get a specific cover
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; coverId: string }> }
) {
  try {
    const { id, coverId } = await params;
    const bookId = parseInt(id);
    const coverIdNum = parseInt(coverId);
    
    if (isNaN(bookId) || isNaN(coverIdNum)) {
      return NextResponse.json(
        { error: 'Invalid book ID or cover ID' },
        { status: 400 }
      );
    }

    const [cover] = await db
      .select()
      .from(coverGallery)
      .where(
        and(
          eq(coverGallery.id, coverIdNum),
          eq(coverGallery.bookId, bookId)
        )
      )
      .limit(1);

    if (!cover) {
      return NextResponse.json(
        { error: 'Cover not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      cover,
    });
  } catch (error) {
    console.error('Error fetching cover:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cover', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PATCH - Update a cover (e.g., set as selected)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; coverId: string }> }
) {
  try {
    const { id, coverId } = await params;
    const bookId = parseInt(id);
    const coverIdNum = parseInt(coverId);
    
    if (isNaN(bookId) || isNaN(coverIdNum)) {
      return NextResponse.json(
        { error: 'Invalid book ID or cover ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { setAsMain } = body;

    // Get the cover to update
    const [cover] = await db
      .select()
      .from(coverGallery)
      .where(
        and(
          eq(coverGallery.id, coverIdNum),
          eq(coverGallery.bookId, bookId)
        )
      )
      .limit(1);

    if (!cover) {
      return NextResponse.json(
        { error: 'Cover not found' },
        { status: 404 }
      );
    }

    // If setting as main cover
    if (setAsMain) {
      // Unselect all other covers of the same type for this book
      await db
        .update(coverGallery)
        .set({ isSelected: false })
        .where(
          and(
            eq(coverGallery.bookId, bookId),
            eq(coverGallery.coverType, cover.coverType)
          )
        );

      // Select this cover
      await db
        .update(coverGallery)
        .set({ isSelected: true })
        .where(eq(coverGallery.id, coverIdNum));

      // Update the main book's coverUrl
      if (cover.coverType === 'front') {
        await db
          .update(generatedBooks)
          .set({ coverUrl: cover.coverUrl })
          .where(eq(generatedBooks.id, bookId));
      }
      // For back cover, would need backCoverUrl field in generatedBooks

      // Get updated cover
      const [updatedCover] = await db
        .select()
        .from(coverGallery)
        .where(eq(coverGallery.id, coverIdNum))
        .limit(1);

      return NextResponse.json({
        success: true,
        cover: updatedCover,
        message: 'Cover set as main cover',
      });
    }

    return NextResponse.json({
      success: true,
      cover,
    });
  } catch (error) {
    console.error('Error updating cover:', error);
    return NextResponse.json(
      { error: 'Failed to update cover', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a cover from gallery
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; coverId: string }> }
) {
  try {
    const { id, coverId } = await params;
    const bookId = parseInt(id);
    const coverIdNum = parseInt(coverId);
    
    if (isNaN(bookId) || isNaN(coverIdNum)) {
      return NextResponse.json(
        { error: 'Invalid book ID or cover ID' },
        { status: 400 }
      );
    }

    // Get the cover first
    const [cover] = await db
      .select()
      .from(coverGallery)
      .where(
        and(
          eq(coverGallery.id, coverIdNum),
          eq(coverGallery.bookId, bookId)
        )
      )
      .limit(1);

    if (!cover) {
      return NextResponse.json(
        { error: 'Cover not found' },
        { status: 404 }
      );
    }

    // If this was the selected cover, we need to handle that
    if (cover.isSelected) {
      // Clear the main cover from the book
      if (cover.coverType === 'front') {
        await db
          .update(generatedBooks)
          .set({ coverUrl: null })
          .where(eq(generatedBooks.id, bookId));
      }
    }

    // Try to delete from blob storage if it's a Vercel Blob URL
    if (cover.coverUrl && cover.coverUrl.includes('vercel-storage.com') && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await del(cover.coverUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
        console.log('Deleted cover from blob storage:', cover.coverUrl);
      } catch (blobError) {
        console.error('Failed to delete from blob storage:', blobError);
        // Continue anyway - database record should still be deleted
      }
    }

    // Delete from database
    await db
      .delete(coverGallery)
      .where(eq(coverGallery.id, coverIdNum));

    return NextResponse.json({
      success: true,
      message: 'Cover deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting cover:', error);
    return NextResponse.json(
      { error: 'Failed to delete cover', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}











