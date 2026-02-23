import { NextResponse } from 'next/server';
import { resetStuckBooks } from '@/lib/db/operations';

export const dynamic = 'force-dynamic';

/**
 * Resets books stuck in 'generating' status for more than 30 minutes.
 * Can be called by an Inngest cron, external health-check, or manual trigger.
 */
export async function POST() {
  try {
    const resetCount = await resetStuckBooks(30);
    return NextResponse.json({
      success: true,
      resetCount,
      message: resetCount > 0
        ? `Reset ${resetCount} stuck book(s) to failed`
        : 'No stuck books found',
    });
  } catch (error) {
    console.error('[Cleanup] Error resetting stuck books:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset stuck books' },
      { status: 500 }
    );
  }
}
