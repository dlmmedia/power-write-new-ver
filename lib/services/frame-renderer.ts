/**
 * Frame Renderer Service
 * 
 * Uses Puppeteer to render book pages as images for video export.
 * This service captures frames from the headless render page at /render/book/[id].
 */

import puppeteer from 'puppeteer';
import type { Browser, Page } from 'puppeteer-core';
import { put } from '@vercel/blob';
import * as path from 'path';
import * as fs from 'fs';
import { VideoManifest, ChapterTiming, PageTiming } from './video-sync-calculator';
import type { FontSize } from '@/lib/utils/pagination';

// Reading theme type
export type ReadingTheme = 'day' | 'night' | 'sepia' | 'focus';

// Frame dimensions (1080p video)
const FRAME_WIDTH = 1920;
const FRAME_HEIGHT = 1080;

// Flip animation settings
const FLIP_FRAME_COUNT = 15; // Number of frames for page flip animation
const FLIP_DURATION_MS = 600; // Duration of flip animation in ms

export interface FrameInfo {
  url?: string;
  localPath?: string;
  time: number;
  type: 'static' | 'flip';
  chapterIndex: number;
  pageIndex: number;
  flipFrame?: number;
  width: number;
  height: number;
}

export interface RenderProgress {
  phase: 'initializing' | 'rendering' | 'uploading' | 'complete';
  currentChapter: number;
  totalChapters: number;
  currentFrame: number;
  totalFrames: number;
  framesRendered: FrameInfo[];
}

export interface RenderOptions {
  bookId: number;
  baseUrl: string;
  theme: ReadingTheme;
  fontSize: FontSize;
  manifest: VideoManifest;
  outputPrefix: string;
  outputDir?: string;
  uploadFrames?: boolean;
  navigationWaitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
  onProgress?: (progress: RenderProgress) => void | Promise<void>;
}

const FRAME_JPEG_QUALITY = (() => {
  const raw = Number.parseInt(process.env.VIDEO_EXPORT_JPEG_QUALITY || '85', 10);
  if (!Number.isFinite(raw)) return 85;
  return Math.max(30, Math.min(95, raw));
})();

/**
 * Get Puppeteer browser instance
 * Uses different configurations for development vs production
 */
async function getBrowser(): Promise<Browser> {
  // Check if we're in a serverless/cloud environment
  // Railway sets RAILWAY_ENVIRONMENT, Vercel sets VERCEL, etc.
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
  const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PUBLIC_DOMAIN;
  const isProduction = process.env.NODE_ENV === 'production';
  
  console.log(`[FrameRenderer] Environment detection - isServerless: ${!!isServerless}, isRailway: ${!!isRailway}, isProduction: ${isProduction}`);
  
  if (isServerless) {
    // For Vercel/serverless, use puppeteer-core with @sparticuz/chromium
    try {
      console.log('[FrameRenderer] Attempting to use @sparticuz/chromium for serverless...');
      const chromium = await import('@sparticuz/chromium');
      const puppeteerCore = await import('puppeteer-core');
      
      const execPath = await chromium.default.executablePath();
      console.log(`[FrameRenderer] Chromium executable path: ${execPath}`);
      
      return await puppeteerCore.default.launch({
        args: chromium.default.args,
        defaultViewport: {
          width: FRAME_WIDTH,
          height: FRAME_HEIGHT,
        },
        executablePath: execPath,
        headless: true,
      });
    } catch (e) {
      console.warn('[FrameRenderer] Failed to use @sparticuz/chromium, falling back to puppeteer:', e);
    }
  }
  
  // For Railway or other production environments, try to use puppeteer with bundled Chromium
  // or system Chrome if available
  if (isRailway || isProduction) {
    console.log('[FrameRenderer] Running on Railway/production, using puppeteer with additional args...');
    
    // Check for PUPPETEER_EXECUTABLE_PATH (set in nixpacks.toml for Railway)
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (executablePath) {
      console.log(`[FrameRenderer] Using PUPPETEER_EXECUTABLE_PATH: ${executablePath}`);
    }
    
    try {
      const puppeteerCore = await import('puppeteer-core');
      return await puppeteerCore.default.launch({
        headless: true,
        executablePath: executablePath || undefined,
        defaultViewport: {
          width: FRAME_WIDTH,
          height: FRAME_HEIGHT,
        },
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--hide-scrollbars',
          '--mute-audio',
          '--single-process', // May help in containerized environments
          '--no-zygote', // Required for some containerized environments
        ],
      });
    } catch (launchError) {
      console.error('[FrameRenderer] Failed to launch puppeteer-core on Railway/production:', launchError);
      
      // Fallback to regular puppeteer
      console.log('[FrameRenderer] Attempting fallback to regular puppeteer...');
      try {
        return (await puppeteer.launch({
          headless: true,
          defaultViewport: {
            width: FRAME_WIDTH,
            height: FRAME_HEIGHT,
          },
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--disable-extensions',
          ],
        })) as unknown as Browser;
      } catch (fallbackError) {
        console.error('[FrameRenderer] Fallback also failed:', fallbackError);
        throw new Error(`Puppeteer launch failed: ${launchError instanceof Error ? launchError.message : String(launchError)}. Ensure Chrome/Chromium is installed in your Railway container (check nixpacks.toml).`);
      }
    }
  }
  
  // For local development, use regular puppeteer
  console.log('[FrameRenderer] Running in development mode, using standard puppeteer...');
  return (await puppeteer.launch({
    headless: true,
    defaultViewport: {
      width: FRAME_WIDTH,
      height: FRAME_HEIGHT,
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  })) as unknown as Browser;
}

