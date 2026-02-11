'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';

export type UserTier = 'free' | 'pro';

// LocalStorage keys for tier persistence
const TIER_STORAGE_KEY = 'powerwrite_user_tier';
const TIER_USER_ID_KEY = 'powerwrite_tier_user_id';
const TIER_TIMESTAMP_KEY = 'powerwrite_tier_timestamp';
const TIER_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Helper functions for localStorage persistence
function getCachedTier(userId: string): UserTier | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cachedUserId = localStorage.getItem(TIER_USER_ID_KEY);
    const cachedTier = localStorage.getItem(TIER_STORAGE_KEY) as UserTier | null;
    const cachedTimestamp = localStorage.getItem(TIER_TIMESTAMP_KEY);
    
    // Check if cache is valid (same user, not expired)
    if (cachedUserId === userId && cachedTier && cachedTimestamp) {
      const timestamp = parseInt(cachedTimestamp, 10);
      if (Date.now() - timestamp < TIER_CACHE_DURATION) {
        return cachedTier;
      }
    }
  } catch (error) {
    console.error('[UserTier] Error reading cached tier:', error);
  }
  
  return null;
}

function setCachedTier(userId: string, tier: UserTier): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(TIER_USER_ID_KEY, userId);
    localStorage.setItem(TIER_STORAGE_KEY, tier);
    localStorage.setItem(TIER_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('[UserTier] Error caching tier:', error);
  }
}

function clearCachedTier(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(TIER_USER_ID_KEY);
    localStorage.removeItem(TIER_STORAGE_KEY);
    localStorage.removeItem(TIER_TIMESTAMP_KEY);
  } catch (error) {
    console.error('[UserTier] Error clearing cached tier:', error);
  }
}

// Define all pro features that can be gated
export type ProFeature = 
  | 'generate-book'
  | 'generate-outline'
  | 'generate-audio'
  | 'regenerate-audio'
  | 'generate-cover'
  | 'export-book'
  | 'edit-book'
  | 'duplicate-book'
  | 'continue-generation'
  | 'bibliography'
  | 'publishing-settings';

// Feature descriptions for upgrade prompts
export const FEATURE_DESCRIPTIONS: Record<ProFeature, { title: string; description: string; icon: string }> = {
  'generate-book': {
    title: 'Book Generation',
    description: 'Generate complete books with AI. Create unlimited books with professional quality content.',
    icon: 'library',
  },
  'generate-outline': {
    title: 'Outline Generation',
    description: 'Generate detailed book outlines with AI. Structure your book before writing.',
    icon: 'file-text',
  },
  'generate-audio': {
    title: 'Audiobook Generation',
    description: 'Convert your books into professional audiobooks with AI voices.',
    icon: 'headphones',
  },
  'regenerate-audio': {
    title: 'Audio Regeneration',
    description: 'Regenerate audio for chapters with different voices or settings.',
    icon: 'refresh-cw',
  },
  'generate-cover': {
    title: 'Cover Generation',
    description: 'Generate stunning AI-powered book covers with multiple styles and customization options.',
    icon: 'palette',
  },
  'export-book': {
    title: 'Book Export',
    description: 'Export your books to PDF, EPUB, DOCX, and more formats for publishing.',
    icon: 'upload',
  },
  'edit-book': {
    title: 'Book Editing',
    description: 'Edit and refine your book content with AI assistance.',
    icon: 'pencil',
  },
  'duplicate-book': {
    title: 'Book Duplication',
    description: 'Create copies of your books for variations or backups.',
    icon: 'clipboard',
  },
  'continue-generation': {
    title: 'Continue Generation',
    description: 'Resume interrupted book generation from where you left off.',
    icon: 'play',
  },
  'bibliography': {
    title: 'Bibliography Management',
    description: 'Add and manage citations and references for your books.',
    icon: 'layers',
  },
  'publishing-settings': {
    title: 'Publishing Settings',
    description: 'Configure advanced publishing options for your books.',
    icon: 'settings',
  },
};

interface UserTierContextType {
  userTier: UserTier;
  isLoading: boolean;
  isProUser: boolean;
  canAccessFeature: (feature: ProFeature) => boolean;
  showUpgradeModal: (feature?: ProFeature) => void;
  hideUpgradeModal: () => void;
  upgradeModalVisible: boolean;
  upgradeFeature: ProFeature | null;
  syncUser: () => Promise<void>;
  setUserTier: (tier: UserTier) => void;
}

const UserTierContext = createContext<UserTierContextType | undefined>(undefined);

interface UserTierProviderProps {
  children: ReactNode;
}

