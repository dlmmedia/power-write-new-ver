'use client';

import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { 
  Lock, 
  BookOpen, 
  PenTool, 
  Library, 
  Sparkles, 
  ArrowRight,
  Headphones,
  Download
} from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  feature?: 'studio' | 'library' | 'generic';
  redirectOnAuth?: boolean;
}

const featureContent = {
  studio: {
    icon: <PenTool className="w-12 h-12" />,
    title: 'Create Your Own Books',
    description: 'Sign in to access the Book Studio and start generating AI-powered books with custom outlines, chapters, and covers.',
    features: [
      { icon: <Sparkles className="w-5 h-5" />, text: 'AI-powered chapter generation' },
      { icon: <BookOpen className="w-5 h-5" />, text: 'Custom outlines and structure' },
      { icon: <Headphones className="w-5 h-5" />, text: 'Audio narration generation' },
      { icon: <Download className="w-5 h-5" />, text: 'Export to PDF, EPUB, DOCX' },
    ],
  },
  library: {
    icon: <Library className="w-12 h-12" />,
    title: 'Your Personal Library',
    description: 'Sign in to access your generated books, continue writing, and manage your collection.',
    features: [
      { icon: <BookOpen className="w-5 h-5" />, text: 'Access your generated books' },
      { icon: <PenTool className="w-5 h-5" />, text: 'Edit and refine your content' },
      { icon: <Headphones className="w-5 h-5" />, text: 'Generate audio versions' },
      { icon: <Download className="w-5 h-5" />, text: 'Download in multiple formats' },
    ],
  },
  generic: {
    icon: <Lock className="w-12 h-12" />,
    title: 'Sign In Required',
    description: 'This feature requires authentication. Sign in to continue.',
    features: [],
  },
};

export function AuthGuard({ children, feature = 'generic', redirectOnAuth = false }: AuthGuardProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const content = featureContent[feature];

  // If auth is loading, show loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If signed in, render children
  if (isSignedIn) {
    return <>{children}</>;
  }

  // Not signed in - show sign-in prompt
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo size="lg" className="mx-auto mb-6" />
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
            {content.icon}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {content.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {content.description}
          </p>
        </div>

        {/* Features */}
        {content.features.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 mb-8">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              What you'll get
            </h3>
            <div className="space-y-3">
              {content.features.map((item, index) => (
                <div key={index} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div className="text-yellow-500">{item.icon}</div>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auth Buttons */}
        <div className="space-y-3">
          <SignUpButton mode="modal">
            <button className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-xl transition-all shadow-md hover:shadow-lg">
              <Sparkles className="w-5 h-5" />
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </button>
          </SignUpButton>
          
          <SignInButton mode="modal">
            <button className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-all">
              Already have an account? Sign In
            </button>
          </SignInButton>
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/')}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

// Higher-order component for wrapping pages
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: 'studio' | 'library' | 'generic' = 'generic'
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <AuthGuard feature={feature}>
        <WrappedComponent {...props} />
      </AuthGuard>
    );
  };
}