/**
 * Wait for page to be ready for capture
 */
async function waitForRenderReady(page: Page, timeout: number = 10000): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const ready = await page.evaluate(() => {
      return (window as any).__RENDER_READY__ === true;
    });
    
    if (ready) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error('Timeout waiting for render to be ready');
}

/**
 * Build URL for render page with query parameters
 */
function buildRenderUrl(
  baseUrl: string,
  bookId: number,
  chapterIndex: number,
  pageIndex: number,
  theme: ReadingTheme,
  fontSize: FontSize,
  flipFrame?: number,
  flipDirection?: 'forward' | 'backward'
): string {
  const url = new URL(`${baseUrl}/render/book/${bookId}`);
  url.searchParams.set('chapter', chapterIndex.toString());
  url.searchParams.set('page', pageIndex.toString());
  url.searchParams.set('theme', theme);
  url.searchParams.set('fontSize', fontSize);
  
  if (flipFrame !== undefined) {
    url.searchParams.set('flipFrame', flipFrame.toString());
    url.searchParams.set('flipDirection', flipDirection || 'forward');
  }
  
  return url.toString();
}

/**
 * Capture a single frame from the render page
 */
async function captureFrame(
  page: Page,
  url: string,
  waitUntil: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2'
): Promise<Buffer> {
  await page.goto(url, { waitUntil, timeout: 60000 });
  await waitForRenderReady(page);
  
  // Small delay to ensure animations are complete
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Capture the render container
  const element = await page.$('#render-container');
  if (!element) {
    throw new Error('Render container not found');
  }
  
  const screenshot = await element.screenshot({
    type: 'jpeg',
    quality: FRAME_JPEG_QUALITY,
  });
  
  return Buffer.from(screenshot);
}

/**
 * Upload frame to Vercel Blob storage
 */
async function uploadFrame(
  frameBuffer: Buffer,
  filename: string
): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  }
  
  const blob = await put(filename, frameBuffer, {
    access: 'public',
    contentType: 'image/jpeg',
    addRandomSuffix: false,
  });
  
  return blob.url;
}

/**
 * Render all frames for a single chapter
 */
