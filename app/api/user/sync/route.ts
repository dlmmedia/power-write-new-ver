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
    let authResult;
    try {
      authResult = await auth();
    } catch (authError) {
      console.error('[User Sync] Auth error:', authError);
      return NextResponse.json(
        { error: 'Authentication failed', details: authError instanceof Error ? authError.message : 'Unknown auth error' },
        { status: 401 }
      );
    }

    const { userId } = authResult;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get Clerk user data
    let clerkUser;
    try {
      clerkUser = await currentUser();
    } catch (clerkError) {
      console.error('[User Sync] Clerk currentUser error:', clerkError);
      return NextResponse.json(
        { error: 'Failed to fetch user data', details: clerkError instanceof Error ? clerkError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    if (!clerkUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Sync to database
    let syncResult;
    try {
      syncResult = await syncUserToDatabase({
        id: clerkUser.id,
        emailAddresses: clerkUser.emailAddresses || [],
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      });
    } catch (dbError) {
      console.error('[User Sync] Database sync error:', dbError);
      // If it's a unique constraint violation, try to get existing user info instead
      if (dbError instanceof Error && dbError.message.includes('unique')) {
        console.log('[User Sync] Attempting to fetch existing user info after unique constraint error');
        const userInfo = await getUserInfo(userId);
        if (userInfo) {
          return NextResponse.json({
            success: true,
            user: userInfo,
            isNew: false,
          });
        }
      }
      return NextResponse.json(
        { error: 'Failed to sync user to database', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Get full user info
    const userInfo = await getUserInfo(userId);

    return NextResponse.json({
      success: true,
      user: userInfo,
      isNew: syncResult.isNew,
    });
  } catch (error) {
    console.error('[User Sync] Unexpected error:', error);
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










