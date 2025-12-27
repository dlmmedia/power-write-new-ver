import { NextResponse } from 'next/server';
import { db, checkDatabaseHealth, withRetry, DEFAULT_RETRY_CONFIG } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { isTransientError } from '@/lib/db/connection';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const forceCheck = url.searchParams.get('force') === 'true';
  const detailed = url.searchParams.get('detailed') === 'true';
  
  try {
    // Use the robust health check with caching
    const healthResult = await checkDatabaseHealth(db, forceCheck);
    
    if (detailed) {
      // If detailed info requested, also run a retry test
      let retryTestResult: { success: boolean; attempts: number; error?: string } = {
        success: false,
        attempts: 0,
      };
      
      try {
        let attempts = 0;
        await withRetry(async () => {
          attempts++;
          const result = await db.execute(sql`SELECT NOW() as server_time, version() as version`);
          retryTestResult = { success: true, attempts };
          return result;
        }, { ...DEFAULT_RETRY_CONFIG, maxRetries: 1 }, 'health-check-detailed');
      } catch (retryError) {
        retryTestResult = {
          success: false,
          attempts: retryTestResult.attempts || 1,
          error: retryError instanceof Error ? retryError.message : String(retryError),
        };
      }
      
      return NextResponse.json({
        success: healthResult.healthy,
        health: healthResult,
        retryTest: retryTestResult,
        timestamp: new Date().toISOString(),
      }, { status: healthResult.healthy ? 200 : 503 });
    }
    
    return NextResponse.json({
      success: healthResult.healthy,
      latencyMs: healthResult.latencyMs,
      timestamp: healthResult.timestamp.toISOString(),
      ...(healthResult.error && { error: healthResult.error }),
    }, { status: healthResult.healthy ? 200 : 503 });
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isTransient = isTransientError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
      isTransient,
      suggestion: isTransient 
        ? 'This appears to be a temporary network issue. Please retry in a few seconds.'
        : 'This may be a configuration or connection issue. Please check your database settings.',
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