async function renderChapterFrames(
  page: Page,
  baseUrl: string,
  bookId: number,
  chapter: ChapterTiming,
  theme: ReadingTheme,
  fontSize: FontSize,
  outputPrefix: string,
  outputDir: string | undefined,
  uploadFrames: boolean,
  navigationWaitUntil: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2',
  startFrameIndex: number,
  onFrameRendered?: (frame: FrameInfo) => void | Promise<void>
): Promise<FrameInfo[]> {
  const frames: FrameInfo[] = [];
  let frameIndex = startFrameIndex;
  
  // Render static pages (every 2 pages for spread view)
  for (let i = 0; i < chapter.pages.length; i += 2) {
    const pageTiming = chapter.pages[i];
    
    // Build URL for this page
    const url = buildRenderUrl(
      baseUrl,
      bookId,
      chapter.chapterIndex,
      i,
      theme,
      fontSize
    );
    
    // Capture frame
    const frameBuffer = await captureFrame(page, url, navigationWaitUntil);

    // Persist locally if requested (fast path for video assembly)
    let localPath: string | undefined;
    if (outputDir) {
      localPath = path.join(outputDir, `frame-${String(frameIndex).padStart(6, '0')}.jpg`);
      fs.writeFileSync(localPath, frameBuffer);
    }
    
    // Upload to blob storage (optional; significantly slower than local disk)
    let frameUrl: string | undefined;
    if (uploadFrames) {
      const filename = `${outputPrefix}/frame-${String(frameIndex).padStart(6, '0')}.jpg`;
      frameUrl = await uploadFrame(frameBuffer, filename);
    }
    
    const frameInfo: FrameInfo = {
      url: frameUrl,
      localPath,
      time: pageTiming.startTime,
      type: 'static',
      chapterIndex: chapter.chapterIndex,
      pageIndex: i,
      width: FRAME_WIDTH,
      height: FRAME_HEIGHT,
    };
    
    frames.push(frameInfo);
    if (onFrameRendered) await onFrameRendered(frameInfo);
    
    frameIndex++;
  }
  
  // Render page flip animations
  for (const flip of chapter.flipTransitions) {
    for (let f = 0; f < FLIP_FRAME_COUNT; f++) {
      // Build URL for flip frame
      const url = buildRenderUrl(
        baseUrl,
        bookId,
        chapter.chapterIndex,
        flip.fromPage,
        theme,
        fontSize,
        f,
        'forward'
      );
      
      // Capture frame
      const frameBuffer = await captureFrame(page, url, navigationWaitUntil);

      // Persist locally if requested
      let localPath: string | undefined;
      if (outputDir) {
        localPath = path.join(outputDir, `frame-${String(frameIndex).padStart(6, '0')}.jpg`);
        fs.writeFileSync(localPath, frameBuffer);
      }
      
      // Upload to blob storage (optional)
      let frameUrl: string | undefined;
      if (uploadFrames) {
        const filename = `${outputPrefix}/frame-${String(frameIndex).padStart(6, '0')}.jpg`;
        frameUrl = await uploadFrame(frameBuffer, filename);
      }
      
      const flipTime = flip.startTime + (f / FLIP_FRAME_COUNT) * flip.duration;
      
      const frameInfo: FrameInfo = {
        url: frameUrl,
        localPath,
        time: flipTime,
        type: 'flip',
        chapterIndex: chapter.chapterIndex,
        pageIndex: flip.fromPage,
        flipFrame: f,
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT,
      };
      
      frames.push(frameInfo);
      if (onFrameRendered) await onFrameRendered(frameInfo);
      
      frameIndex++;
    }
  }
  
  return frames;
}

/**
 * Render all frames for a book or chapter
 */
