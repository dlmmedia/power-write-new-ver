'use client';

import { useUserTier } from '@/contexts/UserTierContext';
import { UpgradeModal } from './UpgradeModal';

/**
 * GlobalUpgradeModal - A global upgrade modal that responds to the UserTierContext
 * This is rendered at the app level and can be triggered from anywhere using useUserTier().showUpgradeModal()
 */
export function GlobalUpgradeModal() {
  const { upgradeModalVisible, hideUpgradeModal, upgradeFeature, setUserTier, syncUser } = useUserTier();

  const handleSuccess = async () => {
    // Immediately set to pro for instant UI feedback
    setUserTier('pro');
    
    // Close the modal first so user sees the updated UI
    hideUpgradeModal();
    
    // Then sync in background to confirm from database
    // The setUserTier('pro') above ensures immediate access even if sync is slow
    try {
      await syncUser();
      console.log('[GlobalUpgradeModal] User tier synced successfully after upgrade');
    } catch (error) {
      console.error('[GlobalUpgradeModal] Error syncing after upgrade:', error);
      // Keep the pro tier set - it was already updated in the database by the promo API
    }
  };

  return (
    <UpgradeModal
      isOpen={upgradeModalVisible}
      onClose={hideUpgradeModal}
      onSuccess={handleSuccess}
      feature={upgradeFeature}
    />
  );
}










