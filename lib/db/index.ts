import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as schema from './schema';
import ws from 'ws';

// Configure WebSocket for local development
if (process.env.NODE_ENV !== 'production') {
  neonConfig.webSocketConstructor = ws as any;
  // Disable pipelining for development to avoid WebSocket issues
  neonConfig.pipelineConnect = false;
}

const connectionString = process.env.DATABASE_URL;

console.log('=== DB INIT DEBUG ===');
console.log('__dirname:', __dirname);
console.log('process.cwd():', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL (first 50 chars):', connectionString?.substring(0, 50));
console.log('DATABASE_URL (full length):', connectionString?.length);
console.log('===================');

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

if (connectionString.includes('your_neon_database_url_here') || connectionString.includes('your-actual') || connectionString.length < 50) {
  throw new Error(`DATABASE_URL is invalid: "${connectionString}". Check your .env.local file at ${process.cwd()}/.env.local`);
}

const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });
