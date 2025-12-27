import { drizzle } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';
import * as schema from './schema';
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

// Configure Neon for better reliability
neonConfig.fetchConnectionCache = true; // Enable connection caching
neonConfig.poolQueryViaFetch = true; // Use fetch for pooled queries (more reliable)

// Increase fetch timeout for Railway deployments
if (typeof globalThis !== 'undefined') {
  // Set a longer timeout for fetch requests (30 seconds)
  neonConfig.fetchEndpoint = (host) => {
    const protocol = host.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${host}/sql`;
  };
}

const connectionString = process.env.DATABASE_URL_UNPOOLED 
  || process.env.POSTGRES_URL_NON_POOLING 
  || process.env.DATABASE_URL;

// Only log in development
if (process.env.NODE_ENV === 'development') {
  console.log('[DB] Initializing database connection...');
  console.log('[DB] Connection source:', process.env.DATABASE_URL_UNPOOLED ? 'DATABASE_URL_UNPOOLED' : (process.env.POSTGRES_URL_NON_POOLING ? 'POSTGRES_URL_NON_POOLING' : 'DATABASE_URL'));
}

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

if (connectionString.includes('your_neon_database_url_here') || connectionString.includes('your-actual') || connectionString.length < 50) {
  throw new Error(`DATABASE_URL is invalid: "${connectionString}". Check your .env.local file at ${process.cwd()}/.env.local`);
}

// Create the Neon SQL function with retry-friendly configuration
const sql = neon(connectionString, {
  fetchOptions: {
    // These options help with Railway's network characteristics
    cache: 'no-store', // Don't cache responses
  },
});

// Create the Drizzle database instance
export const db = drizzle(sql, { schema });

// Re-export connection utilities for use in operations
export {
  withRetry,
  withRobustConnection,
  checkDatabaseHealth,
  DEFAULT_RETRY_CONFIG,
  QUICK_RETRY_CONFIG,
  EXTENDED_RETRY_CONFIG,
};
export type { RetryConfig, HealthCheckResult };
