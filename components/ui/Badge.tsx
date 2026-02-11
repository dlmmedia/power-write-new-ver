import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent';
  style?: 'solid' | 'soft' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  style: badgeStyle = 'solid',
  size = 'md',
  pulse = false,
  className,
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full whitespace-nowrap';

  const solidVariants: Record<string, string> = {
    default: 'bg-[var(--background-tertiary)] text-[var(--text-secondary)]',
    success: 'bg-[var(--success)] text-white',
    warning: 'bg-[var(--warning)] text-[var(--text-inverse)]',
    error: 'bg-[var(--error)] text-white',
    info: 'bg-[var(--info)] text-white',
    accent: 'bg-[var(--accent)] text-[var(--text-inverse)]',
  };

  const softVariants: Record<string, string> = {
    default: 'bg-[var(--background-tertiary)] text-[var(--text-secondary)]',
    success: 'bg-[var(--success-light)] text-[var(--success)]',
    warning: 'bg-[var(--warning-light)] text-[var(--warning)]',
    error: 'bg-[var(--error-light)] text-[var(--error)]',
    info: 'bg-[var(--info-light)] text-[var(--info)]',
    accent: 'bg-[var(--accent-surface)] text-[var(--accent-text)]',
  };

  const outlineVariants: Record<string, string> = {
    default: 'border border-[var(--border)] text-[var(--text-secondary)]',
    success: 'border border-[var(--success)] text-[var(--success)]',
    warning: 'border border-[var(--warning)] text-[var(--warning)]',
    error: 'border border-[var(--error)] text-[var(--error)]',
    info: 'border border-[var(--info)] text-[var(--info)]',
    accent: 'border border-[var(--accent)] text-[var(--accent-text)]',
  };

  const styleMap = {
    solid: solidVariants,
    soft: softVariants,
    outline: outlineVariants,
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1',
    lg: 'px-3 py-1.5 text-sm gap-1.5',
  };

  return (
    <span
      className={cn(
        baseStyles,
        styleMap[badgeStyle][variant],
        sizeStyles[size],
        pulse && 'animate-pulse-glow',
        className
      )}
    >
      {children}
    </span>
  );
};