export function UserTierProvider({ children }: UserTierProviderProps) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [userTier, setUserTierState] = useState<UserTier>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<ProFeature | null>(null);
  const [hasInitializedFromCache, setHasInitializedFromCache] = useState(false);
  
  // Track sync state to prevent re-syncing on navigation
  const hasSyncedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const isSyncingRef = useRef(false);
  const syncPromiseRef = useRef<Promise<void> | null>(null);

  // Wrapper to set tier and cache it
  const setUserTier = useCallback((tier: UserTier) => {
    setUserTierState(tier);
    const userId = lastUserIdRef.current;
    if (userId) {
      setCachedTier(userId, tier);
    }
  }, []);

  // Initialize from cache on mount (only runs once)
  useEffect(() => {
    if (hasInitializedFromCache || !isUserLoaded) return;
    
    const userId = user?.id;
    if (userId) {
      const cachedTier = getCachedTier(userId);
      if (cachedTier) {
        setUserTierState(cachedTier);
        // If we have a cached Pro tier, we can show Pro UI immediately
        // but still sync in the background to verify
        if (cachedTier === 'pro') {
          setIsLoading(false);
        }
      }
    }
    setHasInitializedFromCache(true);
  }, [isUserLoaded, user?.id, hasInitializedFromCache]);

  // Sync user to database and get tier - stable function that doesn't change
  const syncUser = useCallback(async () => {
    // Get current user ID from the ref (updated in effect)
    const currentUserId = lastUserIdRef.current;
    
    if (!currentUserId) {
      setIsLoading(false);
      return;
    }
    
    // Prevent concurrent syncs
    if (isSyncingRef.current && syncPromiseRef.current) {
      return syncPromiseRef.current;
    }
    
    isSyncingRef.current = true;

    const syncPromise = (async () => {
      const maxRetries = 3;
      const baseDelay = 300;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const timestamp = Date.now();
          const response = await fetch(`/api/user/sync?_t=${timestamp}`, {
            credentials: 'include',
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              setUserTier(data.user.tier);
              hasSyncedRef.current = true;
            }
            return;
          } else if (response.status === 401 && attempt < maxRetries - 1) {
            // Auth not ready yet, retry
            await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
            continue;
          }
        } catch (error) {
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
            continue;
          }
          console.error('[UserTier] Error syncing user tier:', error);
        }
      }
    })();
    
    syncPromiseRef.current = syncPromise;
    
    try {
      await syncPromise;
    } finally {
      isSyncingRef.current = false;
      syncPromiseRef.current = null;
      setIsLoading(false);
    }
  }, [setUserTier]);

  // Effect to handle user changes and initial sync
  useEffect(() => {
    if (!isUserLoaded) {
      return;
    }
    
    const currentUserId = user?.id || null;
    const previousUserId = lastUserIdRef.current;
    
    // Update the ref with current user ID
    lastUserIdRef.current = currentUserId;
    
    // Case 1: No user (logged out)
    if (!currentUserId) {
      setUserTierState('free');
      setIsLoading(false);
      hasSyncedRef.current = false;
      clearCachedTier(); // Clear cache on logout
      return;
    }
    
    // Case 2: User changed (different user logged in)
    if (previousUserId !== currentUserId) {
      hasSyncedRef.current = false;
      // Check cache for the new user
      const cachedTier = getCachedTier(currentUserId);
      if (cachedTier) {
        setUserTierState(cachedTier);
        // If cached as Pro, show Pro UI immediately
        if (cachedTier === 'pro') {
          setIsLoading(false);
        }
      }
    }
    
    // Case 3: Already synced for this user - don't sync again (prevents navigation re-sync)
    if (hasSyncedRef.current) {
      setIsLoading(false);
      return;
    }
    
    // Case 4: Need to sync - either first time or user changed
    // Always sync to verify tier, even if we have a cached value
    syncUser();
  }, [isUserLoaded, user?.id, syncUser]);

  const isProUser = userTier === 'pro';

  // Free tier users can only read and listen - all other features are pro
  const canAccessFeature = useCallback((feature: ProFeature): boolean => {
    return isProUser;
  }, [isProUser]);

  const showUpgradeModal = useCallback((feature?: ProFeature) => {
    setUpgradeFeature(feature || null);
    setUpgradeModalVisible(true);
  }, []);

  const hideUpgradeModal = useCallback(() => {
    setUpgradeModalVisible(false);
    setUpgradeFeature(null);
  }, []);

  const value: UserTierContextType = {
    userTier,
    isLoading,
    isProUser,
    canAccessFeature,
    showUpgradeModal,
    hideUpgradeModal,
    upgradeModalVisible,
    upgradeFeature,
    syncUser,
    setUserTier,
  };

  return (
    <UserTierContext.Provider value={value}>
      {children}
    </UserTierContext.Provider>
  );
}

export function useUserTier() {
  const context = useContext(UserTierContext);
  if (context === undefined) {
    throw new Error('useUserTier must be used within a UserTierProvider');
  }
  return context;
}

// Hook to easily check if a feature is accessible
export function useProFeature(feature: ProFeature) {
  const { canAccessFeature, showUpgradeModal, isProUser, isLoading } = useUserTier();
  
  const isAccessible = canAccessFeature(feature);
  
  const requestAccess = useCallback(() => {
    if (!isAccessible) {
      showUpgradeModal(feature);
    }
    return isAccessible;
  }, [isAccessible, showUpgradeModal, feature]);

  return {
    isAccessible,
    isProUser,
    isLoading,
    requestAccess,
    featureInfo: FEATURE_DESCRIPTIONS[feature],
  };
}
