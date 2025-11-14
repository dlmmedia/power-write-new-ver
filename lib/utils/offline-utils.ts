// Offline Detection and Management Utilities

import { useState, useEffect } from 'react';

// Hook to detect online/offline status
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      console.log('Connection restored');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('Connection lost');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// Check if user is online
export const isOnline = (): boolean => {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
};

// Queue for failed requests
interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body?: any;
  timestamp: number;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private storageKey = 'powerwrite-request-queue';

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadQueue();
    }
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load request queue:', error);
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save request queue:', error);
    }
  }

  add(request: Omit<QueuedRequest, 'id' | 'timestamp'>) {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };

    this.queue.push(queuedRequest);
    this.saveQueue();
    console.log('Request queued:', queuedRequest);
  }

  async processQueue() {
    if (!isOnline() || this.queue.length === 0) {
      return;
    }

    console.log(`Processing ${this.queue.length} queued requests...`);
    const requests = [...this.queue];
    this.queue = [];
    this.saveQueue();

    for (const request of requests) {
      try {
        await fetch(request.url, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: request.body ? JSON.stringify(request.body) : undefined,
        });
        console.log('Queued request processed:', request.id);
      } catch (error) {
        console.error('Failed to process queued request:', request.id, error);
        // Re-queue failed requests
        this.queue.push(request);
      }
    }

    this.saveQueue();
  }

  getQueue() {
    return [...this.queue];
  }

  clear() {
    this.queue = [];
    this.saveQueue();
  }

  size() {
    return this.queue.length;
  }
}

export const requestQueue = new RequestQueue();

// Automatically process queue when connection is restored
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    requestQueue.processQueue();
  });
}

// Fetch with offline support
export const fetchWithOfflineSupport = async (
  url: string,
  options?: RequestInit
): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    if (!isOnline()) {
      // Queue request for later
      if (options?.method && options.method !== 'GET') {
        requestQueue.add({
          url,
          method: options.method,
          body: options.body,
        });
      }

      throw new Error('You are offline. Request has been queued.');
    }
    throw error;
  }
};

// Check if feature requires internet
export const requiresInternet = (feature: string): boolean => {
  const onlineOnlyFeatures = [
    'generate-book',
    'generate-outline',
    'generate-cover',
    'search-books',
    'ai-generation',
  ];

  return onlineOnlyFeatures.includes(feature);
};

// Get offline capabilities message
export const getOfflineCapabilities = () => {
  return {
    available: [
      'Read recently viewed books (last 10)',
      'Browse cached library',
      'View book details and chapters',
      'Access app interface',
      'Export cached books',
    ],
    unavailable: [
      'Generate new books',
      'Create outlines',
      'Search for reference books',
      'Generate covers',
      'Sync with server',
    ],
  };
};

// Network speed detection
export const getNetworkSpeed = (): 'slow' | 'medium' | 'fast' | 'unknown' => {
  if (typeof window === 'undefined' || !('connection' in navigator)) {
    return 'unknown';
  }

  const connection = (navigator as any).connection;
  if (!connection) return 'unknown';

  const effectiveType = connection.effectiveType;

  switch (effectiveType) {
    case 'slow-2g':
    case '2g':
      return 'slow';
    case '3g':
      return 'medium';
    case '4g':
      return 'fast';
    default:
      return 'unknown';
  }
};

// Check if user should be warned about data usage
export const shouldWarnDataUsage = (): boolean => {
  if (typeof window === 'undefined' || !('connection' in navigator)) {
    return false;
  }

  const connection = (navigator as any).connection;
  if (!connection) return false;

  // Warn on slow connections or if save-data is enabled
  return connection.effectiveType === 'slow-2g' || 
         connection.effectiveType === '2g' || 
         connection.saveData === true;
};

// Estimate data usage for an operation
export const estimateDataUsage = (operation: string): string => {
  const estimates: Record<string, string> = {
    'generate-book': '~5-10 MB',
    'generate-outline': '~100-500 KB',
    'generate-cover': '~500 KB - 2 MB',
    'load-book': '~50-200 KB',
    'search-books': '~10-50 KB',
  };

  return estimates[operation] || 'Unknown';
};

