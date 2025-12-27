'use client';

import { useUserTier } from '@/contexts/UserTierContext';
import { UpgradeModal } from './UpgradeModal';

/**
 * GlobalUpgradeModal - A global upgrade modal that responds to the UserTierContext
 * This is rendered at the app level and can be triggered from anywhere using useUserTier().showUpgradeModal()
 */
export function GlobalUpgradeModal() {
  const { upgradeModalVisible, hideUpgradeModal, upgradeFeature, setUserTier, syncUser } = useUserTier();

  const handleSuccess = () => {
    setUserTier('pro');
    syncUser();
    hideUpgradeModal();
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








