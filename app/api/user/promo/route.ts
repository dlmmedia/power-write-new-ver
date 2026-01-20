import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { upgradeToProWithCode, getUserInfo, getDbUserIdFromClerk } from '@/lib/services/user-service';

export const runtime = 'nodejs';

/**
 * POST /api/user/promo
 * Apply a promo code to upgrade user's tier
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's email from Clerk to handle email-based user matching
    const clerkUser = await currentUser();
    const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;

    // Get the actual database user ID (may differ from Clerk ID if user was synced by email)
    const dbUserId = await getDbUserIdFromClerk(clerkUserId, userEmail);
    
    if (!dbUserId) {
      return NextResponse.json(
        { error: 'User not found. Please try logging out and back in.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Promo code is required' },
        { status: 400 }
      );
    }

    // Attempt to upgrade using the correct database user ID
    const result = await upgradeToProWithCode(dbUserId, code);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Get updated user info using the database user ID
    const userInfo = await getUserInfo(dbUserId);

    return NextResponse.json({
      success: true,
      message: 'Successfully upgraded to Pro tier!',
      user: userInfo,
    });
  } catch (error) {
    console.error('Error applying promo code:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to apply promo code', details: message },
      { status: 500 }
    );
  }
}










