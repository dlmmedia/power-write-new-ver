/**
 * Video Export Service
 * 
 * Orchestrates the video export process:
 * 1. Generates video manifest with timing data
 * 2. Coordinates frame rendering
 * 3. Assembles frames and audio into final video using FFmpeg
 */

import ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { put } from '@vercel/blob';
import {
  VideoManifest,
  calculateBookTiming,
  calculateSingleChapterTiming,
  AudioTimestamp,
} from './video-sync-calculator';
import { renderFrames, FrameInfo, cleanupFrames, ReadingTheme } from './frame-renderer';
import { getBookWithChapters } from '@/lib/db/operations';
import type { FontSize } from '@/lib/utils/pagination';

// Try to set FFmpeg path - check environment variable first (Railway/nixpacks)
let ffmpegPath: string | null = null;

// Priority 1: Check FFMPEG_PATH environment variable (set in nixpacks.toml)
if (process.env.FFMPEG_PATH) {
  ffmpegPath = process.env.FFMPEG_PATH;
  ffmpeg.setFfmpegPath(ffmpegPath);
  console.log(`[VideoExport] Using FFMPEG_PATH from environment: ${ffmpegPath}`);
} else {
  // Priority 2: Try @ffmpeg-installer/ffmpeg (works locally and on some platforms)
  try {
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    const detectedPath: string | undefined = ffmpegInstaller?.path;
    if (typeof detectedPath === 'string' && detectedPath.length > 0) {
      ffmpegPath = detectedPath;
      ffmpeg.setFfmpegPath(detectedPath);
    }
    console.log(`[VideoExport] Using @ffmpeg-installer/ffmpeg: ${ffmpegPath}`);
  } catch (e) {
    console.warn('[VideoExport] @ffmpeg-installer/ffmpeg not found, checking for system FFmpeg...');
    
    // Priority 3: Check common system paths
    const possiblePaths = [
      '/nix/var/nix/profiles/default/bin/ffmpeg', // Nixpacks on Railway
      '/usr/bin/ffmpeg',
      '/usr/local/bin/ffmpeg',
      '/opt/homebrew/bin/ffmpeg', // macOS with Homebrew
    ];
    
    const fs = require('fs');
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        ffmpegPath = testPath;
        ffmpeg.setFfmpegPath(testPath);
        console.log(`[VideoExport] Found system FFmpeg at: ${testPath}`);
        break;
      }
    }
    
    if (!ffmpegPath) {
      console.error('[VideoExport] WARNING: FFmpeg not found! Video export will fail.');
      console.error('[VideoExport] Checked paths:', possiblePaths);
      console.error('[VideoExport] To fix on Railway, ensure nixpacks.toml includes "ffmpeg" in nixPkgs');
    }
  }
}

// Video settings
const VIDEO_FPS = 24;
const VIDEO_CODEC = 'libx264';
const VIDEO_PRESET = 'medium';
const VIDEO_CRF = 23; // Quality (lower = better, 18-28 is reasonable)
const AUDIO_CODEC = 'aac';
const AUDIO_BITRATE = '192k';

export interface VideoExportOptions {
  bookId: number;
  scope: 'chapter' | 'full';
  chapterNumber?: number;
  theme: ReadingTheme;
  fontSize: FontSize;
  baseUrl: string;
  onProgress?: (progress: VideoExportProgress) => void | Promise<void>;
}

export interface VideoExportProgress {
  phase: 'initializing' | 'rendering_frames' | 'downloading' | 'stitching' | 'uploading' | 'complete' | 'error';
  progress: number; // 0-100
  currentChapter?: number;
  totalChapters?: number;
  currentFrame?: number;
  totalFrames?: number;
  message?: string;
  error?: string;
}

export interface VideoExportResult {
  success: boolean;
  videoUrl?: string;
  videoDuration?: number;
  videoSize?: number;
  error?: string;
}

/**
 * Generate video manifest for a book or chapter
 */
export async function generateManifest(
  bookId: number,
  scope: 'chapter' | 'full',
  chapterNumber?: number,
  fontSize: FontSize = 'base',
  theme: string = 'day'
): Promise<VideoManifest> {
  // Fetch book data
  const book = await getBookWithChapters(bookId);
  if (!book) {
    throw new Error('Book not found');
  }
  
  // Prepare chapter data
  const chaptersData = book.chapters.map((ch, index) => ({
    index,
    title: ch.title,
    content: ch.content,
    audioTimestamps: (ch.audioTimestamps as AudioTimestamp[] | null) || null,
    audioDuration: ch.audioDuration || 0,
  }));
  
  if (scope === 'chapter' && chapterNumber !== undefined) {
    // Single chapter export
    const chapter = chaptersData.find(ch => ch.index === chapterNumber - 1);
    if (!chapter) {
      throw new Error(`Chapter ${chapterNumber} not found`);
    }
    
    return calculateSingleChapterTiming(
      bookId,
      book.title,
      book.author || 'Unknown Author',
      chapter,
      fontSize,
      theme
    );
  }
  
  // Full book export
  return calculateBookTiming(
    bookId,
    book.title,
    book.author || 'Unknown Author',
    chaptersData,
    fontSize,
    theme
  );
}

/**
 * Download a file from URL to local path
 */
