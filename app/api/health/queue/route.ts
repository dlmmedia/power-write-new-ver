import { NextResponse } from 'next/server';
import { Queue } from 'bullmq';
import { isQueueEnabled, getRedis } from '@/lib/queue/redis';
import { allQueueNames } from '@/lib/queue/queues';
import { createLogger } from '@/lib/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const log = createLogger('api/health/queue');

/**
 * Lightweight queue health check. Reports per-queue counts (waiting,
 * active, completed, failed, delayed) when REDIS_URL is set, otherwise a
 * 503 so monitoring can alert on a missing Redis env in prod.
 *
 * Used by:
 *   - Railway healthcheck on the worker service
 *   - Local debugging: `curl http://localhost:3000/api/health/queue`
 */
export async function GET() {
  if (!isQueueEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        enabled: false,
        message: 'REDIS_URL is not set; queue subsystem inactive.',
      },
      { status: 503 },
    );
  }

  try {
    const connection = getRedis();
    const queues = allQueueNames().map(
      (name) => new Queue(name, { connection }),
    );

    const stats = await Promise.all(
      queues.map(async (q) => {
        const counts = await q.getJobCounts(
          'waiting',
          'active',
          'completed',
          'failed',
          'delayed',
        );
        return { name: q.name, ...counts };
      }),
    );

    // Don't close the queues — the connection is shared and re-used.
    return NextResponse.json({ ok: true, enabled: true, queues: stats });
  } catch (err) {
    log.error({ err }, 'queue health check failed');
    return NextResponse.json(
      {
        ok: false,
        enabled: true,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
