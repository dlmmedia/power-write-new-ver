import dns from 'node:dns';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from './schema';

// macOS dev-only fix: getaddrinfo() can intermittently fail to follow Neon's
// CNAME chain (ep-XXX → c-N.region.aws.neon.tech), throwing ENOTFOUND on the
// WebSocket socket layer even though the host resolves fine via DNS-over-net.
// The neon-http driver dodged this because undici's fetch uses its own DNS
// path; the WebSocket Pool driver does not. ipv4first switches to a more
// reliable resolution path. No-op (and harmless) on Linux/Railway.
dns.setDefaultResultOrder('ipv4first');
import { createLogger } from '@/lib/log';
import {
  withRetry,
  withRobustConnection,
  checkDatabaseHealth,
  DEFAULT_RETRY_CONFIG,
  QUICK_RETRY_CONFIG,
  EXTENDED_RETRY_CONFIG,
  type RetryConfig,
  type HealthCheckResult,
} from './connection';

// Phase 2F: Switched from neon-http (one HTTP per query) to neon-serverless
// Pool over WebSockets. On Railway (long-lived Node process) this gives us:
//   • connection reuse instead of HTTP per statement
//   • real Postgres transactions (db.transaction(...))
//   • prepared statements and session-level features
//
// We deliberately use the UNPOOLED endpoint. Neon's pooled endpoint runs
// PgBouncer in transaction mode, which would conflict with our client-side
// Pool and break prepared statements / advisory locks / some tx semantics.

// Node needs an explicit WebSocket constructor for the Neon driver.
neonConfig.webSocketConstructor = ws;

const dbLog = createLogger('db');

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

if (
  connectionString.includes('your_neon_database_url_here') ||
  connectionString.includes('your-actual') ||
  connectionString.length < 50
) {
  throw new Error(
    `DATABASE_URL is invalid: "${connectionString}". Check your .env.local file at ${process.cwd()}/.env.local`,
  );
}

if (process.env.NODE_ENV === 'development') {
  dbLog.info(
    {
      connectionSource: process.env.DATABASE_URL_UNPOOLED
        ? 'DATABASE_URL_UNPOOLED'
        : process.env.POSTGRES_URL_NON_POOLING
          ? 'POSTGRES_URL_NON_POOLING'
          : 'DATABASE_URL',
      driver: 'neon-serverless (Pool/WebSocket)',
    },
    'Initializing database connection',
  );
}

// Reuse a single Pool across HMR reloads in dev so we don't leak websockets.
type GlobalWithPool = typeof globalThis & { __pwPool?: Pool };
const globalForDb = globalThis as GlobalWithPool;

export const pool: Pool =
  globalForDb.__pwPool ??
  new Pool({
    connectionString,
    // Sizing: Railway runs a single Node process. 10 keeps us well under
    // Neon's compute connection ceiling while leaving headroom for spikes.
    max: Number(process.env.DB_POOL_MAX ?? 10),
    // Recycle conns idle > 30s so we don't hold sockets open during quiet
    // periods and so Neon can scale compute down.
    idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_MS ?? 30_000),
    // Cap how long a single statement can wait for a free connection before
    // failing fast — keeps the request queue from piling up under outage.
    connectionTimeoutMillis: Number(process.env.DB_POOL_CONNECT_MS ?? 10_000),
  });

if (process.env.NODE_ENV === 'development') {
  globalForDb.__pwPool = pool;
}

pool.on('error', (err: Error) => {
  dbLog.error({ err }, 'idle pool client error');
});

export const db = drizzle(pool, { schema });

// Graceful shutdown — Railway sends SIGTERM with ~30s grace before deploy
// kills the container. Drain the pool so in-flight queries can finish and
// the next deploy doesn't inherit half-closed websockets.
type GlobalWithShutdown = typeof globalThis & { __pwShutdownInstalled?: boolean };
const globalForShutdown = globalThis as GlobalWithShutdown;

if (
  process.env.NODE_ENV === 'production' &&
  !globalForShutdown.__pwShutdownInstalled
) {
  globalForShutdown.__pwShutdownInstalled = true;
  const shutdown = (signal: string) => {
    dbLog.info({ signal }, 'received shutdown signal, draining pool');
    pool.end().catch((err: unknown) => {
      dbLog.error({ err }, 'error draining pool during shutdown');
    });
  };
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}

export {
  withRetry,
  withRobustConnection,
  checkDatabaseHealth,
  DEFAULT_RETRY_CONFIG,
  QUICK_RETRY_CONFIG,
  EXTENDED_RETRY_CONFIG,
};
export type { RetryConfig, HealthCheckResult };
