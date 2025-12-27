/**
 * Robust Database Connection Utility
 * 
 * Provides retry logic, exponential backoff, and health monitoring
 * for Neon PostgreSQL connections, especially useful for Railway deployments
 * where transient network issues are common.
 */

// Error types that are considered transient and worth retrying
const TRANSIENT_ERROR_CODES = [
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EPIPE',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ECONNABORTED',
];

const TRANSIENT_ERROR_MESSAGES = [
  'fetch failed',
  'network error',
  'socket hang up',
  'connection reset',
  'connection refused',
  'timeout',
  'ECONNRESET',
  'unable to connect',
  'connection terminated',
  'connection closed',
  'too many connections',
  'server closed the connection',
  'unexpected end of data',
  'SSL connection',
  'connection timed out',
];

// PostgreSQL error codes that are transient
const TRANSIENT_PG_CODES = [
  '08000', // connection_exception
  '08003', // connection_does_not_exist
  '08006', // connection_failure
  '08001', // sqlclient_unable_to_establish_sqlconnection
  '08004', // sqlserver_rejected_establishment_of_sqlconnection
  '57P01', // admin_shutdown
  '57P02', // crash_shutdown
  '57P03', // cannot_connect_now
  '40001', // serialization_failure (can be retried)
  '40P01', // deadlock_detected (can be retried)
];

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
};

// Quick retry config for simple queries
export const QUICK_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  baseDelayMs: 50,
  maxDelayMs: 1000,
  backoffMultiplier: 2,
};

// Extended retry config for critical operations
export const EXTENDED_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  baseDelayMs: 200,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Determines if an error is transient and worth retrying
 */
export function isTransientError(error: unknown): boolean {
  if (!error) return false;

  const err = error as any;
  
  // Check error code
  if (err.code) {
    if (TRANSIENT_ERROR_CODES.includes(err.code)) return true;
    if (TRANSIENT_PG_CODES.includes(err.code)) return true;
  }

  // Check cause code (nested errors)
  if (err.cause?.code) {
    if (TRANSIENT_ERROR_CODES.includes(err.cause.code)) return true;
    if (TRANSIENT_PG_CODES.includes(err.cause.code)) return true;
  }

  // Check error message
  const message = (err.message || err.toString() || '').toLowerCase();
  for (const pattern of TRANSIENT_ERROR_MESSAGES) {
    if (message.includes(pattern.toLowerCase())) return true;
  }

  // Check cause message
  if (err.cause?.message) {
    const causeMessage = err.cause.message.toLowerCase();
    for (const pattern of TRANSIENT_ERROR_MESSAGES) {
      if (causeMessage.includes(pattern.toLowerCase())) return true;
    }
  }

  // HTTP status codes that indicate transient issues
  if (err.status === 502 || err.status === 503 || err.status === 504) {
    return true;
  }

  return false;
}

/**
 * Calculates delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
  // Add jitter (±25%) to prevent thundering herd
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
  return Math.max(0, cappedDelay + jitter);
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wraps a database operation with retry logic
 * 
 * @param operation - The async database operation to execute
 * @param config - Retry configuration
 * @param operationName - Name for logging purposes
 * @returns The result of the operation
 * @throws The last error if all retries are exhausted
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  operationName = 'database operation'
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      const isLastAttempt = attempt === config.maxRetries;
      const isRetryable = isTransientError(error);
      
      if (isLastAttempt || !isRetryable) {
        // Log the final error
        console.error(`[DB] ${operationName} failed after ${attempt + 1} attempt(s):`, {
          error: error instanceof Error ? error.message : String(error),
          isTransient: isRetryable,
          attempts: attempt + 1,
        });
        throw error;
      }
      
      // Calculate delay and retry
      const delay = calculateDelay(attempt, config);
      console.warn(`[DB] ${operationName} failed (attempt ${attempt + 1}/${config.maxRetries + 1}), retrying in ${Math.round(delay)}ms:`, {
        error: error instanceof Error ? error.message : String(error),
      });
      
      await sleep(delay);
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Health check status
 */
