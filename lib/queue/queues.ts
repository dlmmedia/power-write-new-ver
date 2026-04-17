/**
 * Queue + job definitions.
 *
 * Add a new job type by:
 *   1. Defining its payload schema in QUEUE_JOBS below.
 *   2. Registering its handler in `lib/queue/processors.ts`.
 *   3. Calling `enqueue('queue-name', 'job-name', payload)` from the API.
 *
 * Why one queue per concern (instead of one mega-queue): BullMQ's worker
 * concurrency, retry, and rate-limiting are queue-scoped. Splitting by
 * concern lets us tune e.g. book-generation (heavy, 1 concurrent) vs
 * audio-generation (light, 5 concurrent) independently.
 */

import { Queue, type Job, type JobsOptions } from 'bullmq';
import { isQueueEnabled, getRedis } from './redis';
import { createLogger } from '../log';

const log = createLogger('queue/queues');

/**
 * Canonical queue names. These map 1:1 to BullMQ Queue instances.
 * Keep names stable across deploys — they are persisted in Redis.
 */
export const QUEUE_NAMES = {
  bookGeneration: 'book-generation',
  audioGeneration: 'audio-generation',
  export: 'export',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

/**
 * Job-type → payload-shape registry. Used as the source of truth for
 * type-safe enqueue() / processor signatures.
 */
export interface JobPayloads {
  // book-generation queue
  'generate-chapter': {
    bookId: number;
    chapterNumber: number;
    /** Re-attempt counter for diagnostics (BullMQ also tracks this). */
    attempt?: number;
  };
  'generate-book': {
    bookId: number;
    /** Speed mode chosen at submission time (overrides config defaults). */
    speed?: 'quality' | 'balanced' | 'fast';
  };

  // audio-generation queue
  'generate-chapter-audio': {
    bookId: number;
    chapterId: number;
    voice: string;
    /** TTS provider override; falls back to user/book defaults. */
    provider?: 'openai' | 'gemini';
  };

  // export queue
  'export-book': {
    bookId: number;
    format: 'pdf' | 'epub' | 'docx' | 'md' | 'txt' | 'html';
    requestedByUserId: string;
    /**
     * `book_exports.id` of the tracking row created by the API route at
     * enqueue time. Passed in the payload (rather than looked up by
     * BullMQ job id) to avoid a race where the worker starts before
     * the route can persist the job id back to the row.
     */
    exportRowId?: number;
  };
}

export type JobName = keyof JobPayloads;

const JOB_TO_QUEUE: Record<JobName, QueueName> = {
  'generate-chapter': QUEUE_NAMES.bookGeneration,
  'generate-book': QUEUE_NAMES.bookGeneration,
  'generate-chapter-audio': QUEUE_NAMES.audioGeneration,
  'export-book': QUEUE_NAMES.export,
};

/**
 * Default job options used for every enqueued job unless overridden:
 *   - `attempts: 3` with exponential backoff (~5s, 25s, 125s) — covers
 *     transient LLM rate-limits and Neon connection blips.
 *   - `removeOnComplete` keeps the last 1000 successful jobs for debugging,
 *     keeps failed jobs forever (we explicitly clean them on the dashboard).
 *   - `attempts` of 1 for export jobs so users don't get a duplicate
 *     download three minutes after their first attempt.
 */
const DEFAULT_OPTS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5_000 },
  removeOnComplete: { age: 24 * 3600, count: 1_000 },
  removeOnFail: false,
};

const PER_JOB_OPTS: Partial<Record<JobName, JobsOptions>> = {
  'export-book': { ...DEFAULT_OPTS, attempts: 1 },
};

/**
 * Lazily-instantiated queues, keyed by name. Created on first use to avoid
 * opening a Redis connection at import time when the queue is disabled.
 */
const queues = new Map<QueueName, Queue>();

function getQueue(name: QueueName): Queue {
  let q = queues.get(name);
  if (q) return q;
  q = new Queue(name, { connection: getRedis() });
  q.on('error', (err) => log.error({ err, queue: name }, 'queue error'));
  queues.set(name, q);
  return q;
}

/**
 * Enqueue a job. Returns the BullMQ job id when accepted, or null when the
 * queue subsystem is disabled. Callers should treat null as "fall back to
 * inline processing".
 *
 * Example:
 *   const id = await enqueue('generate-chapter', { bookId: 42, chapterNumber: 3 });
 *   if (id === null) {
 *     await generateChapterInline({ bookId: 42, chapterNumber: 3 });
 *   }
 */
export async function enqueue<N extends JobName>(
  name: N,
  payload: JobPayloads[N],
  overrides?: JobsOptions,
): Promise<string | null> {
  if (!isQueueEnabled()) {
    log.debug({ name }, 'queue disabled; skipping enqueue');
    return null;
  }

  const queueName = JOB_TO_QUEUE[name];
  const opts = { ...(PER_JOB_OPTS[name] ?? DEFAULT_OPTS), ...overrides };
  const job = await getQueue(queueName).add(name, payload, opts);
  log.info(
    { name, queue: queueName, jobId: job.id, opts: { attempts: opts.attempts } },
    'job enqueued',
  );
  return job.id ?? null;
}

/**
 * Lookup a job by id across all known queues. Returns the BullMQ Job
 * instance plus its current state (`waiting | active | completed | failed | delayed | unknown`).
 *
 * Designed for short-poll status endpoints — does not hold the connection.
 */
export interface JobStatus {
  id: string;
  name: JobName;
  queue: QueueName;
  state: string;
  progress: unknown;
  attemptsMade: number;
  failedReason: string | null;
  returnvalue: unknown;
  finishedOn: number | null;
  processedOn: number | null;
}

export async function getJobStatus(
  queueName: QueueName,
  jobId: string,
): Promise<JobStatus | null> {
  if (!isQueueEnabled()) return null;
  const queue = getQueue(queueName);
  const job: Job | undefined = await queue.getJob(jobId);
  if (!job) return null;
  const state = await job.getState();
  return {
    id: String(job.id),
    name: job.name as JobName,
    queue: queueName,
    state,
    progress: job.progress,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason ?? null,
    returnvalue: job.returnvalue,
    finishedOn: job.finishedOn ?? null,
    processedOn: job.processedOn ?? null,
  };
}

/**
 * Resolve which queue owns a given job name. Useful for callers that have
 * a job id + name but don't want to encode the queue routing themselves.
 */
export function queueForJob(name: JobName): QueueName {
  return JOB_TO_QUEUE[name];
}

/**
 * Tear down all queue connections. Used by graceful shutdown handlers.
 */
export async function closeQueues(): Promise<void> {
  await Promise.all(
    Array.from(queues.values()).map((q) =>
      q.close().catch((err) => log.warn({ err }, 'queue close failed')),
    ),
  );
  queues.clear();
}

/** All queue names — used by workers/admin tools to iterate. */
export function allQueueNames(): QueueName[] {
  return Object.values(QUEUE_NAMES);
}
