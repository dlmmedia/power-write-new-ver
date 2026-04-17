/**
 * End-to-end smoke test for the real generate-chapter-audio processor.
 *
 * Two test paths, both ZERO-spend and ZERO-mutation:
 *
 *   1. Error path:   Enqueue with bookId=-99 → expect job to FAIL with
 *                    "Book -99 not found". Proves: enqueue, worker pickup,
 *                    DB lookup, error propagation via BullMQ.
 *
 *   2. Idempotency:  Enqueue against an existing chapter with its CURRENT
 *                    voice → processor short-circuits with skipped=true.
 *                    Proves: DB read, metadata parsing, idempotency guard.
 *                    Does NOT call the TTS provider, does NOT mutate the row.
 *
 * Usage:
 *   dotenv -e .env.local -- tsx scripts/verify-audio-processor.ts
 */
import { db } from '../lib/db/index';
import { bookChapters } from '../lib/db/schema';
import { isNotNull } from 'drizzle-orm';
import {
  enqueue,
  getJobStatus,
  queueForJob,
  closeQueues,
} from '../lib/queue/queues';
import { isQueueEnabled, closeRedis } from '../lib/queue/redis';

async function poll(jobId: string, maxMs = 30_000): Promise<NonNullable<Awaited<ReturnType<typeof getJobStatus>>>> {
  const queue = queueForJob('generate-chapter-audio');
  const start = Date.now();
  let last: Awaited<ReturnType<typeof getJobStatus>> = null;
  while (Date.now() - start < maxMs) {
    last = await getJobStatus(queue, jobId);
    if (last && (last.state === 'completed' || last.state === 'failed')) {
      return last;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!last) throw new Error(`Job ${jobId} not found in Redis`);
  throw new Error(`Job ${jobId} did not finish in ${maxMs}ms; last state=${last.state}`);
}

async function main() {
  console.log('--- Audio processor smoke test ---\n');

  if (!isQueueEnabled()) {
    console.error('REDIS_URL not set; aborting');
    process.exit(1);
  }

  console.log('[setup] using PRODUCTION worker (no local worker spawned)\n');

  try {
    console.log('\n[1/2] Error-path test (bookId=-99)');
    // attempts: 1 so a single verification doesn't pollute the dashboard
    // with 3 retried failures (the queue default is 3 with backoff for
    // real jobs — that's correct, but pointless for a deliberately-bad
    // smoke test where every retry will fail identically).
    const errId = await enqueue(
      'generate-chapter-audio',
      {
        bookId: -99,
        chapterId: -99,
        voice: 'alloy',
        provider: 'openai',
      },
      { attempts: 1 },
    );
    if (!errId) throw new Error('enqueue returned null');
    console.log(`   enqueued jobId=${errId}`);
    const errResult = await poll(errId);
    console.log(`   final state: ${errResult.state}`);
    console.log(`   failedReason: ${errResult.failedReason}`);
    if (errResult.state !== 'failed') {
      throw new Error(`expected failed, got ${errResult.state}`);
    }
    if (!errResult.failedReason?.includes('not found')) {
      throw new Error(`unexpected failure reason: ${errResult.failedReason}`);
    }
    console.log('   ✓ error propagation OK');

    console.log('\n[2/2] Idempotency test (existing audio chapter)');
    const [target] = await db
      .select({
        id: bookChapters.id,
        bookId: bookChapters.bookId,
        chapterNumber: bookChapters.chapterNumber,
        audioUrl: bookChapters.audioUrl,
        audioMetadata: bookChapters.audioMetadata,
      })
      .from(bookChapters)
      .where(isNotNull(bookChapters.audioUrl))
      .limit(1);

    if (!target) {
      console.log('   (no existing audio chapter found; skipping)');
    } else {
      const meta = target.audioMetadata as Record<string, unknown> | null;
      const voice = (meta?.voice as string) ?? 'alloy';
      const provider = ((meta?.provider as string) ?? 'openai') as 'openai' | 'gemini';
      console.log(
        `   target: bookId=${target.bookId} chapterId=${target.id} voice=${voice} provider=${provider}`,
      );

      const before = target.audioUrl;
      const idemId = await enqueue('generate-chapter-audio', {
        bookId: target.bookId,
        chapterId: target.id,
        voice,
        provider,
      });
      if (!idemId) throw new Error('enqueue returned null');
      console.log(`   enqueued jobId=${idemId}`);
      const idemResult = await poll(idemId, 15_000);
      console.log(`   final state: ${idemResult.state}`);
      const ret = idemResult.returnvalue as { skipped?: boolean; audioUrl?: string };
      console.log(`   returnvalue.skipped: ${ret?.skipped}`);
      if (idemResult.state !== 'completed') {
        throw new Error(`expected completed, got ${idemResult.state}: ${idemResult.failedReason}`);
      }
      if (ret?.skipped !== true) {
        throw new Error(`expected skipped=true, got ${ret?.skipped}`);
      }
      if (ret.audioUrl !== before) {
        throw new Error(`audioUrl was mutated! before=${before} after=${ret.audioUrl}`);
      }

      // Verify DB row is unchanged
      const [after] = await db
        .select({
          audioUrl: bookChapters.audioUrl,
        })
        .from(bookChapters)
        .where(isNotNull(bookChapters.audioUrl))
        .limit(1);
      if (after?.audioUrl !== before) {
        throw new Error(`DB audio_url was mutated! before=${before} after=${after?.audioUrl}`);
      }
      console.log('   ✓ idempotency OK — no TTS call, no DB mutation');
    }

    console.log('\n--- PASS ---');
  } finally {
    console.log('\n[cleanup] closing connections...');
    await closeQueues();
    await closeRedis();
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});
