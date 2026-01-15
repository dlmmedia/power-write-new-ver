import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { inngest } from '@/lib/inngest/client';
import { 
  getVideoExportJob, 
  updateVideoExportJob,
  cancelVideoExportJob,
  deleteVideoExportJob,
} from '@/lib/db/operations';
import { getUserInfo } from '@/lib/services/user-service';
import { DEMO_USER_ID } from '@/lib/services/demo-account';

// Configure route for Node.js runtime
export const runtime = 'nodejs';

/**
 * GET /api/generate/video/[jobId]
 * Get status of a specific video export job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }
    
    const { jobId } = await params;
    const job = await getVideoExportJob(parseInt(jobId, 10));
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Check if user is Pro or if this is a demo job
    const userInfo = await getUserInfo(userId);
    const isProUser = userInfo?.tier === 'pro';
    const isDemoJob = job.userId === DEMO_USER_ID;
    
    // Check if user owns this job, is Pro, or it's a demo job
    if (job.userId !== userId && !isProUser && !isDemoJob) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not own this job' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({
      id: job.id,
      bookId: job.bookId,
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
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    });
    
  } catch (error) {
    console.error('[Video API] Error getting job status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get job status' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/generate/video/[jobId]
 * Cancel or delete a video export job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }
    
    const { jobId } = await params;
    const job = await getVideoExportJob(parseInt(jobId, 10));
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Check if user is Pro or if this is a demo job
    const userInfo = await getUserInfo(userId);
    const isProUser = userInfo?.tier === 'pro';
    const isDemoJob = job.userId === DEMO_USER_ID;
    
    console.log(`[Video API DELETE] userId: ${userId}, job.userId: ${job.userId}, job.status: ${job.status}, isProUser: ${isProUser}, isDemoJob: ${isDemoJob}`);
    
    // Check if user owns this job, is Pro, or it's a demo job
    if (job.userId !== userId && !isProUser && !isDemoJob) {
      console.log(`[Video API DELETE] Authorization failed`);
      return NextResponse.json(
        { error: 'Unauthorized - You do not own this job' },
        { status: 403 }
      );
    }
    
    console.log(`[Video API DELETE] Authorization passed, cancelling job ${job.id} with status ${job.status}`);
    
    // If job is in progress, cancel it
    if (['pending', 'rendering', 'stitching'].includes(job.status)) {
      // Try to send cancellation event to Inngest (but don't fail if Inngest isn't configured)
      try {
        await inngest.send({
          name: 'video/export.cancelled',
          data: {
            jobId: job.id,
          },
        });
        console.log(`[Video API] Sent cancellation event to Inngest for job ${job.id}`);
      } catch (inngestError) {
        // Inngest might not be configured - that's OK, we'll still cancel the job
        console.warn(`[Video API] Could not send Inngest cancellation event (Inngest may not be configured):`, inngestError);
      }
      
      // Update job status in database (this is the important part)
      await cancelVideoExportJob(job.id);
      
      console.log(`[Video API] Cancelled video export job ${job.id}`);
      
      return NextResponse.json({
        success: true,
        message: 'Job cancelled',
      });
    }
    
    // If job is completed or failed, delete it
    // Note: Could also delete the output file from Blob storage here
    await deleteVideoExportJob(job.id);
    
    console.log(`[Video API] Deleted video export job ${job.id}`);
    
    return NextResponse.json({
      success: true,
      message: 'Job deleted',
    });
    
  } catch (error) {
    console.error('[Video API] Error cancelling/deleting job:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel/delete job' },
      { status: 500 }
    );
  }
}
