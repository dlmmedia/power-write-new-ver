import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { log } from '@/lib/log';

/**
 * Application-defined error with an HTTP status. Throw from anywhere inside an
 * API route and let `apiError()` translate it to a JSON response.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const ApiErrors = {
  unauthorized: (msg = 'Unauthorized') => new ApiError(401, msg, 'unauthorized'),
  forbidden: (msg = 'Forbidden') => new ApiError(403, msg, 'forbidden'),
  notFound: (msg = 'Not found') => new ApiError(404, msg, 'not_found'),
  badRequest: (msg = 'Bad request', details?: unknown) =>
    new ApiError(400, msg, 'bad_request', details),
  conflict: (msg = 'Conflict') => new ApiError(409, msg, 'conflict'),
  rateLimited: (msg = 'Rate limit exceeded') =>
    new ApiError(429, msg, 'rate_limited'),
  serverError: (msg = 'Internal server error', details?: unknown) =>
    new ApiError(500, msg, 'server_error', details),
};

/**
 * Convert any thrown value into a JSON `Response`. Use as:
 *
 *   try { ... } catch (e) { return apiError(e); }
 */
export function apiError(e: unknown): Response {
  if (e instanceof ApiError) {
    return NextResponse.json(
      { error: e.message, code: e.code, details: e.details },
      { status: e.status },
    );
  }
  if (e instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'validation_error',
        details: e.issues,
      },
      { status: 400 },
    );
  }
  log.error({ err: e }, '[api] unhandled error');
  const message = e instanceof Error ? e.message : 'Internal server error';
  return NextResponse.json(
    { error: message, code: 'internal_error' },
    { status: 500 },
  );
}
