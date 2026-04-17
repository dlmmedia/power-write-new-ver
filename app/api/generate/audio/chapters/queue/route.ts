/**
 * POST /api/generate/audio/chapters/queue
 *
 * Enqueue per-chapter TTS jobs and return their BullMQ job ids immediately.
 * Clients then poll /api/generate/audio/chapters/status?ids=... for state.
 *
 * Request:
 *   { bookId: number|string, chapterNumbers: number[], voice: string,
 *     provider?: 'openai'|'gemini' }
 *
 * Response (202):
 *   { ok: true, jobs: Array<{ chapterId, chapterNumber, jobId }> }
 *
 * If REDIS_URL is not configured, returns 503 with an explicit hint —
 * callers should fall back to the synchronous /api/generate/audio route.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getBookWithChapters } from '@/lib/db/operations';
import { enqueue } from '@/lib/queue/queues';
import { isQueueEnabled } from '@/lib/queue/redis';
import { getUserInfo } from '@/lib/services/user-service';
import { createLogger } from '@/lib/log';

const log = createLogger('api/audio/queue');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!isQueueEnabled()) {
    return NextResponse.json(
      {
        error: 'Queue subsystem is disabled (REDIS_URL not set).',
        hint: 'Use POST /api/generate/audio for the synchronous path.',
      },
      { status: 503 },
    );
  }

  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    bookId,
    chapterNumbers,
    voice,
    provider = 'openai',
  } = (body ?? {}) as {
    bookId?: number | string;
    chapterNumbers?: number[];
    voice?: string;
    provider?: 'openai' | 'gemini';
  };

  if (!bookId || !voice || !Array.isArray(chapterNumbers) || chapterNumbers.length === 0) {
    return NextResponse.json(
      { error: 'bookId, voice, and chapterNumbers[] are required' },
      { status: 400 },
    );
  }

  if (provider !== 'openai' && provider !== 'gemini') {
    return NextResponse.json(
      { error: "provider must be 'openai' or 'gemini'" },
      { status: 400 },
    );
  }

  const book = await getBookWithChapters(bookId);
  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  const userInfo = await getUserInfo(clerkUserId);
  const isProUser = userInfo?.tier === 'pro';
  if (book.userId !== clerkUserId && !isProUser) {
    return NextResponse.json(
      { error: 'You do not own this book' },
      { status: 403 },
    );
  }

  const requested = new Set(chapterNumbers);
  const targetChapters = book.chapters.filter((c) => requested.has(c.chapterNumber));
  if (targetChapters.length === 0) {
    return NextResponse.json(
      { error: 'No matching chapters in book' },
      { status: 400 },
    );
  }

  const jobs: Array<{ chapterId: number; chapterNumber: number; jobId: string }> = [];
  for (const chapter of targetChapters) {
    const jobId = await enqueue('generate-chapter-audio', {
      bookId: book.id,
      chapterId: chapter.id,
      voice,
      provider,
    });
    if (!jobId) {
      // isQueueEnabled was true at the top; if enqueue still returned null
      // something flipped underneath us — surface it loudly.
      log.warn(
        { bookId: book.id, chapterId: chapter.id },
        'enqueue returned null after isQueueEnabled passed',
      );
      continue;
    }
    jobs.push({ chapterId: chapter.id, chapterNumber: chapter.chapterNumber, jobId });
  }

  log.info(
    { bookId: book.id, voice, provider, count: jobs.length, userId: clerkUserId },
    'audio jobs enqueued',
  );

  return NextResponse.json({ ok: true, jobs }, { status: 202 });
}
