import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import ws from 'ws';

// Configure WebSocket for local development (not required for HTTP client but safe)
if (process.env.NODE_ENV !== 'production') {
  // no-op for neon-http
}

const connectionString = process.env.DATABASE_URL_UNPOOLED 
  || process.env.POSTGRES_URL_NON_POOLING 
  || process.env.DATABASE_URL;

console.log('=== DB INIT DEBUG ===');
console.log('__dirname:', __dirname);
console.log('process.cwd():', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL source:', process.env.DATABASE_URL_UNPOOLED ? 'DATABASE_URL_UNPOOLED' : (process.env.POSTGRES_URL_NON_POOLING ? 'POSTGRES_URL_NON_POOLING' : 'DATABASE_URL'));
console.log('DATABASE_URL (first 50 chars):', connectionString?.substring(0, 50));
console.log('DATABASE_URL (full length):', connectionString?.length);
console.log('===================');

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

if (connectionString.includes('your_neon_database_url_here') || connectionString.includes('your-actual') || connectionString.length < 50) {
  throw new Error(`DATABASE_URL is invalid: "${connectionString}". Check your .env.local file at ${process.cwd()}/.env.local`);
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