export async function renderFrames(options: RenderOptions): Promise<FrameInfo[]> {
  const {
    bookId,
    baseUrl,
    theme,
    fontSize,
    manifest,
    outputPrefix,
    outputDir,
    uploadFrames = false,
    navigationWaitUntil = 'domcontentloaded',
    onProgress,
  } = options;
  
  const allFrames: FrameInfo[] = [];
  let browser: Browser | null = null;
  
  try {
    // Initialize progress
    const progress: RenderProgress = {
      phase: 'initializing',
      currentChapter: 0,
      totalChapters: manifest.chapters.length,
      currentFrame: 0,
      totalFrames: manifest.totalFrames,
      framesRendered: [],
    };
    
    if (onProgress) await onProgress(progress);
    
    // Launch browser
    browser = await getBrowser();
    const page = await browser.newPage();

    // More forgiving timeouts for slow cold starts
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);

    // Bypass service worker (can cause stalls in headless navigation)
    try {
      const client = await page.target().createCDPSession();
      await client.send('Network.enable');
      await client.send('Network.setBypassServiceWorker', { bypass: true });
    } catch (e) {
      console.warn('[FrameRenderer] Failed to bypass service worker:', e);
    }

    // Enable caching inside Chromium
    try {
      await page.setCacheEnabled(true);
    } catch (e) {
      console.warn('[FrameRenderer] Failed to enable page cache:', e);
    }

    // Cache `/api/books/:id` response to avoid repeated DB/API calls per frame
    const cachedApiResponses = new Map<string, { body: string; contentType: string }>();
    try {
      await page.setRequestInterception(true);
      page.on('request', async (req) => {
        try {
          const reqUrl = new URL(req.url());
          const isBookApi = req.method() === 'GET' && reqUrl.pathname === `/api/books/${bookId}`;
          const cached = cachedApiResponses.get(reqUrl.pathname);
          if (isBookApi && cached) {
            await req.respond({
              status: 200,
              contentType: cached.contentType,
              body: cached.body,
            });
            return;
          }
          await req.continue();
        } catch {
          try {
            await req.continue();
          } catch {
            // ignore
          }
        }
      });

      page.on('response', async (res) => {
        try {
          const resUrl = new URL(res.url());
          const isBookApi = res.request().method() === 'GET' && resUrl.pathname === `/api/books/${bookId}`;
          if (!isBookApi) return;
          if (res.status() !== 200) return;
          if (cachedApiResponses.has(resUrl.pathname)) return;
          const body = await res.text();
          const contentType = res.headers()['content-type'] || 'application/json';
          cachedApiResponses.set(resUrl.pathname, { body, contentType });
        } catch {
          // ignore
        }
      });
    } catch (e) {
      console.warn('[FrameRenderer] Failed to enable request interception cache:', e);
    }
    
    // Set viewport
    await page.setViewport({
      width: FRAME_WIDTH,
      height: FRAME_HEIGHT,
      deviceScaleFactor: 1,
    });

    // Reduce CPU churn from animations/transitions (we render deterministic frames)
    try {
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
          }
        `,
      });
    } catch (e) {
      console.warn('[FrameRenderer] Failed to inject no-animation CSS:', e);
    }
    
    progress.phase = 'rendering';
    if (onProgress) await onProgress(progress);
    
    let frameIndex = 0;
    
    // Render each chapter
    for (let chapterIdx = 0; chapterIdx < manifest.chapters.length; chapterIdx++) {
      const chapter = manifest.chapters[chapterIdx];
      
      progress.currentChapter = chapterIdx;
      if (onProgress) await onProgress(progress);
      
      // Render chapter frames
      const chapterFrames = await renderChapterFrames(
        page,
        baseUrl,
        bookId,
        chapter,
        theme,
        fontSize,
        outputPrefix,
        outputDir,
        uploadFrames,
        navigationWaitUntil,
        frameIndex,
        async (frame) => {
          progress.currentFrame++;
          progress.framesRendered.push(frame);
          if (onProgress) await onProgress(progress);
        }
      );
      
      allFrames.push(...chapterFrames);
      frameIndex += chapterFrames.length;
    }
    
    progress.phase = 'complete';
    if (onProgress) await onProgress(progress);
    
    return allFrames;
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Render frames for a single chapter
 */
export async function renderChapter(
  bookId: number,
  chapterIndex: number,
  chapter: ChapterTiming,
  baseUrl: string,
  theme: ReadingTheme,
  fontSize: FontSize,
  outputPrefix: string,
  onProgress?: (progress: RenderProgress) => void | Promise<void>
): Promise<FrameInfo[]> {
  let browser: Browser | null = null;
  
  try {
    // Estimate total frames for this chapter
    const staticFrames = Math.ceil(chapter.totalPages / 2);
    const flipFrames = chapter.flipTransitions.length * FLIP_FRAME_COUNT;
    const totalFrames = staticFrames + flipFrames;
    
    const progress: RenderProgress = {
      phase: 'initializing',
      currentChapter: 0,
      totalChapters: 1,
      currentFrame: 0,
      totalFrames,
      framesRendered: [],
    };
    
    if (onProgress) await onProgress(progress);
    
    // Launch browser
    browser = await getBrowser();
    const page = await browser.newPage();
    
    await page.setViewport({
      width: FRAME_WIDTH,
      height: FRAME_HEIGHT,
      deviceScaleFactor: 1,
    });
    
    progress.phase = 'rendering';
    if (onProgress) await onProgress(progress);
    
    // Render chapter frames
    const frames = await renderChapterFrames(
      page,
      baseUrl,
      bookId,
      chapter,
      theme,
      fontSize,
      outputPrefix,
      undefined,
      true,
      'domcontentloaded',
      0,
      async (frame) => {
        progress.currentFrame++;
        progress.framesRendered.push(frame);
        if (onProgress) await onProgress(progress);
      }
    );
    
    progress.phase = 'complete';
    if (onProgress) await onProgress(progress);
    
    return frames;
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Clean up frame files from blob storage
 */
export async function cleanupFrames(frames: FrameInfo[]): Promise<void> {
  const { del } = await import('@vercel/blob');
  
  for (const frame of frames) {
    try {
      if (!frame.url) continue;
      await del(frame.url);
    } catch (e) {
      console.warn(`[FrameRenderer] Failed to delete frame: ${frame.url}`, e);
    }
  }
}
