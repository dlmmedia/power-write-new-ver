import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { coverGallery, generatedBooks } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Fetch all covers for a book
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id);
    
    if (isNaN(bookId)) {
      return NextResponse.json(
        { error: 'Invalid book ID' },
        { status: 400 }
      );
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const coverType = searchParams.get('type'); // 'front', 'back', or null for all

    // Build query
    let covers: any[] = [];
    
    try {
      const query = db
        .select()
        .from(coverGallery)
        .where(
          coverType 
            ? and(
                eq(coverGallery.bookId, bookId),
                eq(coverGallery.coverType, coverType)
              )
            : eq(coverGallery.bookId, bookId)
        )
        .orderBy(desc(coverGallery.createdAt));

      covers = await query;
    } catch (dbError: any) {
      // Check if it's a "table doesn't exist" error
      if (dbError?.message?.includes('relation') && dbError?.message?.includes('does not exist')) {
        console.log('Cover gallery table does not exist yet. Returning empty array.');
        return NextResponse.json({
          success: true,
          covers: [],
          count: 0,
          message: 'Cover gallery table not yet created. Run the migration to enable this feature.',
        });
      }
      throw dbError;
    }

    return NextResponse.json({
      success: true,
      covers,
      count: covers.length,
    });
  } catch (error) {
    console.error('Error fetching covers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch covers', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Add a new cover to the gallery
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id);
    
    if (isNaN(bookId)) {
      return NextResponse.json(
        { error: 'Invalid book ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { 
      coverUrl, 
      coverType = 'front',
      thumbnailUrl,
      generationSettings,
      imageModel,
      prompt,
      source = 'generated',
      fileName,
      fileSize,
      setAsMain = false,
    } = body;

    if (!coverUrl) {
      return NextResponse.json(
        { error: 'Cover URL is required' },
        { status: 400 }
      );
    }

    // Verify book exists
    const [book] = await db
      .select()
      .from(generatedBooks)
      .where(eq(generatedBooks.id, bookId))
      .limit(1);

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // If setAsMain is true, unselect all other covers of the same type
    if (setAsMain) {
      await db
        .update(coverGallery)
        .set({ isSelected: false })
        .where(
          and(
            eq(coverGallery.bookId, bookId),
            eq(coverGallery.coverType, coverType)
          )
        );
    }

    // Insert new cover
    let newCover;
    try {
      const [insertedCover] = await db
        .insert(coverGallery)
        .values({
          bookId,
          coverUrl,
          coverType,
          thumbnailUrl,
          generationSettings,
          imageModel,
          prompt,
          source,
          fileName,
          fileSize,
          isSelected: setAsMain,
        })
        .returning();
      newCover = insertedCover;
    } catch (dbError: any) {
      // Check if it's a "table doesn't exist" error
      if (dbError?.message?.includes('relation') && dbError?.message?.includes('does not exist')) {
        console.log('Cover gallery table does not exist. Skipping gallery save.');
        // Still update the main cover URL even if gallery doesn't exist
        if (setAsMain && coverType === 'front') {
          await db
            .update(generatedBooks)
            .set({ coverUrl })
            .where(eq(generatedBooks.id, bookId));
        }
        return NextResponse.json({
          success: true,
          cover: null,
          message: 'Cover gallery table not yet created. Cover saved to book but not to gallery.',
        });
      }
      throw dbError;
    }

    // If setAsMain, also update the main book's coverUrl/backCoverUrl
    if (setAsMain) {
      if (coverType === 'front') {
        await db
          .update(generatedBooks)
          .set({ coverUrl })
          .where(eq(generatedBooks.id, bookId));
      }
      // Note: backCoverUrl would need to be added to generatedBooks schema if needed
    }

    return NextResponse.json({
      success: true,
      cover: newCover,
    });
  } catch (error) {
    console.error('Error adding cover to gallery:', error);
    return NextResponse.json(
      { error: 'Failed to add cover to gallery', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

