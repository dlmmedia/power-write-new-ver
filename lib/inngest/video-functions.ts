import { inngest } from './client';
import { exportVideo, generateManifest, estimateVideoSize } from '@/lib/services/video-export-service';
import { updateVideoExportJob, getVideoExportJob } from '@/lib/db/operations';
import type { ReadingTheme } from '@/lib/services/frame-renderer';
import type { FontSize } from '@/lib/utils/pagination';

/**
 * Video export background job
 * 
 * This function handles the entire video export process:
 * 1. Generate manifest with timing data
 * 2. Render frames using Puppeteer
 * 3. Download frames and prepare audio
 * 4. Stitch video using FFmpeg
 * 5. Upload final video to Blob storage
 */
export const exportVideoBackground = inngest.createFunction(
  {
    id: 'export-video-background',
    name: 'Export Video (Background)',
    retries: 2,
    // Allow cancellation
    cancelOn: [
      { event: 'video/export.cancelled', match: 'data.jobId' }
    ],
  },
  { event: 'video/export.started' },
  async ({ event, step }) => {
    const { jobId, bookId, userId, scope, chapterNumber, theme, fontSize, baseUrl } = event.data;
    
    console.log(`[Inngest Video] Starting video export job ${jobId} for book ${bookId}`);
    
    // Step 1: Mark job as started and generate manifest
    const manifest = await step.run('generate-manifest', async () => {
      // Update job status
      await updateVideoExportJob(jobId, {
        status: 'rendering',
        startedAt: new Date(),
        currentPhase: 'initializing',
        progress: 0,
      });
      
      // Generate manifest
      const manifest = await generateManifest(
        bookId,
        scope,
        chapterNumber,
        fontSize as FontSize,
        theme
      );
      
      // Update job with manifest info
      await updateVideoExportJob(jobId, {
        totalChapters: manifest.chapters.length,
        totalFrames: manifest.totalFrames,
        framesManifest: manifest as any,
      });
      
      console.log(`[Inngest Video] Generated manifest: ${manifest.totalFrames} frames, ${manifest.totalDuration}s duration`);
      
      return manifest;
    });
    
    // Step 2: Export video (this is the heavy lifting)
    const result = await step.run('export-video', async () => {
      // Check if job was cancelled
      const job = await getVideoExportJob(jobId);
      if (job?.status === 'cancelled') {
        throw new Error('Job was cancelled');
      }
      
      await updateVideoExportJob(jobId, {
        currentPhase: 'rendering_frames',
        progress: 5,
      });
      
      console.log(`[Inngest Video] Starting export for job ${jobId}, bookId: ${bookId}, baseUrl: ${baseUrl}`);
      
      try {
        // Run the export
        const exportResult = await exportVideo({
          bookId,
          scope,
          chapterNumber,
          theme: theme as ReadingTheme,
          fontSize: fontSize as FontSize,
          baseUrl,
          onProgress: async (progress) => {
            // Update job progress in database
            // Note: This might be called frequently, so we batch updates
            if (progress.progress % 5 === 0 || progress.phase !== 'rendering_frames') {
              console.log(`[Inngest Video] Progress update - phase: ${progress.phase}, progress: ${progress.progress}%`);
              await updateVideoExportJob(jobId, {
                currentPhase: progress.phase,
                progress: Math.round(progress.progress),
                currentChapter: progress.currentChapter,
                currentFrame: progress.currentFrame,
                error: progress.error,
              });
            }
          },
        });
        
        console.log(`[Inngest Video] Export completed for job ${jobId}:`, exportResult.success ? 'SUCCESS' : 'FAILED');
        if (!exportResult.success) {
          console.error(`[Inngest Video] Export error: ${exportResult.error}`);
        }
        
        return exportResult;
      } catch (exportError) {
        console.error(`[Inngest Video] Unexpected error during export:`, exportError);
        
        // Update job with error
        const errorMessage = exportError instanceof Error ? exportError.message : String(exportError);
        await updateVideoExportJob(jobId, {
          status: 'failed',
          currentPhase: 'error',
          error: `Export crashed: ${errorMessage}`,
          completedAt: new Date(),
        });
        
        throw exportError; // Re-throw so Inngest can handle retries
      }
    });
    
    // Step 3: Finalize job
    await step.run('finalize-job', async () => {
      if (result.success) {
        await updateVideoExportJob(jobId, {
          status: 'complete',
          currentPhase: 'complete',
          progress: 100,
          outputUrl: result.videoUrl,
          outputSize: result.videoSize,
          outputDuration: Math.round(result.videoDuration || 0),
          completedAt: new Date(),
        });
        
        console.log(`[Inngest Video] Job ${jobId} completed successfully: ${result.videoUrl}`);
      } else {
        await updateVideoExportJob(jobId, {
          status: 'failed',
          currentPhase: 'error',
          error: result.error || 'Unknown error',
          completedAt: new Date(),
        });
        
        console.error(`[Inngest Video] Job ${jobId} failed: ${result.error}`);
      }
    });
    
    return {
      success: result.success,
      jobId,
      bookId,
      videoUrl: result.videoUrl,
      videoDuration: result.videoDuration,
      videoSize: result.videoSize,
      error: result.error,
    };
  }
);

/**
 * Get estimated time for video export
 */
export async function getEstimatedExportTime(
  bookId: number,
  scope: 'chapter' | 'full',
  chapterNumber?: number,
  fontSize: FontSize = 'base'
): Promise<{
  estimatedMinutes: number;
  estimatedSizeMB: number;
  totalFrames: number;
  totalDuration: number;
}> {
  const manifest = await generateManifest(bookId, scope, chapterNumber, fontSize);
  const { estimatedSizeMB, estimatedDurationMinutes } = estimateVideoSize(manifest);
  
  // Rough estimate: 2-3 seconds per frame for rendering + 30% overhead for stitching
  const renderTimeMinutes = (manifest.totalFrames * 2.5) / 60;
  const totalEstimatedMinutes = Math.ceil(renderTimeMinutes * 1.3);
  
  return {
    estimatedMinutes: totalEstimatedMinutes,
    estimatedSizeMB,
    totalFrames: manifest.totalFrames,
    totalDuration: manifest.totalDuration,
  };
}

// Export all video functions for the Inngest serve handler
export const videoFunctions = [exportVideoBackground];
