/**
 * Diagnostic + cleanup tool for BullMQ failed jobs.
 *
 * Usage:
 *   tsx scripts/inspect-failed-jobs.ts [--cleanup] [--queue=<name>]
 *
 * Defaults to read-only: lists every failed job across all queues with
 * its failedReason + payload + stacktrace. Pass --cleanup to remove the
 * failed jobs after listing them (useful for clearing verification stubs).
 *
 * Reads REDIS_URL from the environment. When cleaning up against prod,
 * use the public Redis URL (REDIS_PUBLIC_URL on the Redis service):
 *   REDIS_URL="$REDIS_PUBLIC_URL" tsx scripts/inspect-failed-jobs.ts --cleanup
 */
import IORedis from 'ioredis';
import { Queue } from 'bullmq';

const QUEUE_NAMES = ['book-generation', 'audio-generation', 'export'] as const;
type QueueName = (typeof QUEUE_NAMES)[number];

interface Args {
  cleanup: boolean;
  filterQueue: QueueName | null;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { cleanup: false, filterQueue: null };
  for (const arg of argv.slice(2)) {
    if (arg === '--cleanup' || arg === '-c') {
      args.cleanup = true;
    } else if (arg.startsWith('--queue=')) {
      const value = arg.slice('--queue='.length) as QueueName;
      if (!QUEUE_NAMES.includes(value)) {
        console.error(`Unknown queue "${value}". Valid: ${QUEUE_NAMES.join(', ')}`);
        process.exit(2);
      }
      args.filterQueue = value;
    } else {
      console.error(`Unknown arg: ${arg}`);
      process.exit(2);
    }
  }
  return args;
}

async function main(): Promise<void> {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.error('REDIS_URL not set');
    process.exit(2);
  }

  const args = parseArgs(process.argv);
  console.log(
    `mode: ${args.cleanup ? 'CLEANUP (will delete failed jobs)' : 'read-only'}` +
      (args.filterQueue ? `  queue: ${args.filterQueue}` : ''),
  );

  const connection = new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  let totalRemoved = 0;
  for (const name of QUEUE_NAMES) {
    if (args.filterQueue && args.filterQueue !== name) continue;

    const q = new Queue(name, { connection });
    const counts = await q.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
    );
    console.log(`\n=== ${name} ===`);
    console.log('counts:', counts);

    if (counts.failed > 0) {
      // Page through up to 200 failed jobs per queue. Anything more than
      // that and we should be looking at this in a UI not a script.
      const failed = await q.getFailed(0, 200);
      for (const job of failed) {
        console.log('---');
        console.log('jobId:', job.id);
        console.log('name:', job.name);
        console.log('attemptsMade:', job.attemptsMade);
        console.log('timestamp:', new Date(job.timestamp).toISOString());
        if (job.finishedOn) {
          console.log('finishedOn:', new Date(job.finishedOn).toISOString());
        }
        console.log('data:', JSON.stringify(job.data));
        console.log('failedReason:', job.failedReason);
        if (job.stacktrace && job.stacktrace.length > 0) {
          console.log('stacktrace[0]:');
          console.log(job.stacktrace[0]);
        }
        if (args.cleanup) {
          await job.remove();
          totalRemoved += 1;
          console.log('removed: yes');
        }
      }
    }

    await q.close();
  }

  console.log(`\nfailed jobs removed: ${totalRemoved}`);
  await connection.quit();
}

main().catch((err) => {
  console.error('inspect-failed-jobs failed:', err);
  process.exit(1);
});
