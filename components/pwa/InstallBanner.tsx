'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Zap, Wifi } from 'lucide-react';
import {
  shouldShowInstallPrompt,
  markInstallPromptShown,
  markInstallPromptDismissed,
  markInstallPromptDontShow,
  BeforeInstallPromptEvent,
} from '@/lib/utils/pwa-utils';

interface InstallBannerProps {
  onInstallClick: () => void;
}

export function InstallBanner({ onInstallClick }: InstallBannerProps) {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if banner should be shown
    const shouldShow = shouldShowInstallPrompt();
    
    console.log('[InstallBanner] Should show banner:', shouldShow);
    console.log('[InstallBanner] Is installed:', window.matchMedia('(display-mode: standalone)').matches);
    console.log('[InstallBanner] localStorage dismissed:', localStorage.getItem('pwa-install-dismissed'));
    console.log('[InstallBanner] localStorage dont-show:', localStorage.getItem('pwa-install-dont-show'));
    
    if (shouldShow) {
      console.log('[InstallBanner] Banner will show in 3 seconds...');
      // Show banner after a short delay
      const timer = setTimeout(() => {
        console.log('[InstallBanner] Showing banner now!');
        setShow(true);
        markInstallPromptShown();
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
    } else {
      console.log('[InstallBanner] Banner will NOT show');
    }
  }, []);

  useEffect(() => {
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
    } else {
      onInstallClick();
    }
    
    setShow(false);
  };

  const handleMaybeLater = () => {
    markInstallPromptDismissed();
    setShow(false);
  };

  const handleDontShowAgain = () => {
    markInstallPromptDontShow();
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down shadow-xl">
      <div className="bg-gradient-to-r from-yellow-400 via-yellow-400 to-yellow-500">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-start gap-2 sm:gap-4">
            {/* Icon */}
            <div className="hidden sm:flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-black rounded-lg flex-shrink-0">
              <Download size={24} className="text-yellow-400" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base sm:text-lg text-black mb-1 leading-tight">
                Install PowerWrite for a Better Experience
              </h3>
              <p className="text-xs sm:text-sm text-black opacity-90 mb-2 sm:mb-3 leading-snug">
                Get faster access, offline reading, and a native app experience on your device.
              </p>

              {/* Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-black font-medium">
                  <Wifi size={16} className="flex-shrink-0" />
                  <span>Offline Reading</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-black font-medium">
                  <Zap size={16} className="flex-shrink-0" />
                  <span>Faster Loading</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-black font-medium">
                  <Smartphone size={16} className="flex-shrink-0" />
                  <span>Home Screen Access</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleInstall}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-black text-yellow-400 rounded-lg font-semibold hover:bg-gray-800 active:bg-gray-900 transition-colors text-xs sm:text-sm shadow-md"
                >
                  Install Now
                </button>
                <button
                  onClick={handleMaybeLater}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-900 rounded-lg font-semibold transition-colors text-xs sm:text-sm border border-gray-300"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleDontShowAgain}
                  className="text-xs sm:text-sm text-gray-700 hover:text-gray-900 underline font-medium px-2 py-1"
                >
                  Don't show again
                </button>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={handleMaybeLater}
              className="p-1 sm:p-1.5 hover:bg-black hover:bg-opacity-15 active:bg-opacity-25 rounded transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X size={20} className="text-black" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

