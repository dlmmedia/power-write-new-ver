import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getDbUserIdFromClerk } from '@/lib/services/user-service';
import { createSeries, getUserSeries } from '@/lib/db/operations';
import { LOCKABLE_SERIES_FIELDS, type LockableSeriesField } from '@/lib/types/series';
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

export async function GET() {
  try {
    const userId = await requireEffectiveUserId();
    const series = await getUserSeries(userId);
    return NextResponse.json({ success: true, series });
  } catch (err) {
    return apiError(err);
  }
}

const CreateSeriesSchema = z.object({
  name: z.string().trim().min(1, 'Series name is required').max(200),
  description: z.string().max(10_000).nullable().optional(),
  coverUrl: z.string().url().nullable().optional(),
  sharedConfig: z.record(z.string(), z.unknown()).nullable().optional(),
  lockedFields: z
    .array(z.enum(LOCKABLE_SERIES_FIELDS as readonly [string, ...string[]]))
    .optional(),
  status: z.enum(['ongoing', 'completed', 'hiatus']).optional(),
  isPublic: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await requireEffectiveUserId();
    const body = CreateSeriesSchema.parse(await request.json());

    const series = await createSeries({
      userId,
      name: body.name,
      description: body.description ?? null,
      coverUrl: body.coverUrl ?? null,
      sharedConfig: body.sharedConfig ?? null,
      lockedFields: (body.lockedFields ?? []) as LockableSeriesField[],
      status: body.status ?? 'ongoing',
      isPublic: body.isPublic ?? false,
    });

    return NextResponse.json({ success: true, series }, { status: 201 });
  } catch (err) {
    return apiError(err);
  }
}
