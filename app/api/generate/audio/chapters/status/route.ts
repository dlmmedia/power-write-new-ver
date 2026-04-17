/**
 * GET /api/generate/audio/chapters/status?ids=1,2,3
 *
 * Bulk job-status lookup for queued chapter-audio jobs. Designed for short
 * client polling (every 2-3s) — does not hold any connections.
 *
 * Response:
 *   { ok: true, jobs: Array<JobStatus> }
 *
 * JobStatus.state ∈ waiting | active | completed | failed | delayed | unknown
 * JobStatus.returnvalue is { skipped, chapterId, audioUrl, duration } once done.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getJobStatus, queueForJob } from '@/lib/queue/queues';
import { isQueueEnabled } from '@/lib/queue/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isQueueEnabled()) {
    return NextResponse.json(
      { error: 'Queue subsystem is disabled (REDIS_URL not set).' },
      { status: 503 },
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const idsParam = request.nextUrl.searchParams.get('ids');
  if (!idsParam) {
    return NextResponse.json({ error: 'ids= query param required' }, { status: 400 });
  }

  const ids = idsParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50); // hard cap on a single request

  if (ids.length === 0) {
    return NextResponse.json({ error: 'no valid ids provided' }, { status: 400 });
  }

  const queue = queueForJob('generate-chapter-audio');
  const jobs = await Promise.all(ids.map((id) => getJobStatus(queue, id)));

  return NextResponse.json({
    ok: true,
    jobs: jobs.map((j, i) =>
      j ? j : { id: ids[i], queue, state: 'not_found' },
    ),
  });
}
