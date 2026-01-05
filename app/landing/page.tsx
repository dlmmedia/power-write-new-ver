'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect legacy /landing URL to new home page
export default function LandingRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/');
  }, [router]);
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white">Redirecting...</div>
    </div>
  );
}
