import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { inngest, getMissingInngestEnv } from '@/lib/inngest/client';
import { 
  createVideoExportJob, 
  getVideoExportJobsByBook,
  getBook,
  getBookChapters,
  updateVideoExportJob,
} from '@/lib/db/operations';
import { generateManifest, estimateVideoSize } from '@/lib/services/video-export-service';
import { getUserInfo } from '@/lib/services/user-service';
import { DEMO_USER_ID } from '@/lib/services/demo-account';
import type { ReadingTheme } from '@/lib/services/frame-renderer';
import type { FontSize } from '@/lib/utils/pagination';

// Configure route for Node.js runtime
export const runtime = 'nodejs';

function stringifyUnknownError(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/**
 * POST /api/generate/video
 * Start a new video export job
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { 
      bookId, 
      scope = 'full', 
      chapterNumber, 
      theme = 'day', 
      fontSize = 'base' 
    } = body as {
      bookId: number;
      scope?: 'chapter' | 'full';
      chapterNumber?: number;
      theme?: ReadingTheme;
      fontSize?: FontSize;
    };
    
    // Validate required fields
    if (!bookId) {
      return NextResponse.json(
        { error: 'Missing required field: bookId' },
        { status: 400 }
      );
    }
    
    // Validate scope and chapterNumber
    if (scope === 'chapter' && !chapterNumber) {
      return NextResponse.json(
        { error: 'chapterNumber is required when scope is "chapter"' },
        { status: 400 }
      );
    }
    
    // Check if book exists and user has access
    const book = await getBook(bookId);
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }
    
    // Check if user is Pro - Pro users can export any book
    const userInfo = await getUserInfo(userId);
    const isProUser = userInfo?.tier === 'pro';
    
    // Check if this is a demo book (created with demo user)
    const isDemoBook = book.userId === DEMO_USER_ID;
    
    console.log(`[Video API] Auth check - userId: ${userId}, book.userId: ${book.userId}, isProUser: ${isProUser}, isDemoBook: ${isDemoBook}`);
    
    // Verify ownership: user owns the book, OR user is Pro, OR it's a demo book
    if (book.userId !== userId && !isProUser && !isDemoBook) {
      console.log(`[Video API] Authorization failed - userId mismatch, not pro user, and not demo book`);
      return NextResponse.json(
        { error: 'Unauthorized - You do not own this book' },
        { status: 403 }
      );
    }
    
    // Pro users can export any book, but log for audit purposes
    if (book.userId !== userId && isProUser) {
      console.log(`[Video Export] Pro user ${userId} exporting book ${bookId} owned by ${book.userId}`);
    }
    
    // Check if chapters have audio
    const chapters = await getBookChapters(bookId);
    const chaptersWithAudio = chapters.filter(ch => ch.audioUrl);
    
    if (chaptersWithAudio.length === 0) {
      return NextResponse.json(
        { error: 'No audio found. Please generate audio for at least one chapter before exporting video.' },
        { status: 400 }
      );
    }
    
    if (scope === 'chapter' && chapterNumber) {
      const chapter = chapters.find(ch => ch.chapterNumber === chapterNumber);
      if (!chapter?.audioUrl) {
        return NextResponse.json(
          { error: `Chapter ${chapterNumber} does not have audio. Please generate audio first.` },
          { status: 400 }
        );
      }
    }

    // Ensure Inngest is configured before creating a job we cannot run.
    const missingInngestEnv = getMissingInngestEnv();
    if (missingInngestEnv.length > 0) {
      return NextResponse.json(
        {
          error:
            missingInngestEnv.length === 1
              ? `Video export service is not configured. Missing ${missingInngestEnv[0]}.`
              : `Video export service is not configured. Missing ${missingInngestEnv.join(', ')}.`,
          missing: missingInngestEnv,
        },
        { status: 503 }
      );
    }
    
    // Generate manifest to get estimates
    const manifest = await generateManifest(bookId, scope, chapterNumber, fontSize, theme);
    const { estimatedSizeMB, estimatedDurationMinutes } = estimateVideoSize(manifest);
    
    // Create the job in database
    const job = await createVideoExportJob({
      bookId,
      userId,
      status: 'pending',
      scope,
      chapterNumber: scope === 'chapter' ? chapterNumber : null,
      theme,
      currentPhase: 'initializing',
      totalChapters: manifest.chapters.length,
      totalFrames: manifest.totalFrames,
      progress: 0,
    });
    
    // Get base URL for rendering
    // Priority: NEXT_PUBLIC_APP_URL > RAILWAY_PUBLIC_DOMAIN > VERCEL_URL > localhost
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl && process.env.RAILWAY_PUBLIC_DOMAIN) {
      baseUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    }
    if (!baseUrl && process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    }
    if (!baseUrl) {
      baseUrl = 'http://localhost:3000';
    }
    
    console.log(`[Video API] Using base URL: ${baseUrl}`);
    
    // Trigger Inngest job
    try {
      await inngest.send({
        name: 'video/export.started',
        data: {
          jobId: job.id,
          bookId,
          userId,
          scope,
          chapterNumber,
          theme,
          fontSize,
          baseUrl,
        },
      });
      console.log(`[Video API] Started video export job ${job.id} for book ${bookId}`);
    } catch (inngestError) {
      // Failed to enqueue background job - mark job failed with a more accurate reason.
      const errMsg = stringifyUnknownError(inngestError);
      console.error('[Video API] Failed to send Inngest event:', inngestError);
      await updateVideoExportJob(job.id, {
        status: 'failed',
        error: `Failed to queue video export background job. ${errMsg}`,
        completedAt: new Date(),
      });
      
      return NextResponse.json(
        { error: 'Failed to start video export. Please try again in a moment.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json({
      success: true,
      jobId: job.id,
      estimatedDurationMinutes,
      estimatedSizeMB,
      totalFrames: manifest.totalFrames,
      totalDuration: manifest.totalDuration,
    });
    
  } catch (error) {
    console.error('[Video API] Error starting video export:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start video export' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/generate/video
 * Get video export jobs for a book
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');
    
    if (!bookId) {
      return NextResponse.json(
        { error: 'Missing required parameter: bookId' },
        { status: 400 }
      );
    }
    
    // Check if book exists and user has access
    const book = await getBook(parseInt(bookId, 10));
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }
    
    // Check if user is Pro - Pro users can view any book's jobs
    const userInfo = await getUserInfo(userId);
    const isProUser = userInfo?.tier === 'pro';
    
    // Check if this is a demo book
    const isDemoBook = book.userId === DEMO_USER_ID;
    
    if (book.userId !== userId && !isProUser && !isDemoBook) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not own this book' },
        { status: 403 }
      );
    }
    
    // Get jobs for this book
    const jobs = await getVideoExportJobsByBook(parseInt(bookId, 10));
    
    return NextResponse.json({
      jobs: jobs.map(job => ({
        id: job.id,
        status: job.status,
        scope: job.scope,
        chapterNumber: job.chapterNumber,
        theme: job.theme,
        currentPhase: job.currentPhase,
        progress: job.progress,
        currentChapter: job.currentChapter,
        totalChapters: job.totalChapters,
        currentFrame: job.currentFrame,
        totalFrames: job.totalFrames,
        outputUrl: job.outputUrl,
        outputSize: job.outputSize,
        outputDuration: job.outputDuration,
        error: job.error,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
      })),
    });
    
  } catch (error) {
    console.error('[Video API] Error getting video export jobs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get video export jobs' },
      { status: 500 }
    );
  }
}
