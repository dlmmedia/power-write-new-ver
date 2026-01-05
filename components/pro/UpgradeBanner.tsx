'use client';

import { useUserTier } from '@/contexts/UserTierContext';
import { Crown, Sparkles, Zap, ArrowRight, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface UpgradeBannerProps {
  variant?: 'full' | 'compact' | 'floating';
  dismissible?: boolean;
  storageKey?: string;
}

export function UpgradeBanner({ 
  variant = 'full', 
  dismissible = true, 
  storageKey = 'upgrade-banner-dismissed' 
}: UpgradeBannerProps) {
  const { isProUser, showUpgradeModal } = useUserTier();
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if dismissed on mount
  useEffect(() => {
    if (dismissible && storageKey) {
      const dismissed = localStorage.getItem(storageKey);
      const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
      // Re-show after 24 hours
      if (dismissedTime && Date.now() - dismissedTime < 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
      }
    }
  }, [dismissible, storageKey]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (storageKey) {
      localStorage.setItem(storageKey, Date.now().toString());
    }
  };

  // Don't show for Pro users or if dismissed
  if (isProUser || isDismissed) return null;

  // Full width banner at top of page
  if (variant === 'full') {
    return (
      <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white overflow-hidden">
        {/* Animated background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-full animate-pulse" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-white/10 to-transparent rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl backdrop-blur-sm">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-sm sm:text-base">Upgrade to Pro</span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-white/20 rounded-full">Limited Offer</span>
              </div>
              <p className="text-white/80 text-xs sm:text-sm">
                Unlock unlimited book generation, audio narration, exports & more
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => showUpgradeModal()}
              className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold text-sm hover:bg-white/90 transition-all shadow-md hover:shadow-lg hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Upgrade Now</span>
              <span className="sm:hidden">Upgrade</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            
            {dismissible && (
              <button
                onClick={handleDismiss}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Compact inline banner
  if (variant === 'compact') {
    return (
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200 dark:border-purple-800 rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-lg">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-white">Unlock Pro Features</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Generate books, audio & more</p>
          </div>
        </div>
        
        <button
          onClick={() => showUpgradeModal()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium text-sm hover:from-purple-600 hover:to-pink-600 transition-all"
        >
          <Crown className="w-3.5 h-3.5" />
          Upgrade
        </button>
      </div>
    );
  }

  // Floating banner (bottom right)
  if (variant === 'floating') {
    return (
      <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-bottom-6 duration-500">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 shadow-2xl text-white">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm mb-1">Ready to create?</h4>
              <p className="text-white/80 text-xs mb-3">
                Upgrade to Pro and start generating amazing books with AI.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => showUpgradeModal()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-purple-600 rounded-lg font-semibold text-xs hover:bg-white/90 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Upgrade Now
                </button>
                {dismissible && (
                  <button
                    onClick={handleDismiss}
                    className="text-white/60 hover:text-white text-xs transition-colors"
                  >
                    Maybe later
                  </button>
                )}
              </div>
            </div>
            {dismissible && (
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Pro feature lock overlay for sections
export function ProFeatureLock({ 
  feature, 
  children 
}: { 
  feature: string; 
  children?: React.ReactNode;
}) {
  const { isProUser, showUpgradeModal } = useUserTier();

  if (isProUser) return <>{children}</>;

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="pointer-events-none select-none blur-sm opacity-50">
        {children}
      </div>
      
      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-[2px]">
        <div className="text-center p-6">
          <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white">
            <Crown className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">Pro Feature</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-xs">
            {feature} requires a Pro subscription
          </p>
          <button
            onClick={() => showUpgradeModal()}
            className="flex items-center gap-2 px-4 py-2 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium text-sm hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
  );
}
