'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
import { useUserTier } from '@/contexts/UserTierContext';
import { ThemeToggleCompact } from '@/components/ui/ThemeToggle';
import { Logo } from '@/components/ui/Logo';
import { Badge } from '@/components/ui/Badge';
import { 
  LogIn, 
  X, 
  Library, 
  PenTool, 
  Home,
  Crown,
  Sparkles,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
}

export function MainNav() {
  const pathname = usePathname();
  const { isProUser, isLoading: isTierLoading, showUpgradeModal } = useUserTier();
  const { isSignedIn } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const navLinks: NavLink[] = [
    { href: '/', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { href: '/library', label: 'My Library', icon: <Library className="w-4 h-4" />, requiresAuth: true },
    { href: '/studio', label: 'Create', icon: <PenTool className="w-4 h-4" />, requiresAuth: true },
  ];

  const isActive = useCallback((href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  }, [pathname]);

  const visibleNavLinks = isSignedIn
    ? navLinks
    : navLinks.filter(link => !link.requiresAuth);

  return (
    <>
      <header className="glass sticky top-0 z-40 border-b border-[var(--border)]"
        style={{ boxShadow: 'var(--shadow-header)' }}
      >
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <Logo size="md" />
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {visibleNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  className={cn(
                    'relative flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive(link.href)
                      ? 'text-[var(--text-inverse)] bg-[var(--accent)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                  )}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggleCompact />
            
            {/* Pro Badge / Upgrade */}
            {isSignedIn && (
              <>
                {isTierLoading ? (
                  <div className="w-16 h-7 bg-[var(--surface-hover)] rounded-full animate-shimmer" />
                ) : isProUser ? (
                  <Badge variant="accent" style="soft" size="sm" className="gap-1">
                    <Crown className="w-3 h-3" />
                    Pro
                  </Badge>
                ) : (
                  <button
                    onClick={() => showUpgradeModal()}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white hover:opacity-90 transition-opacity shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Upgrade
                  </button>
                )}
              </>
            )}

            {/* Auth */}
            {!isSignedIn && (
              <div className="hidden sm:flex items-center gap-2">
                <SignInButton mode="modal">
                  <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-all">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-4 py-2 text-sm font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] rounded-lg transition-all shadow-sm">
                    Get Started
                  </button>
                </SignUpButton>
              </div>
            )}
            
            {isSignedIn && <UserButton />}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-sm animate-fadeIn"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Drawer */}
          <div className="fixed right-0 top-0 h-full w-72 bg-[var(--background)] border-l border-[var(--border)] shadow-[var(--shadow-floating)] animate-slide-in-right overflow-y-auto">
            {/* Drawer header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <Logo size="sm" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="p-3 space-y-1">
              {visibleNavLinks.map((link) => (
                <Link
                  key={`mobile-${link.href}`}
                  href={link.href}
                  prefetch={true}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition-all',
                    isActive(link.href)
                      ? 'bg-[var(--accent)] text-[var(--text-inverse)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                  )}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Drawer footer actions */}
            <div className="p-3 border-t border-[var(--border)] mt-auto space-y-2">
              {isSignedIn && !isTierLoading && !isProUser && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    showUpgradeModal();
                  }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white"
                >
                  <Crown className="w-4 h-4" />
                  Upgrade to Pro
                </button>
              )}
              
              {!isSignedIn && (
                <div className="space-y-2">
                  <SignInButton mode="modal">
                    <button className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-lg border border-[var(--border)]">
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] rounded-lg">
                      Get Started Free
                    </button>
                  </SignUpButton>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
