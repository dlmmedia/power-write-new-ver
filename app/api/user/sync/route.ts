import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { syncUserToDatabase, getUserInfo } from '@/lib/services/user-service';

export const runtime = 'nodejs';

/**
 * GET /api/user/sync
 * Syncs the current Clerk user to the database and returns user info with tier
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get Clerk user data
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Sync to database
    const syncResult = await syncUserToDatabase({
      id: clerkUser.id,
      emailAddresses: clerkUser.emailAddresses,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
    });

    // Get full user info
    const userInfo = await getUserInfo(userId);

    return NextResponse.json({
      success: true,
      user: userInfo,
      isNew: syncResult.isNew,
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to sync user', details: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/sync
 * Same as GET but can be used for explicit sync operations
 */
export async function POST() {
  return GET();
}
