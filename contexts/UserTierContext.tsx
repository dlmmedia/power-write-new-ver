'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';

export type UserTier = 'free' | 'pro';

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
    icon: '📚',
  },
  'generate-outline': {
    title: 'Outline Generation',
    description: 'Generate detailed book outlines with AI. Structure your book before writing.',
    icon: '📝',
  },
  'generate-audio': {
    title: 'Audiobook Generation',
    description: 'Convert your books into professional audiobooks with AI voices.',
    icon: '🎧',
  },
  'regenerate-audio': {
    title: 'Audio Regeneration',
    description: 'Regenerate audio for chapters with different voices or settings.',
    icon: '🔄',
  },
  'generate-cover': {
    title: 'Cover Generation',
    description: 'Generate stunning AI-powered book covers with multiple styles and customization options.',
    icon: '🎨',
  },
  'export-book': {
    title: 'Book Export',
    description: 'Export your books to PDF, EPUB, DOCX, and more formats for publishing.',
    icon: '📤',
  },
  'edit-book': {
    title: 'Book Editing',
    description: 'Edit and refine your book content with AI assistance.',
    icon: '✏️',
  },
  'duplicate-book': {
    title: 'Book Duplication',
    description: 'Create copies of your books for variations or backups.',
    icon: '📋',
  },
  'continue-generation': {
    title: 'Continue Generation',
    description: 'Resume interrupted book generation from where you left off.',
    icon: '▶️',
  },
  'bibliography': {
    title: 'Bibliography Management',
    description: 'Add and manage citations and references for your books.',
    icon: '📑',
  },
  'publishing-settings': {
    title: 'Publishing Settings',
    description: 'Configure advanced publishing options for your books.',
    icon: '⚙️',
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
  const [userTier, setUserTier] = useState<UserTier>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<ProFeature | null>(null);

  const syncUser = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/user/sync', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUserTier(data.user.tier);
        }
      }
    } catch (error) {
      console.error('Error syncing user tier:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isUserLoaded) {
      syncUser();
    }
  }, [isUserLoaded, syncUser]);

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