export interface HealthCheckResult {
  healthy: boolean;
  latencyMs: number;
  error?: string;
  timestamp: Date;
}

// Cache for health check results
let lastHealthCheck: HealthCheckResult | null = null;
let healthCheckPromise: Promise<HealthCheckResult> | null = null;
const HEALTH_CHECK_CACHE_MS = 5000; // Cache health check for 5 seconds

/**
 * Performs a health check on the database connection
 * Results are cached for 5 seconds to prevent excessive checks
 */
export async function checkDatabaseHealth(
  db: any,
  forceCheck = false
): Promise<HealthCheckResult> {
  // Return cached result if recent enough
  if (!forceCheck && lastHealthCheck) {
    const age = Date.now() - lastHealthCheck.timestamp.getTime();
    if (age < HEALTH_CHECK_CACHE_MS) {
      return lastHealthCheck;
    }
  }

  // Prevent concurrent health checks
  if (healthCheckPromise) {
    return healthCheckPromise;
  }

  healthCheckPromise = (async (): Promise<HealthCheckResult> => {
    const startTime = performance.now();
    try {
      // Dynamic import to avoid circular dependencies
      const { sql } = await import('drizzle-orm');
      await db.execute(sql`SELECT 1 as health_check`);
      const latencyMs = performance.now() - startTime;
      
      const result: HealthCheckResult = {
        healthy: true,
        latencyMs: Math.round(latencyMs * 100) / 100,
        timestamp: new Date(),
      };
      lastHealthCheck = result;
      return result;
    } catch (error) {
      const latencyMs = performance.now() - startTime;
      const result: HealthCheckResult = {
        healthy: false,
        latencyMs: Math.round(latencyMs * 100) / 100,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      };
      lastHealthCheck = result;
      return result;
    } finally {
      healthCheckPromise = null;
    }
  })();

  return healthCheckPromise;
}

/**
 * Wraps a database operation with automatic retry and optional pre-flight health check
 * 
 * Use this for critical operations that should be as robust as possible
 */
export async function withRobustConnection<T>(
  db: any,
  operation: () => Promise<T>,
  options: {
    config?: RetryConfig;
    operationName?: string;
    checkHealthFirst?: boolean;
  } = {}
): Promise<T> {
  const {
    config = DEFAULT_RETRY_CONFIG,
    operationName = 'database operation',
    checkHealthFirst = false,
  } = options;

  // Optional pre-flight health check
  if (checkHealthFirst) {
    const health = await checkDatabaseHealth(db);
    if (!health.healthy) {
      console.warn(`[DB] Database unhealthy before ${operationName}, but proceeding anyway:`, health.error);
    }
  }

  return withRetry(operation, config, operationName);
}

/**
 * Creates a database operation wrapper that automatically retries
 * 
 * Usage:
 * const robustOp = createRobustOperation(async () => {
 *   return await db.select().from(users);
 * }, 'fetchUsers');
 * 
 * const result = await robustOp();
 */
export function createRobustOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): () => Promise<T> {
  return () => withRetry(operation, config, operationName);
}

/**
 * Batch multiple operations with shared retry logic
 * All operations are attempted, failures are collected and retried together
 */
export async function withBatchRetry<T>(
  operations: Array<{ name: string; fn: () => Promise<T> }>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<{ results: T[]; errors: Array<{ name: string; error: unknown }> }> {
  const results: T[] = [];
  const errors: Array<{ name: string; error: unknown }> = [];

  await Promise.all(
    operations.map(async (op, index) => {
      try {
        results[index] = await withRetry(op.fn, config, op.name);
      } catch (error) {
        errors.push({ name: op.name, error });
      }
    })
  );

  return { results, errors };
}
