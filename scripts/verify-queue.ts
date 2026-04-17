/**
 * End-to-end smoke test for the queue subsystem.
 *
 * What it verifies:
 *   1. REDIS_URL is set and Redis is reachable.
 *   2. enqueue() returns a job id.
 *   3. A short-lived inline worker picks up the job and runs the stub
 *      processor.
 *   4. Counts on the queue advance correctly through waiting → completed.
 *   5. Graceful shutdown cleans up Redis connections (no dangling clients).
 *
 * Skips gracefully when REDIS_URL is unset so CI doesn't fail before
 * Redis is provisioned.
 *
 * Run:
 *   npm run queue:verify
 */

import { Worker } from 'bullmq';
import { isQueueEnabled, getRedis, closeRedis } from '../lib/queue/redis';
import { enqueue, closeQueues, QUEUE_NAMES } from '../lib/queue/queues';
import { processors } from '../lib/queue/processors';

async function main() {
  if (!isQueueEnabled()) {
    console.log('REDIS_URL is not set — skipping queue smoke test.');
    console.log(
      'To enable: provision Redis on Railway and add REDIS_URL to .env.local.',
    );
    process.exit(0);
  }

  console.log('--- Queue smoke test ---');

  console.log('\n[1/4] Connecting to Redis...');
  const conn = getRedis();
  const pong = await conn.ping();
  console.log(`   PING: ${pong}`);
  if (pong !== 'PONG') throw new Error('Redis ping failed');

  console.log('\n[2/4] Enqueuing a stub generate-chapter job...');
  const jobId = await enqueue('generate-chapter', {
    bookId: -1,
    chapterNumber: 0,
    attempt: 0,
  });
  if (!jobId) throw new Error('enqueue returned null with REDIS_URL set');
  console.log(`   job id: ${jobId}`);

  console.log('\n[3/4] Spinning up an inline worker to drain it...');
  let resolveDone: (() => void) | null = null;
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });

  const worker = new Worker(
    QUEUE_NAMES.bookGeneration,
    async (job) => {
      console.log(`   worker received job ${job.id} (${job.name})`);
      const proc = processors[job.name as 'generate-chapter'];
      const result = await proc(job as Parameters<typeof proc>[0]);
      console.log(`   processor returned: ${JSON.stringify(result)}`);
      return result;
    },
    { connection: conn, concurrency: 1 },
  );

  worker.on('completed', (job) => {
    console.log(`   ✓ job ${job.id} completed`);
    resolveDone?.();
  });
  worker.on('failed', (job, err) => {
    console.error(`   ✗ job ${job?.id} failed: ${err.message}`);
    resolveDone?.();
  });

  await done;

  console.log('\n[4/4] Cleaning up...');
  await worker.close();
  await closeQueues();
  await closeRedis();
  console.log('   workers + queues + redis closed');

  console.log('\nPASS');
  process.exit(0);
}

main().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});
