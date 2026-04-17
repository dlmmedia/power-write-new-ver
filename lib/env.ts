import { z } from 'zod';
import { log } from './log';

/**
 * Centralized, validated environment configuration.
 *
 * Import `env` instead of reading `process.env.*` directly so the app fails
 * fast on misconfiguration at boot rather than mid-request. Optional vars are
 * marked accordingly; required vars throw a descriptive error if missing.
 */

const schema = z.object({
  // Database
  DATABASE_URL: z
    .string()
    .url('DATABASE_URL must be a valid postgres connection string'),

  // LLM (required for any chat/completion functionality)
  OPENROUTER_API_KEY: z.string().min(1, 'OPENROUTER_API_KEY is required for LLM features'),

  // OpenAI (required for TTS, Whisper transcription, DALL-E image fallback —
  // NOT used for LLMs). Marked optional so a fresh install can boot, but most
  // audio paths will fail at runtime if missing.
  OPENAI_API_KEY: z.string().optional(),

  // Optional providers
  GEMINI_API_KEY: z.string().optional(),
  GOOGLE_BOOKS_API_KEY: z.string().optional(),

  // Storage
  BLOB_READ_WRITE_TOKEN: z.string().min(1, 'BLOB_READ_WRITE_TOKEN is required'),

  // Auth (Clerk)
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Phase 2 — Redis-backed queue + rate limiter
  REDIS_URL: z.string().url().optional(),

  // Operational
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof schema>;

function loadEnv(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    // Don't throw at module-load time during build (Next.js scans these files
    // before secrets are available in some CI environments). We log loudly and
    // fall back to a permissive shape so build succeeds; runtime callers will
    // still error when they touch a missing key.
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      log.warn({ issues }, '[env] validation skipped during build');
      return process.env as unknown as Env;
    }
    log.error({ issues }, '[env] invalid configuration');
    throw new Error('Environment validation failed');
  }
  return parsed.data;
}

export const env: Env = loadEnv();
