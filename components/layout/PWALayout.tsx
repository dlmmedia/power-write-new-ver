'use client';

import { useState } from 'react';
import { BottomNav } from '@/components/ui/BottomNav';
import { HamburgerMenu } from '@/components/ui/HamburgerMenu';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { InstallModal } from '@/components/pwa/InstallModal';
import { NetworkStatusBanner } from '@/components/pwa/OfflineBanner';
import { canInstallPWA } from '@/lib/utils/pwa-utils';

interface PWALayoutProps {
  children: React.ReactNode;
}

export function PWALayout({ children }: PWALayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(false);

  // Check if install button should be shown
  useState(() => {
    if (typeof window !== 'undefined') {
      setShowInstallButton(canInstallPWA());
    }
  });

  const handleInstallClick = () => {
    setIsInstallModalOpen(true);
  };

  return (
    <>
      {/* Network Status Banner */}
      <NetworkStatusBanner />

      {/* Install Banner */}
      <InstallBanner onInstallClick={handleInstallClick} />

      {/* Main Content */}
      {children}

      {/* Bottom Navigation (Mobile Only) */}
      <BottomNav onMenuClick={() => setIsMenuOpen(true)} />

      {/* Hamburger Menu */}
      <HamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onInstallClick={handleInstallClick}
        showInstallButton={showInstallButton}
      />

      {/* Install Modal */}
      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </>
  );
}



