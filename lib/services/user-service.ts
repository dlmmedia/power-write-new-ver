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
 * Get the database user ID from Clerk user ID
 * Handles case where Clerk ID doesn't match but email does
 */
export async function getDbUserIdFromClerk(clerkUserId: string, email?: string): Promise<string | null> {
  return withRetry(async () => {
    // First try by Clerk ID
    const [userById] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, clerkUserId))
      .limit(1);

    if (userById) {
      return userById.id;
    }

    // If email provided, try by email
    if (email) {
      const [userByEmail] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (userByEmail) {
        return userByEmail.id;
      }
    }

    return null;
  }, DEFAULT_RETRY_CONFIG, 'getDbUserIdFromClerk');
}

/**
 * Get user's tier from the database
 * Accepts optional email to handle case where Clerk ID doesn't match but email does
 */
export async function getUserTier(userId: string, email?: string): Promise<UserTier> {
  return withRetry(async () => {
    // First try by user ID
    const [user] = await db
      .select({ plan: users.plan })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user) {
      // Map database plan values to tier
      if (user.plan === 'pro' || user.plan === 'professional' || user.plan === 'enterprise') {
        return 'pro';
      }
      return 'free';
    }

    // If not found by ID and email provided, try by email
    if (email) {
      const [userByEmail] = await db
        .select({ plan: users.plan })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (userByEmail) {
        if (userByEmail.plan === 'pro' || userByEmail.plan === 'professional' || userByEmail.plan === 'enterprise') {
          return 'pro';
        }
        return 'free';
      }
    }

    return 'free'; // Default to free for unknown users
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
 * Handles the case where the same email exists with a different Clerk ID
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
  dbUserId?: string; // The actual user ID in database (may differ from Clerk ID)
}> {
  return withRetry(async () => {
    const email = clerkUser.emailAddresses[0]?.emailAddress || `${clerkUser.id}@clerk.user`;

    // Check if user exists by Clerk ID
    const [existingUserById] = await db
      .select()
      .from(users)
      .where(eq(users.id, clerkUser.id))
      .limit(1);

    if (existingUserById) {
      // Update existing user (but preserve plan - don't overwrite it)
      await db
        .update(users)
        .set({
          email,
          firstName: clerkUser.firstName || existingUserById.firstName,
          lastName: clerkUser.lastName || existingUserById.lastName,
          profileImageUrl: clerkUser.imageUrl || existingUserById.profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, clerkUser.id));

      // Re-fetch user to get the CURRENT plan value (in case it was just updated by promo API)
      const [freshUser] = await db
        .select({ plan: users.plan })
        .from(users)
        .where(eq(users.id, clerkUser.id))
        .limit(1);

      const currentPlan = freshUser?.plan || existingUserById.plan;
      const tier = currentPlan === 'pro' || currentPlan === 'professional' || currentPlan === 'enterprise'
        ? 'pro'
        : 'free';

      return {
        id: clerkUser.id,
        tier,
        isNew: false,
      };
    }

    // Check if a user with the same email already exists (different Clerk ID)
    const [existingUserByEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUserByEmail) {
      // User exists with this email but different Clerk ID
      // Don't try to change the user ID (causes FK constraint issues)
      // Just update the user's profile and return their existing tier
      console.log(`[User Sync] Found existing user by email ${email} with ID ${existingUserByEmail.id}, Clerk ID is ${clerkUser.id}`);
      
      // Update profile info only (not the ID)
      await db
        .update(users)
        .set({
          firstName: clerkUser.firstName || existingUserByEmail.firstName,
          lastName: clerkUser.lastName || existingUserByEmail.lastName,
          profileImageUrl: clerkUser.imageUrl || existingUserByEmail.profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.email, email));

      const tier = existingUserByEmail.plan === 'pro' || existingUserByEmail.plan === 'professional' || existingUserByEmail.plan === 'enterprise'
        ? 'pro'
        : 'free';

      // Return the existing user's DB ID so other functions can use it
      return {
        id: clerkUser.id, // Clerk ID for auth purposes
        dbUserId: existingUserByEmail.id, // Actual DB user ID for queries
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










