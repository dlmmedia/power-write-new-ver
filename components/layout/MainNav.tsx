'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
import { useUserTier } from '@/contexts/UserTierContext';
import { ThemeToggleCompact } from '@/components/ui/ThemeToggle';
import { Logo } from '@/components/ui/Logo';
import { Badge } from '@/components/ui/Badge';
import { 
  LogIn, 
  Menu, 
  X, 
  BookOpen, 
  Library, 
  PenTool, 
  Home,
  Lock,
  Crown,
  Sparkles
} from 'lucide-react';

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
  requiresPro?: boolean;
}

export function MainNav() {
  const pathname = usePathname();
  const { isProUser, isLoading: isTierLoading, showUpgradeModal } = useUserTier();
  const { isSignedIn } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: NavLink[] = [
    { href: '/', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { href: '/library', label: 'My Library', icon: <Library className="w-4 h-4" />, requiresAuth: true },
    { href: '/studio', label: 'Create', icon: <PenTool className="w-4 h-4" />, requiresAuth: true },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  // Determine which nav links to show based on auth state
  const visibleNavLinks = isSignedIn
    ? navLinks
    : navLinks.filter(link => !link.requiresAuth);

  return (
    <header 
      className="border-b border-yellow-600/20 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-40"
      style={{ 
        fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", monospace', 
        letterSpacing: '0.2px', 
        boxShadow: '0px 4px 12px 0px rgba(0, 0, 0, 0.15)' 
      }}
    >
      <div className="container mx-auto px-4 py-3">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo size="md" />
            <nav className="flex items-center gap-1">
              {visibleNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                    isActive(link.href)
                      ? 'bg-yellow-400 text-black'
                      : 'text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {link.icon}
                  {link.label}
                  {isSignedIn && link.requiresAuth && !isProUser && link.href === '/studio' && (
                    <Lock className="w-3 h-3 text-purple-500" />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggleCompact />
            
            {/* Tier Badge / Upgrade Button - only when signed in */}
            {isSignedIn && (
              <>
                {isTierLoading ? (
                  <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                ) : isProUser ? (
                  <Badge variant="success" size="sm" className="flex items-center gap-1 bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700">
                    <Crown className="w-3 h-3" />
                    Pro
                  </Badge>
                ) : (
                  <button
                    onClick={() => showUpgradeModal()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg hover:scale-105"
                  >
                    <Sparkles className="w-4 h-4" />
                    Upgrade to Pro
                  </button>
                )}
              </>
            )}

            {/* Auth Buttons - Show when not signed in (including loading state) */}
            {!isSignedIn && (
              <>
                <SignInButton mode="modal">
                  <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-4 py-2 text-sm font-medium bg-yellow-500 hover:bg-yellow-600 text-black rounded-full transition-all">
                    Get Started
                  </button>
                </SignUpButton>
              </>
            )}
            {isSignedIn && (
              <UserButton />
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="flex items-center justify-between">
            <Logo size="sm" />
            <div className="flex items-center gap-2">
              <ThemeToggleCompact />
              {isSignedIn && (
                <>
                  {!isTierLoading && !isProUser && (
                    <button
                      onClick={() => showUpgradeModal()}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    >
                      <Sparkles className="w-3 h-3" />
                      Pro
                    </button>
                  )}
                  <UserButton />
                </>
              )}
              {!isSignedIn && (
                <SignInButton mode="modal">
                  <button className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all">
                    <LogIn className="w-5 h-5" />
                  </button>
                </SignInButton>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <nav className="mt-4 pb-2 border-t border-gray-200 dark:border-gray-800 pt-4">
              <div className="flex flex-col gap-1">
                {visibleNavLinks.map((link) => (
                  <Link
                    key={`mobile-${link.href}`}
                    href={link.href}
                    prefetch={true}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                      isActive(link.href)
                        ? 'bg-yellow-400 text-black'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {link.icon}
                    {link.label}
                    {isSignedIn && link.requiresAuth && !isProUser && link.href === '/studio' && (
                      <Lock className="w-3 h-3 text-purple-500 ml-auto" />
                    )}
                  </Link>
                ))}
              </div>
              
              {/* Mobile Upgrade CTA */}
              {isSignedIn && !isTierLoading && !isProUser && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      showUpgradeModal();
                    }}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white"
                  >
                    <Crown className="w-4 h-4" />
                    Upgrade to Pro - Unlock All Features
                  </button>
                </div>
              )}
              
              {/* Mobile Sign Up CTA */}
              {!isSignedIn && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <SignUpButton mode="modal">
                    <button className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold rounded-lg bg-yellow-500 hover:bg-yellow-600 text-black transition-all">
                      Get Started Free
                    </button>
                  </SignUpButton>
                </div>
              )}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
