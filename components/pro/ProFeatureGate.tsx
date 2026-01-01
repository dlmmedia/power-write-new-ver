'use client';

import React, { ReactNode } from 'react';
import { useProFeature, ProFeature, FEATURE_DESCRIPTIONS } from '@/contexts/UserTierContext';
import { Lock, Crown, Sparkles } from 'lucide-react';

interface ProFeatureGateProps {
  feature: ProFeature;
  children: ReactNode;
  // Different display modes for the locked state
  mode?: 'overlay' | 'replace' | 'disable' | 'hide';
  // Custom locked message
  lockedMessage?: string;
  // Show inline mini badge instead of full overlay
  inline?: boolean;
  // Custom class for the wrapper
  className?: string;
}

/**
 * ProFeatureGate - Wraps content that should only be accessible to Pro users
 * 
 * Modes:
 * - overlay: Shows content with a semi-transparent overlay and lock icon
 * - replace: Completely replaces content with upgrade prompt
 * - disable: Shows content but disabled/grayed out with tooltip
 * - hide: Completely hides content (doesn't render anything)
 */
export function ProFeatureGate({
  feature,
  children,
  mode = 'overlay',
  lockedMessage,
  inline = false,
  className = '',
}: ProFeatureGateProps) {
  const { isAccessible, requestAccess, featureInfo, isLoading } = useProFeature(feature);

  // While loading, show children (optimistic)
  if (isLoading) {
    return <>{children}</>;
  }

  // Pro users see the content normally
  if (isAccessible) {
    return <>{children}</>;
  }

  // Free users - show locked state based on mode
  const message = lockedMessage || featureInfo.description;

  if (mode === 'hide') {
    return null;
  }

  if (mode === 'replace') {
    return (
      <div 
        className={`flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}
        onClick={requestAccess}
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <span>{featureInfo.icon}</span>
          {featureInfo.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md mb-4">
          {message}
        </p>
        <button
          onClick={requestAccess}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
        >
          <Crown className="w-4 h-4" />
          Upgrade to Pro
        </button>
      </div>
    );
  }

  if (mode === 'disable') {
    return (
      <div 
        className={`relative ${className}`}
        onClick={requestAccess}
        title={`Pro Feature: ${featureInfo.title}`}
      >
        <div className="opacity-50 pointer-events-none select-none">
          {children}
        </div>
        {!inline && (
          <div className="absolute top-2 right-2">
            <ProBadge onClick={requestAccess} />
          </div>
        )}
      </div>
    );
  }

  // Default: overlay mode
  return (
    <div className={`relative ${className}`}>
      <div className="opacity-30 blur-[1px] pointer-events-none select-none">
        {children}
      </div>
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900/60 to-gray-900/80 dark:from-black/60 dark:to-black/80 rounded-lg cursor-pointer backdrop-blur-sm"
        onClick={requestAccess}
      >
        <div className="text-center px-6 py-8">
          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            {featureInfo.icon} {featureInfo.title}
          </h3>
          <p className="text-sm text-gray-300 max-w-sm mb-4">
            {message}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              requestAccess();
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all mx-auto"
          >
            <Crown className="w-4 h-4" />
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * ProBadge - Small badge indicating a Pro feature
 */
interface ProBadgeProps {
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export function ProBadge({ onClick, size = 'sm' }: ProBadgeProps) {
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs' 
    : 'px-3 py-1 text-sm';

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 ${sizeClasses} font-medium rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-sm`}
    >
      <Crown className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      Pro
    </button>
  );
}

/**
 * ProButton - A button that either works normally for Pro users or shows upgrade modal for free users
 */
interface ProButtonProps {
  feature: ProFeature;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isLoading?: boolean;
}

export function ProButton({
  feature,
  onClick,
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  isLoading = false,
}: ProButtonProps) {
  const { isAccessible, requestAccess, isLoading: tierLoading } = useProFeature(feature);

  const handleClick = () => {
    if (!isAccessible) {
      requestAccess();
      return;
    }
    onClick();
  };

  const baseClasses = 'flex items-center gap-2 font-medium rounded-lg transition-all relative';
  
  const variantClasses = {
    primary: isAccessible 
      ? 'bg-yellow-400 text-black hover:bg-yellow-300' 
      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600',
    outline: isAccessible
      ? 'border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      : 'border border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20',
    ghost: isAccessible
      ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const disabledClasses = (disabled || tierLoading) 
    ? 'opacity-50 cursor-not-allowed' 
    : 'cursor-pointer';

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading || tierLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
    >
      {!isAccessible && <Lock className="w-4 h-4" />}
      {children}
      {!isAccessible && (
        <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-white/20">PRO</span>
      )}
    </button>
  );
}

/**
 * ProIconButton - Icon button with Pro gating
 */
interface ProIconButtonProps {
  feature: ProFeature;
  onClick: () => void;
  icon: ReactNode;
  className?: string;
  title?: string;
  disabled?: boolean;
}

export function ProIconButton({
  feature,
  onClick,
  icon,
  className = '',
  title,
  disabled = false,
}: ProIconButtonProps) {
  const { isAccessible, requestAccess, featureInfo } = useProFeature(feature);

  const handleClick = () => {
    if (!isAccessible) {
      requestAccess();
      return;
    }
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      title={isAccessible ? title : `Pro Feature: ${featureInfo.title}`}
      className={`relative p-2 rounded-lg transition-all ${
        isAccessible 
          ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400' 
          : 'hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-500 dark:text-purple-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {icon}
      {!isAccessible && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <Lock className="w-2.5 h-2.5 text-white" />
        </span>
      )}
    </button>
  );
}

/**
 * useProAction - Hook for handling pro-gated actions
 */
export function useProAction(feature: ProFeature, action: () => void) {
  const { isAccessible, requestAccess } = useProFeature(feature);

  const execute = () => {
    if (!isAccessible) {
      requestAccess();
      return false;
    }
    action();
    return true;
  };

  return { execute, isAccessible, requestAccess };
}










