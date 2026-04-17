import pino, { type Logger, type LoggerOptions } from 'pino';

/**
 * Server-side structured logger.
 *
 * USAGE — preferred over `console.*` in server code (routes, services, db,
 * instrumentation):
 *
 *   import { log } from '@/lib/log';
 *   log.info({ bookId }, 'Fetched book');
 *   log.warn({ err }, 'Audio stats failed');
 *   log.error({ err, route: 'POST /api/books' }, 'Create book failed');
 *
 * Levels: trace, debug, info, warn, error, fatal. Default level: 'info'
 * (override with LOG_LEVEL env var).
 *
 * IMPORTANT — DO NOT USE IN CLIENT COMPONENTS. Pino is a Node-only library;
 * importing it from a 'use client' file will break the build. Browser code
 * should keep using `console.*` so React's error overlay can capture it.
 *
 * Secret redaction: keys matching common API key / token names will appear as
 * "[Redacted]" in log output. Add new patterns to `redactPaths` below if you
 * introduce new secret-bearing fields.
 */

const redactPaths = [
  'password',
  '*.password',
  'token',
  '*.token',
  'apiKey',
  '*.apiKey',
  'api_key',
  '*.api_key',
  'authorization',
  'headers.authorization',
  'headers["x-api-key"]',
  'headers.cookie',
  'cookie',
  '*.OPENROUTER_API_KEY',
  '*.OPENAI_API_KEY',
  '*.GEMINI_API_KEY',
  '*.CLERK_SECRET_KEY',
  '*.BLOB_READ_WRITE_TOKEN',
  '*.DATABASE_URL',
  '*.DATABASE_URL_UNPOOLED',
];

const isDev = process.env.NODE_ENV !== 'production';

const baseOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
  redact: { paths: redactPaths, censor: '[Redacted]' },
  base: undefined, // omit pid/hostname noise
  timestamp: pino.stdTimeFunctions.isoTime,
};

const transport = isDev
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname',
        singleLine: false,
      },
    }
  : undefined;

export const log: Logger = pino({
  ...baseOptions,
  ...(transport ? { transport } : {}),
});

/**
 * Returns a child logger with a stable namespace, e.g. `log.child({ scope: 'db' })`.
 * Use for sub-systems so log lines are easy to grep:
 *
 *   const dbLog = createLogger('db');
 *   dbLog.error({ err, query }, 'Query failed');
 */
export function createLogger(scope: string, extra?: Record<string, unknown>): Logger {
  return log.child({ scope, ...(extra ?? {}) });
}
