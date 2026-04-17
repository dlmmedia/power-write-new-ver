/**
 * Worker registration + graceful shutdown.
 *
 * Workers are short-lived processes that pull jobs from their assigned
 * queue, execute the matching processor, and ACK / NACK the result.
 *
 * Concurrency tuning lives here: each queue gets its own `concurrency`
 * setting based on the cost of its jobs. Heavy LLM jobs run 1 at a time
 * per worker process to respect upstream rate limits; lightweight jobs
 * (audio segment, export) can fan out.
 *
 * Run via:
 *   npm run worker
 *
 * On Railway: define a separate service from the same repo, set the start
 * command to `npm run worker`. Web traffic stays on the existing service.
 */

import { Worker, type Job } from 'bullmq';
import { getRedis, isQueueEnabled, closeRedis } from './redis';
import { allQueueNames, closeQueues, type JobName, type QueueName } from './queues';
import { processors } from './processors';
import { createLogger } from '../log';

const log = createLogger('queue/worker');

/**
 * Per-queue concurrency. Defaults are conservative; tune as we learn the
 * real cost profile of each job type.
 */
const CONCURRENCY: Record<QueueName, number> = {
  'book-generation': 1,
  'audio-generation': 4,
  'export': 2,
};

/**
 * Per-queue timeouts. Hard upper bound on a single job execution. BullMQ
 * stall checks fire if no progress is reported in this window.
 */
const STALL_TIMEOUT_MS: Record<QueueName, number> = {
  'book-generation': 30 * 60_000, // 30 minutes
  'audio-generation': 10 * 60_000, // 10 minutes
  'export': 5 * 60_000,            // 5 minutes
};

const workers: Worker[] = [];

/**
 * Spin up a worker for every registered queue. Returns the worker list
 * for tests/diagnostics.
 */
export function startWorkers(): Worker[] {
  if (!isQueueEnabled()) {
    log.warn('REDIS_URL not set; worker process exiting (nothing to do).');
    process.exit(0);
  }

  if (workers.length > 0) {
    log.warn('startWorkers() called twice; ignoring.');
    return workers;
  }

  const connection = getRedis();

  for (const queueName of allQueueNames()) {
    const w = new Worker(
      queueName,
      async (job: Job) => {
        const name = job.name as JobName;
        const processor = processors[name];
        if (!processor) {
          throw new Error(`No processor registered for job "${name}"`);
        }
        const start = Date.now();
        try {
          // The processors map is keyed by job name and the job payload type
          // is enforced at enqueue() time; bridging the type here would
          // require N parallel union narrowings, so we cast once at the seam.
          const result = await (processor as (j: Job) => Promise<unknown>)(job);
          log.info(
            { jobId: job.id, name, queue: queueName, ms: Date.now() - start },
            'job complete',
          );
          return result;
        } catch (err) {
          log.error(
            {
              err,
              jobId: job.id,
              name,
              queue: queueName,
              attempt: job.attemptsMade + 1,
              maxAttempts: job.opts.attempts,
              ms: Date.now() - start,
            },
            'job failed',
          );
          throw err;
        }
      },
      {
        connection,
        concurrency: CONCURRENCY[queueName],
        stalledInterval: 30_000,
        lockDuration: STALL_TIMEOUT_MS[queueName],
      },
    );

    w.on('failed', (job, err) => {
      log.warn(
        { jobId: job?.id, name: job?.name, attempt: job?.attemptsMade, err: err?.message },
        'job failed event',
      );
    });
    w.on('error', (err) => log.error({ err, queue: queueName }, 'worker error'));
    w.on('stalled', (jobId) => log.warn({ jobId, queue: queueName }, 'job stalled'));

    workers.push(w);
    log.info({ queue: queueName, concurrency: CONCURRENCY[queueName] }, 'worker started');
  }

  return workers;
}

/**
 * Graceful shutdown: stop accepting new jobs, finish in-flight ones, then
 * close all connections. Designed to fit inside Railway's SIGTERM grace
 * period (default 30s, which is plenty for our concurrency).
 */
export async function shutdownWorkers(reason: string): Promise<void> {
  log.info({ reason, workerCount: workers.length }, 'shutting down workers');
  await Promise.all(
    workers.map((w) =>
      w.close().catch((err) => log.warn({ err }, 'worker close failed')),
    ),
  );
  workers.length = 0;
  await closeQueues();
  await closeRedis();
  log.info('worker shutdown complete');
}

/**
 * Wire SIGTERM/SIGINT to graceful shutdown. Idempotent.
 */
let signalsBound = false;
export function bindSignalHandlers(): void {
  if (signalsBound) return;
  signalsBound = true;

  for (const sig of ['SIGTERM', 'SIGINT'] as const) {
    process.on(sig, () => {
      shutdownWorkers(sig)
        .then(() => process.exit(0))
        .catch((err) => {
          log.error({ err }, 'shutdown failed');
          process.exit(1);
        });
    });
  }

  process.on('uncaughtException', (err) => {
    log.error({ err }, 'uncaught exception in worker');
    shutdownWorkers('uncaughtException').finally(() => process.exit(1));
  });
}
