import { db, withRetry, DEFAULT_RETRY_CONFIG, EXTENDED_RETRY_CONFIG } from '@/lib/db';
import { users, generatedBooks } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// Tier types
export type UserTier = 'free' | 'pro';

// Valid promo codes
const PROMO_CODES: Record<string, UserTier> = {
  'powerwrite100': 'pro',
};

// Tier limits
const TIER_LIMITS = {
  free: {
    maxBooks: 1,
  },
  pro: {
    maxBooks: Infinity,
  },
};

/**
 * Get user's tier from the database
 */
export async function getUserTier(userId: string): Promise<UserTier> {
  return withRetry(async () => {
    const [user] = await db
      .select({ plan: users.plan })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return 'free'; // Default to free for unknown users
    }

    // Map database plan values to tier
    if (user.plan === 'pro' || user.plan === 'professional' || user.plan === 'enterprise') {
      return 'pro';
    }

    return 'free';
  }, DEFAULT_RETRY_CONFIG, 'getUserTier');
}

/**
 * Get the count of books a user has generated
 */
export async function getBookCount(userId: string): Promise<number> {
  return withRetry(async () => {
    const books = await db
      .select({ id: generatedBooks.id })
      .from(generatedBooks)
      .where(eq(generatedBooks.userId, userId));

    return books.length;
  }, DEFAULT_RETRY_CONFIG, 'getBookCount');
}

/**
 * Check if user can generate a new book based on their tier
 */
export async function canGenerateBook(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  tier: UserTier;
  booksGenerated: number;
  maxBooks: number;
}> {
  const tier = await getUserTier(userId);
  const booksGenerated = await getBookCount(userId);
  const maxBooks = TIER_LIMITS[tier].maxBooks;

  if (tier === 'pro') {
    return {
      allowed: true,
      tier,
      booksGenerated,
      maxBooks,
    };
  }

  if (booksGenerated >= maxBooks) {
    return {
      allowed: false,
      reason: `You've reached the free tier limit of ${maxBooks} book. Upgrade to Pro for unlimited book generation.`,
      tier,
      booksGenerated,
      maxBooks,
    };
  }

  return {
    allowed: true,
    tier,
    booksGenerated,
    maxBooks,
  };
}

/**
 * Validate a promo code
 */
export function validatePromoCode(code: string): {
  valid: boolean;
  tier?: UserTier;
  error?: string;
} {
  const normalizedCode = code.toLowerCase().trim();
  
  if (PROMO_CODES[normalizedCode]) {
    return {
      valid: true,
      tier: PROMO_CODES[normalizedCode],
    };
  }

  return {
    valid: false,
    error: 'Invalid promo code',
  };
}

/**
 * Upgrade user to pro tier using a promo code
 */
export async function upgradeToProWithCode(
  userId: string,
  code: string
): Promise<{
  success: boolean;
  tier?: UserTier;
  error?: string;
}> {
  const validation = validatePromoCode(code);

  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  try {
    await withRetry(async () => {
      await db
        .update(users)
        .set({
          plan: 'pro',
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }, EXTENDED_RETRY_CONFIG, 'upgradeToProWithCode');

    return {
      success: true,
      tier: 'pro',
    };
  } catch (error) {
    console.error('Error upgrading user:', error);
    return {
      success: false,
      error: 'Failed to upgrade account. Please try again.',
    };
  }
}

/**
 * Get user info including tier
 */
export async function getUserInfo(userId: string): Promise<{
  id: string;
  email: string | null;
  tier: UserTier;
  booksGenerated: number;
  maxBooks: number;
} | null> {
  return withRetry(async () => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return null;
    }

    const tier = user.plan === 'pro' || user.plan === 'professional' || user.plan === 'enterprise' 
      ? 'pro' 
      : 'free';
    
    const booksGenerated = await getBookCount(userId);

    return {
      id: user.id,
      email: user.email,
      tier,
      booksGenerated,
      maxBooks: TIER_LIMITS[tier].maxBooks,
    };
  }, DEFAULT_RETRY_CONFIG, 'getUserInfo');
}

/**
 * Sync a Clerk user to the database
 * Creates user if they don't exist, updates if they do
 */
export async function syncUserToDatabase(clerkUser: {
  id: string;
  emailAddresses: { emailAddress: string }[];
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
}): Promise<{
  id: string;
  tier: UserTier;
  isNew: boolean;
}> {
  return withRetry(async () => {
    const email = clerkUser.emailAddresses[0]?.emailAddress || `${clerkUser.id}@clerk.user`;

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, clerkUser.id))
      .limit(1);

    if (existingUser) {
      // Update existing user (but preserve plan - don't overwrite it)
      await db
        .update(users)
        .set({
          email,
          firstName: clerkUser.firstName || existingUser.firstName,
          lastName: clerkUser.lastName || existingUser.lastName,
          profileImageUrl: clerkUser.imageUrl || existingUser.profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, clerkUser.id));

      // Re-fetch user to get the CURRENT plan value (in case it was just updated by promo API)
      const [freshUser] = await db
        .select({ plan: users.plan })
        .from(users)
        .where(eq(users.id, clerkUser.id))
        .limit(1);

      const currentPlan = freshUser?.plan || existingUser.plan;
      const tier = currentPlan === 'pro' || currentPlan === 'professional' || currentPlan === 'enterprise'
        ? 'pro'
        : 'free';

      return {
        id: clerkUser.id,
        tier,
        isNew: false,
      };
    }

    // Create new user with free tier
    await db.insert(users).values({
      id: clerkUser.id,
      email,
      firstName: clerkUser.firstName || null,
      lastName: clerkUser.lastName || null,
      profileImageUrl: clerkUser.imageUrl || null,
      plan: 'free',
      creditsUsed: 0,
      creditsLimit: 1, // Free tier limit
    });

    return {
      id: clerkUser.id,
      tier: 'free',
      isNew: true,
    };
  }, EXTENDED_RETRY_CONFIG, 'syncUserToDatabase');
}

/**
 * Get all books (for pro tier users)
 */
export async function getAllBooks() {
  return withRetry(async () => {
    return await db
      .select()
      .from(generatedBooks)
      .orderBy(desc(generatedBooks.createdAt));
  }, DEFAULT_RETRY_CONFIG, 'getAllBooks');
}










