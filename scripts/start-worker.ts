/**
 * Worker process entry point.
 *
 * Usage:
 *   npm run worker         (one-shot, dev or local)
 *   npm run worker:dev     (with auto-reload via tsx watch)
 *
 * On Railway: create a separate service (same repo) with start command
 * `npm run worker` and add REDIS_URL + DATABASE_URL to its env.
 *
 * On exit signal (SIGTERM/SIGINT) the workers drain in-flight jobs and
 * close all connections cleanly.
 */

import { startWorkers, bindSignalHandlers } from '../lib/queue/worker';
import { isQueueEnabled } from '../lib/queue/redis';
import { createLogger } from '../lib/log';

const log = createLogger('worker-main');

async function main() {
  if (!isQueueEnabled()) {
    log.error(
      'REDIS_URL is not set. Worker cannot start. Provision Redis on ' +
        'Railway and reference its URL via the REDIS_URL env var.',
    );
    process.exit(1);
  }

  log.info({ pid: process.pid }, 'starting worker process');
  bindSignalHandlers();
  const workers = startWorkers();
  log.info({ count: workers.length }, 'worker process ready');
}

main().catch((err) => {
  log.error({ err }, 'fatal worker startup error');
  process.exit(1);
});
