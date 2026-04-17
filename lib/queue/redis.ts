/**
 * Lazy ioredis connection used by BullMQ queues + workers.
 *
 * Why a singleton:
 *   - BullMQ instantiates one connection per Queue/Worker. In dev with HMR,
 *     and in prod with Fluid-style request bursts, this can blow past Redis
 *     `maxclients`. We hold a single shared connection and let BullMQ multiplex.
 *
 * Why lazy:
 *   - We want the entire queue subsystem to be opt-in via REDIS_URL. If
 *     REDIS_URL isn't set, no connection is ever opened — the rest of the app
 *     keeps booting normally.
 *
 * Connect timing:
 *   - `lazyConnect: true` defers the actual TCP/auth handshake until the
 *     first command. Combined with `enableReadyCheck` we get clear errors
 *     on misconfigured URLs.
 */

import IORedis, { type Redis, type RedisOptions } from 'ioredis';
import { env } from '../env';
import { createLogger } from '../log';

const log = createLogger('queue/redis');

let connection: Redis | null = null;

/**
 * Recommended ioredis options for BullMQ. Notably `maxRetriesPerRequest: null`
 * is REQUIRED by BullMQ workers (they handle their own retry semantics).
 *
 * See: https://docs.bullmq.io/guide/connections
 */
const REDIS_OPTIONS: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: true,
  // Reconnect on certain transient errors (e.g. READONLY during failover).
  reconnectOnError: (err) => {
    const message = err.message || '';
    if (message.includes('READONLY') || message.includes('ECONNRESET')) {
      log.warn({ err: message }, 'reconnecting on transient redis error');
      return true;
    }
    return false;
  },
};

/**
 * Returns true if the queue subsystem is configured (REDIS_URL is set).
 * Callers should check this before enqueuing jobs to allow graceful
 * degradation when Redis is unavailable.
 */
export function isQueueEnabled(): boolean {
  return Boolean(env.REDIS_URL);
}

/**
 * Get (or create) the shared Redis connection. Throws if REDIS_URL is missing
 * — callers must check `isQueueEnabled()` first.
 *
 * In dev with Next.js HMR we cache on `globalThis` to survive module reloads.
 */
declare global {
  // eslint-disable-next-line no-var
  var __powerwrite_redis: Redis | undefined;
}

export function getRedis(): Redis {
  if (connection) return connection;
  if (globalThis.__powerwrite_redis) {
    connection = globalThis.__powerwrite_redis;
    return connection;
  }

  if (!env.REDIS_URL) {
    throw new Error(
      '[queue] REDIS_URL is not set — call isQueueEnabled() before getRedis().',
    );
  }

  const r = new IORedis(env.REDIS_URL, REDIS_OPTIONS);

  r.on('connect', () => log.info('redis connect'));
  r.on('ready', () => log.info('redis ready'));
  r.on('error', (err) => log.error({ err }, 'redis error'));
  r.on('close', () => log.warn('redis connection closed'));
  r.on('reconnecting', () => log.warn('redis reconnecting'));
  r.on('end', () => log.warn('redis connection ended'));

  connection = r;
  if (process.env.NODE_ENV !== 'production') {
    globalThis.__powerwrite_redis = r;
  }
  return r;
}

/**
 * Close the shared connection. Idempotent.
 *
 * Used by the worker process and graceful-shutdown handlers in the web
 * server. The web process generally only enqueues, so it's OK to leave the
 * connection open until SIGTERM.
 */
export async function closeRedis(): Promise<void> {
  const r = connection ?? globalThis.__powerwrite_redis;
  if (!r) return;
  connection = null;
  globalThis.__powerwrite_redis = undefined;
  try {
    await r.quit();
    log.info('redis connection closed cleanly');
  } catch (err) {
    log.warn({ err }, 'redis quit failed; forcing disconnect');
    r.disconnect();
  }
}
