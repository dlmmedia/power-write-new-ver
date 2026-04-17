import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getDbUserIdFromClerk } from '@/lib/services/user-service';
import {
  getSeriesWithBooks,
  updateSeries,
  deleteSeries,
} from '@/lib/db/operations';
import {
  LOCKABLE_SERIES_FIELDS,
  type LockableSeriesField,
} from '@/lib/types/series';
import { ApiErrors, apiError } from '@/lib/api/error';

export const runtime = 'nodejs';

async function requireEffectiveUserId(): Promise<string> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw ApiErrors.unauthorized();
  let email: string | undefined;
  try {
    const user = await currentUser();
    email = user?.emailAddresses?.[0]?.emailAddress;
  } catch {
    /* email is best-effort */
  }
  const dbUserId = await getDbUserIdFromClerk(clerkUserId, email);
  return dbUserId || clerkUserId;
}

function parseSeriesId(id: string): number {
  const n = parseInt(id, 10);
  if (!Number.isFinite(n) || n <= 0) {
    throw ApiErrors.badRequest('Invalid series id');
  }
  return n;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireEffectiveUserId();
    const { id } = await params;
    const seriesId = parseSeriesId(id);

    const result = await getSeriesWithBooks(seriesId);
    if (!result) throw ApiErrors.notFound('Series not found');

    if (result.series.userId !== userId && !result.series.isPublic) {
      throw ApiErrors.forbidden();
    }

    return NextResponse.json({
      success: true,
      series: {
        ...result.series,
        books: result.books.map((b) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          summary: b.summary,
          coverUrl: b.coverUrl,
          status: b.status,
          productionStatus: b.productionStatus,
          seriesNumber: b.seriesNumber,
          createdAt: b.createdAt,
        })),
      },
    });
  } catch (err) {
    return apiError(err);
  }
}

const UpdateSeriesSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().max(10_000).nullable().optional(),
    coverUrl: z.string().url().nullable().optional(),
    sharedConfig: z.record(z.string(), z.unknown()).nullable().optional(),
    lockedFields: z
      .array(z.enum(LOCKABLE_SERIES_FIELDS as readonly [string, ...string[]]))
      .optional(),
    status: z.enum(['ongoing', 'completed', 'hiatus']).optional(),
    isPublic: z.boolean().optional(),
  })
  .strict();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireEffectiveUserId();
    const { id } = await params;
    const seriesId = parseSeriesId(id);

    const existing = await getSeriesWithBooks(seriesId);
    if (!existing) throw ApiErrors.notFound('Series not found');
    if (existing.series.userId !== userId) throw ApiErrors.forbidden();

    const body = UpdateSeriesSchema.parse(await request.json());

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.coverUrl !== undefined) updates.coverUrl = body.coverUrl;
    if (body.sharedConfig !== undefined) updates.sharedConfig = body.sharedConfig;
    if (body.status !== undefined) updates.status = body.status;
    if (body.isPublic !== undefined) updates.isPublic = body.isPublic;
    if (body.lockedFields !== undefined) {
      updates.lockedFields = body.lockedFields as LockableSeriesField[];
    }

    const updated = await updateSeries(seriesId, updates as Parameters<typeof updateSeries>[1]);
    return NextResponse.json({ success: true, series: updated });
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireEffectiveUserId();
    const { id } = await params;
    const seriesId = parseSeriesId(id);

    const existing = await getSeriesWithBooks(seriesId);
    if (!existing) throw ApiErrors.notFound('Series not found');
    if (existing.series.userId !== userId) throw ApiErrors.forbidden();

    await deleteSeries(seriesId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return apiError(err);
  }
}
