'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { BeforeInstallPromptEvent, canInstallPWA } from '@/lib/utils/pwa-utils';

interface InstallButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onInstallClick: () => void;
}

export function InstallButton({ variant = 'primary', size = 'md', onInstallClick }: InstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    setCanInstall(canInstallPWA());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setCanInstall(false);
    } else {
      onInstallClick();
    }
  };

  if (!canInstall) return null;

  const baseClasses = 'flex items-center gap-2 rounded-lg font-semibold transition-colors';
  
  const variantClasses = {
    primary: 'bg-yellow-400 text-black hover:bg-yellow-500',
    secondary: 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700',
    ghost: 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      onClick={handleClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      <Download size={size === 'sm' ? 16 : size === 'md' ? 20 : 24} />
      <span>Install App</span>
    </button>
  );
}

