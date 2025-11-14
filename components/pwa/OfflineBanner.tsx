'use client';

import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '@/lib/utils/offline-utils';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-red-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-2 text-sm font-medium">
          <WifiOff size={16} />
          <span>You're offline. Some features may be unavailable.</span>
        </div>
      </div>
    </div>
  );
}

export function OnlineBanner() {
  const isOnline = useOnlineStatus();
  const [wasOffline, setWasOffline] = React.useState(false);
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-green-500 text-white shadow-lg animate-slide-down">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-2 text-sm font-medium">
          <Wifi size={16} />
          <span>You're back online!</span>
        </div>
      </div>
    </div>
  );
}

// Combined component
export function NetworkStatusBanner() {
  const isOnline = useOnlineStatus();
  const [wasOffline, setWasOffline] = React.useState(false);
  const [showOnline, setShowOnline] = React.useState(false);

  React.useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowOnline(false);
    } else if (wasOffline) {
      setShowOnline(true);
      const timer = setTimeout(() => {
        setShowOnline(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-40 bg-red-500 text-white shadow-lg">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <WifiOff size={16} />
            <span>You're offline. Some features may be unavailable.</span>
          </div>
        </div>
      </div>
    );
  }

  if (showOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-40 bg-green-500 text-white shadow-lg animate-slide-down">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <Wifi size={16} />
            <span>You're back online!</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

