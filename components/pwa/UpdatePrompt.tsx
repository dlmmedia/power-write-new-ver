'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, Download } from 'lucide-react';
import { onServiceWorkerUpdate, skipWaitingAndReload, forceUpdate } from '@/lib/utils/pwa-utils';

export function UpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Listen for service worker updates
    const unsubscribe = onServiceWorkerUpdate((registration) => {
      console.log('[UpdatePrompt] New version detected');
      setShowPrompt(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await skipWaitingAndReload();
    } catch (error) {
      console.error('[UpdatePrompt] Update failed:', error);
      setIsUpdating(false);
    }
  };

  const handleForceUpdate = async () => {
    setIsUpdating(true);
    try {
      await forceUpdate();
    } catch (error) {
      console.error('[UpdatePrompt] Force update failed:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md"
        >
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-lg">
                    Update Available
                  </h3>
                  <p className="text-white/90 text-sm mt-0.5">
                    A new version of PowerWrite is ready. Update now for the latest features and fixes.
                  </p>
                </div>
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-amber-600 font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Update Now
                    </>
                  )}
                </button>
                <button
                  onClick={handleDismiss}
                  disabled={isUpdating}
                  className="px-4 py-2.5 text-white/90 font-medium rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Toast-style update notification (alternative, more subtle)
export function UpdateToast() {
  const [showToast, setShowToast] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const unsubscribe = onServiceWorkerUpdate(() => {
      setShowToast(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await skipWaitingAndReload();
    } catch (error) {
      console.error('[UpdateToast] Update failed:', error);
      setIsUpdating(false);
    }
  };

  return (
    <AnimatePresence>
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 md:bottom-6 right-4 z-[100]"
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900 dark:bg-zinc-800 text-white rounded-lg shadow-xl border border-zinc-700">
            <Download className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span className="text-sm font-medium">New version available</span>
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="ml-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-medium text-sm rounded-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating</span>
                </>
              ) : (
                'Refresh'
              )}
            </button>
            <button
              onClick={() => setShowToast(false)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
