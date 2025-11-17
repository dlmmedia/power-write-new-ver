'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Sun, Moon, Download, Settings, HelpCircle, Info, Trash2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallClick: () => void;
  showInstallButton: boolean;
}

export function HamburgerMenu({ isOpen, onClose, onInstallClick, showInstallButton }: HamburgerMenuProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const menuItems = [
    {
      id: 'theme',
      label: theme === 'dark' ? 'Light Mode' : 'Dark Mode',
      icon: theme === 'dark' ? Sun : Moon,
      onClick: () => {
        toggleTheme();
      },
    },
    ...(showInstallButton
      ? [
          {
            id: 'install',
            label: 'Install App',
            icon: Download,
            onClick: () => {
              onClose();
              onInstallClick();
            },
          },
        ]
      : []),
    {
      id: 'about',
      label: 'About PowerWrite',
      icon: Info,
      onClick: () => {
        router.push('/landing');
        onClose();
      },
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: HelpCircle,
      onClick: () => {
        alert('Help & Support coming soon!');
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      onClick: () => {
        alert('Settings coming soon!');
      },
    },
    {
      id: 'clear-cache',
      label: 'Clear Cache',
      icon: Trash2,
      onClick: async () => {
        if (confirm('Clear all offline data? This will remove cached books and assets.')) {
          try {
            // Clear service worker caches
            if ('caches' in window) {
              const cacheNames = await caches.keys();
              await Promise.all(cacheNames.map(name => caches.delete(name)));
            }
            
            // Clear IndexedDB
            if ('indexedDB' in window) {
              indexedDB.deleteDatabase('powerwrite-offline');
            }
            
            alert('Cache cleared successfully!');
            onClose();
          } catch (error) {
            console.error('Failed to clear cache:', error);
            alert('Failed to clear cache. Please try again.');
          }
        }
      },
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Menu Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-black border-l border-gray-200 dark:border-gray-800 z-50 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-400 text-black font-bold px-3 py-1 text-xl rounded">
              PW
            </div>
            <div>
              <h2 className="font-bold text-lg">PowerWrite</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">AI Book Generator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Menu Items */}
        <div className="p-4">
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors text-left"
                >
                  <Icon size={20} className="text-yellow-400" />
                  <span className="text-gray-900 dark:text-white font-medium">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            PowerWrite v1.0.0
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-1">
            © 2025 PowerWrite. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}



