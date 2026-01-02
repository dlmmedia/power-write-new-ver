import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { db } from '@/lib/db';
import { chapterImages, generatedBooks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Set max duration for uploads
export const maxDuration = 30;

/**
 * POST /api/books/[id]/images/upload
 * Upload an image file to blob storage and save to chapter_images
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[Upload] Image upload request received');
  
  try {
    const { id } = await params;
    const bookId = parseInt(id);
    console.log('[Upload] Book ID:', bookId);

    if (isNaN(bookId)) {
      return NextResponse.json(
        { error: 'Invalid book ID' },
        { status: 400 }
      );
    }

    // Get the form data with the uploaded file
    const formData = await request.formData();
    console.log('[Upload] Form data received');
    const file = formData.get('image') as File | null;
    const chapterId = formData.get('chapterId') as string | null;
    const imageType = formData.get('imageType') as string || 'illustration';
    const position = parseInt(formData.get('position') as string || '0');
    const placement = formData.get('placement') as string || 'center';
    const caption = formData.get('caption') as string | null;
    const altText = formData.get('altText') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB for chapter images)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Get book from database to verify it exists
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

    // Check for blob token
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('[Upload] BLOB_READ_WRITE_TOKEN is not set');
      return NextResponse.json(
        { 
          error: 'Server not configured for file uploads',
          details: 'BLOB_READ_WRITE_TOKEN environment variable is missing. Please configure it in your environment.'
        },
        { status: 500 }
      );
    }
    console.log('[Upload] Blob token is configured');

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('[Upload] File buffer created, size:', buffer.length);

    // Determine file extension
    const ext = file.type.split('/')[1] || 'png';

    // Generate filename
    const sanitizedTitle = book.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);

    const timestamp = Date.now();
    const filename = `book-images/${sanitizedTitle}-${bookId}/chapter-${chapterId || 'general'}-${timestamp}.${ext}`;

    console.log(`[Upload] Uploading image for book ${bookId}: ${filename}`);
    
    // Upload to Vercel Blob Storage
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log(`[Upload] Image uploaded successfully: ${blob.url}`);

    // Save to database
    const [newImage] = await db
      .insert(chapterImages)
      .values({
        bookId,
        chapterId: chapterId ? parseInt(chapterId) : null,
        imageUrl: blob.url,
        thumbnailUrl: blob.url, // Use same URL for thumbnail
        imageType,
        position,
        placement,
        caption: caption || null,
        altText: altText || caption || 'Uploaded image',
        prompt: null,
        metadata: {
          originalFilename: file.name,
          fileSize: file.size,
          contentType: file.type,
          uploadedAt: new Date().toISOString(),
        },
        source: 'uploaded',
      })
      .returning();

    console.log(`[Upload] Image saved to database with ID: ${newImage.id}`);

    return NextResponse.json({
      success: true,
      image: newImage,
      imageUrl: blob.url,
    });

  } catch (error) {
    console.error('[Upload] Error uploading image:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to upload image';
    let details = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for common Vercel Blob errors
    if (details.includes('BLOB_READ_WRITE_TOKEN')) {
      errorMessage = 'Blob storage not configured';
      details = 'Please set BLOB_READ_WRITE_TOKEN environment variable';
    } else if (details.includes('fetch failed') || details.includes('ENOTFOUND')) {
      errorMessage = 'Network error';
      details = 'Could not connect to blob storage. Check your internet connection.';
    } else if (details.includes('Invalid token') || details.includes('Unauthorized')) {
      errorMessage = 'Invalid blob token';
      details = 'BLOB_READ_WRITE_TOKEN is invalid or expired. Please update it.';
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: details
      },
      { status: 500 }
    );
  }
}
