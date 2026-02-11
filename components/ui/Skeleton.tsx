import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  lines = 1,
  className,
  ...props
}) => {
  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  const style: React.CSSProperties = {
    width: width ?? (variant === 'circular' ? height || '40px' : '100%'),
    height: variant === 'text' ? undefined : height || '40px',
  };

  if (lines > 1 && variant === 'text') {
    return (
      <div className={cn('space-y-2.5', className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'animate-shimmer',
              variantStyles.text,
              i === lines - 1 && 'w-3/4'
            )}
            style={{ height: height || '14px' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn('animate-shimmer', variantStyles[variant], className)}
      style={style}
      {...props}
    />
  );
};

/** Pre-composed skeleton for a card layout */
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]', className)}>
    <Skeleton variant="rounded" height="160px" className="mb-4" />
    <Skeleton variant="text" className="mb-2" />
    <Skeleton variant="text" width="60%" />
    <div className="flex items-center gap-2 mt-4">
      <Skeleton variant="circular" width="24px" height="24px" />
      <Skeleton variant="text" width="100px" />
    </div>
  </div>
);
