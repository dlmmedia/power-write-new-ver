'use client';

import { X, Download, Smartphone, Monitor, Share } from 'lucide-react';
import { getPlatform } from '@/lib/utils/pwa-utils';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallModal({ isOpen, onClose }: InstallModalProps) {
  if (!isOpen) return null;

  const platform = getPlatform();

  const renderInstructions = () => {
    switch (platform) {
      case 'ios':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-3">Install on iOS</h3>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <div>
                  <p className="font-semibold mb-1">Tap the Share button</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Look for the <Share size={16} className="inline" /> icon at the bottom of Safari
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <div>
                  <p className="font-semibold mb-1">Select "Add to Home Screen"</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Scroll down in the share menu and tap this option
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <div>
                  <p className="font-semibold mb-1">Tap "Add"</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Confirm to add PowerWrite to your home screen
                  </p>
                </div>
              </li>
            </ol>
          </div>
        );

      case 'android':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-3">Install on Android</h3>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <div>
                  <p className="font-semibold mb-1">Tap the menu button</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Look for the three dots (⋮) in the top-right corner
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <div>
                  <p className="font-semibold mb-1">Select "Install app" or "Add to Home screen"</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    The option may vary depending on your browser
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <div>
                  <p className="font-semibold mb-1">Tap "Install"</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Confirm to install PowerWrite on your device
                  </p>
                </div>
              </li>
            </ol>
          </div>
        );

      case 'desktop':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-3">Install on Desktop</h3>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <div>
                  <p className="font-semibold mb-1">Look for the install icon</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Check the address bar for a <Download size={16} className="inline" /> or <Monitor size={16} className="inline" /> icon
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <div>
                  <p className="font-semibold mb-1">Click "Install"</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Follow the browser's installation prompt
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <div>
                  <p className="font-semibold mb-1">Launch from your desktop</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    PowerWrite will appear in your applications
                  </p>
                </div>
              </li>
            </ol>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-3">Install PowerWrite</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Look for an install prompt in your browser, or check your browser's menu for an "Install" or "Add to Home Screen" option.
            </p>
          </div>
        );
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-400 text-black font-bold px-3 py-1 text-xl rounded">
                PW
              </div>
              <h2 className="font-bold text-xl">Install PowerWrite</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Benefits */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-3">Why Install?</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-yellow-400 bg-opacity-10 rounded-lg flex items-center justify-center">
                    <Smartphone size={16} className="text-yellow-400" />
                  </div>
                  <span>Access from your home screen like a native app</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-yellow-400 bg-opacity-10 rounded-lg flex items-center justify-center">
                    <Download size={16} className="text-yellow-400" />
                  </div>
                  <span>Read your books offline without internet</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-yellow-400 bg-opacity-10 rounded-lg flex items-center justify-center">
                    <Monitor size={16} className="text-yellow-400" />
                  </div>
                  <span>Faster loading and better performance</span>
                </div>
              </div>
            </div>

            {/* Platform-specific instructions */}
            {renderInstructions()}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-yellow-400 text-black rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </>
  );
}



