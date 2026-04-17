/**
 * Enqueue a stub job into the live queue WITHOUT spinning up a local worker.
 * Used to prove the production in-process worker is draining jobs.
 *
 * Usage:
 *   dotenv -e .env.local -- tsx scripts/enqueue-stub.ts
 */
import { enqueue } from '../lib/queue/queues';
import { isQueueEnabled, closeRedis } from '../lib/queue/redis';

async function main() {
  if (!isQueueEnabled()) {
    console.error('REDIS_URL not set — cannot enqueue.');
    process.exit(1);
  }
  const jobId = await enqueue('generate-chapter', {
    bookId: -2,
    chapterNumber: 0,
    attempt: 0,
  });
  if (!jobId) {
    console.error('enqueue returned null');
    process.exit(1);
  }
  console.log(`enqueued generate-chapter id=${jobId}`);
  await closeRedis();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
