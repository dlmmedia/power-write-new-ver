import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { upgradeToProWithCode, getUserInfo } from '@/lib/services/user-service';

export const runtime = 'nodejs';

/**
 * POST /api/user/promo
 * Apply a promo code to upgrade user's tier
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    // Attempt to upgrade
    const result = await upgradeToProWithCode(userId, code);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Get updated user info
    const userInfo = await getUserInfo(userId);

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