async function downloadFile(url: string, localPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${url}`);
  }
  
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(localPath, buffer);
}

/**
 * Create a temporary directory
 */
function createTempDir(): string {
  const tempDir = path.join(os.tmpdir(), `video-export-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

/**
 * Clean up temporary directory
 */
function cleanupTempDir(tempDir: string): void {
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {
    console.warn(`[VideoExport] Failed to cleanup temp dir: ${tempDir}`, e);
  }
}

/**
 * Create FFmpeg concat file from frames
 */
function createConcatFile(
  frames: FrameInfo[],
  tempDir: string,
  totalDuration: number
): string {
  const concatPath = path.join(tempDir, 'concat.txt');
  const lines: string[] = [];
  
  // Sort frames by time
  const sortedFrames = [...frames].sort((a, b) => a.time - b.time);
  
  for (let i = 0; i < sortedFrames.length; i++) {
    const frame = sortedFrames[i];
    const nextFrame = sortedFrames[i + 1];
    
    // Calculate duration for this frame
    const duration = nextFrame 
      ? nextFrame.time - frame.time 
      : totalDuration - frame.time;
    
    // FFmpeg concat format
    const localPath = path.join(tempDir, `frame-${String(i).padStart(6, '0')}.jpg`);
    lines.push(`file '${localPath}'`);
    lines.push(`duration ${Math.max(0.01, duration).toFixed(4)}`);
  }
  
  // Last frame needs to be repeated for FFmpeg concat
  if (sortedFrames.length > 0) {
    const lastLocalPath = path.join(tempDir, `frame-${String(sortedFrames.length - 1).padStart(6, '0')}.jpg`);
    lines.push(`file '${lastLocalPath}'`);
  }
  
  fs.writeFileSync(concatPath, lines.join('\n'));
  return concatPath;
}

/**
 * Download all audio files and concatenate them
 */
async function prepareAudio(
  book: Awaited<ReturnType<typeof getBookWithChapters>>,
  scope: 'chapter' | 'full',
  chapterNumber: number | undefined,
  tempDir: string
): Promise<string | null> {
  if (!book) return null;
  
  const chapters = scope === 'chapter' && chapterNumber !== undefined
    ? book.chapters.filter(ch => ch.chapterNumber === chapterNumber)
    : book.chapters;
  
  // Download audio files
  const audioFiles: string[] = [];
  for (const chapter of chapters) {
    if (chapter.audioUrl) {
      const localPath = path.join(tempDir, `audio-ch${chapter.chapterNumber}.wav`);
      await downloadFile(chapter.audioUrl, localPath);
      audioFiles.push(localPath);
    }
  }
  
  if (audioFiles.length === 0) return null;
  
  // If single file, use it directly
  if (audioFiles.length === 1) {
    return audioFiles[0];
  }
  
  // Concatenate multiple audio files
  const outputPath = path.join(tempDir, 'audio-combined.wav');
  const concatListPath = path.join(tempDir, 'audio-concat.txt');
  
  // Create concat list
  const concatList = audioFiles.map(f => `file '${f}'`).join('\n');
  fs.writeFileSync(concatListPath, concatList);
  
  // Concatenate using FFmpeg
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(concatListPath)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .audioCodec('copy')
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
  
  return outputPath;
}

/**
 * Assemble video from frames and audio using FFmpeg
 */
async function assembleVideo(
  concatFilePath: string,
  audioPath: string | null,
  outputPath: string,
  totalDuration: number,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    let command = ffmpeg()
      .input(concatFilePath)
      .inputOptions(['-f', 'concat', '-safe', '0']);
    
    // Add audio if available
    if (audioPath) {
      command = command.input(audioPath);
    }
    
    command = command
      .videoCodec(VIDEO_CODEC)
      .outputOptions([
        `-preset ${VIDEO_PRESET}`,
        `-crf ${VIDEO_CRF}`,
        '-pix_fmt yuv420p', // Compatibility
        '-movflags +faststart', // Web optimization
      ])
      .fps(VIDEO_FPS);
    
    if (audioPath) {
      command = command
        .audioCodec(AUDIO_CODEC)
        .audioBitrate(AUDIO_BITRATE)
        .outputOptions(['-shortest']); // Match video to audio length
    }
    
    command
      .output(outputPath)
      .on('progress', (progress) => {
        if (onProgress && progress.percent) {
          onProgress(progress.percent);
        }
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

/**
 * Main video export function
 */
export async function exportVideo(options: VideoExportOptions): Promise<VideoExportResult> {
  const {
    bookId,
    scope,
    chapterNumber,
    theme,
    fontSize,
    baseUrl,
    onProgress,
  } = options;
  
  let tempDir: string | null = null;
  let renderedFrames: FrameInfo[] = [];
  let uploadedFrames = false;
  
  const reportProgress = async (progress: VideoExportProgress) => {
    if (onProgress) {
      await onProgress(progress);
    }
  };
  
  try {
    // Phase 1: Initialize
    await reportProgress({
      phase: 'initializing',
      progress: 0,
      message: 'Generating video manifest...',
    });
    
    // Generate manifest
    const manifest = await generateManifest(bookId, scope, chapterNumber, fontSize, theme);
    
    // Get book data for audio
    const book = await getBookWithChapters(bookId);
    if (!book) {
      throw new Error('Book not found');
    }
    
    // Extract audio timestamps from chapters for word-by-word sync
    const chapterAudioTimestamps = new Map<number, { word: string; start: number; end: number }[]>();
    for (const chapter of book.chapters) {
      if (chapter.audioTimestamps && Array.isArray(chapter.audioTimestamps)) {
        // Chapter index is 0-based (chapterNumber - 1)
        const chapterIndex = chapter.chapterNumber - 1;
        chapterAudioTimestamps.set(chapterIndex, chapter.audioTimestamps as { word: string; start: number; end: number }[]);
      }
    }
    console.log(`[VideoExport] Found audio timestamps for ${chapterAudioTimestamps.size} chapters`);
    
    // Create temp directory
    tempDir = createTempDir();
    const rawFramesDir = path.join(tempDir, 'frames-raw');
    fs.mkdirSync(rawFramesDir, { recursive: true });
    
    // Phase 2: Render frames
    await reportProgress({
      phase: 'rendering_frames',
      progress: 5,
      totalChapters: manifest.chapters.length,
      totalFrames: manifest.totalFrames,
      message: 'Rendering frames...',
    });
    
    const outputPrefix = `video-exports/${bookId}/${Date.now()}`;

    // Uploading every frame to Blob is extremely slow on Railway and not needed for stitching.
    // Keep it opt-in for debugging/legacy behavior.
    uploadedFrames = process.env.VIDEO_EXPORT_UPLOAD_FRAMES === 'true';
    
    renderedFrames = await renderFrames({
      bookId,
      baseUrl,
      theme,
      fontSize,
      manifest,
      outputPrefix,
      outputDir: rawFramesDir,
      uploadFrames: uploadedFrames,
      navigationWaitUntil: 'domcontentloaded',
      chapterAudioTimestamps, // Pass audio timestamps for word-by-word sync
      onProgress: async (renderProgress) => {
        const framePercent = (renderProgress.currentFrame / manifest.totalFrames) * 40;
        await reportProgress({
          phase: 'rendering_frames',
          progress: 5 + framePercent,
          currentChapter: renderProgress.currentChapter,
          totalChapters: manifest.chapters.length,
          currentFrame: renderProgress.currentFrame,
          totalFrames: manifest.totalFrames,
          message: `Rendering frame ${renderProgress.currentFrame} of ${manifest.totalFrames}...`,
        });
      },
    });
    
    // Phase 3: Prepare frames locally in time order (no Blob roundtrip)
    await reportProgress({
      phase: 'downloading',
      progress: 45,
      message: 'Preparing rendered frames...',
    });
    
    // Sort frames by time
    const sortedFrames = [...renderedFrames].sort((a, b) => a.time - b.time);
    
    // Move/copy all frames into the exact concat order/filenames that FFmpeg expects
    for (let i = 0; i < sortedFrames.length; i++) {
      const frame = sortedFrames[i];
      const localPath = path.join(tempDir, `frame-${String(i).padStart(6, '0')}.jpg`);
      if (!frame.localPath) {
        throw new Error('Frame rendering did not produce local files');
      }

      // Use rename when possible (fast), fallback to copy (cross-device)
      try {
        fs.renameSync(frame.localPath, localPath);
      } catch {
        fs.copyFileSync(frame.localPath, localPath);
      }
      
      const downloadPercent = 45 + ((i + 1) / sortedFrames.length) * 15;
      await reportProgress({
        phase: 'downloading',
        progress: downloadPercent,
        message: `Preparing frame ${i + 1} of ${sortedFrames.length}...`,
      });
    }
    
    // Prepare audio
    const audioPath = await prepareAudio(book, scope, chapterNumber, tempDir);
    
    // Create concat file
    const concatPath = createConcatFile(sortedFrames, tempDir, manifest.totalDuration);
    
    // Phase 4: Assemble video
    await reportProgress({
      phase: 'stitching',
      progress: 60,
      message: 'Assembling video...',
    });
    
    const videoOutputPath = path.join(tempDir, 'output.mp4');
    
    await assembleVideo(
      concatPath,
      audioPath,
      videoOutputPath,
      manifest.totalDuration,
      async (percent) => {
        const stitchPercent = 60 + (percent / 100) * 30;
        await reportProgress({
          phase: 'stitching',
          progress: stitchPercent,
          message: `Encoding video: ${Math.round(percent)}%...`,
        });
      }
    );
    
    // Phase 5: Upload final video
    await reportProgress({
      phase: 'uploading',
      progress: 90,
      message: 'Uploading video...',
    });
    
    // Read the output video
    const videoBuffer = fs.readFileSync(videoOutputPath);
    const videoSize = videoBuffer.length;
    
    // Upload to Vercel Blob
    const videoFilename = scope === 'chapter' 
      ? `video-exports/${bookId}/chapter-${chapterNumber}-${Date.now()}.mp4`
      : `video-exports/${bookId}/full-book-${Date.now()}.mp4`;
    
    const blob = await put(videoFilename, videoBuffer, {
      access: 'public',
      contentType: 'video/mp4',
      addRandomSuffix: false,
    });
    
    // Clean up rendered frames from blob storage
    if (uploadedFrames) {
      await cleanupFrames(renderedFrames);
    }
    
    // Phase 6: Complete
    await reportProgress({
      phase: 'complete',
      progress: 100,
      message: 'Video export complete!',
    });
    
    return {
      success: true,
      videoUrl: blob.url,
      videoDuration: manifest.totalDuration,
      videoSize,
    };
    
  } catch (error) {
    console.error('[VideoExport] Export failed:', error);
    
    await reportProgress({
      phase: 'error',
      progress: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // Clean up any rendered frames
    if (renderedFrames.length > 0) {
      try {
        if (uploadedFrames) {
          await cleanupFrames(renderedFrames);
        }
      } catch (e) {
        console.warn('[VideoExport] Failed to cleanup frames:', e);
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    
  } finally {
    // Clean up temp directory
    if (tempDir) {
      cleanupTempDir(tempDir);
    }
  }
}

/**
 * Estimate video file size
 */
export function estimateVideoSize(manifest: VideoManifest): {
  estimatedSizeMB: number;
  estimatedDurationMinutes: number;
} {
  // Rough estimate: ~3MB per minute at our quality settings
  const durationMinutes = manifest.totalDuration / 60;
  const estimatedSizeMB = Math.ceil(durationMinutes * 3);
  
  return {
    estimatedSizeMB,
    estimatedDurationMinutes: Math.round(durationMinutes * 10) / 10,
  };
}
