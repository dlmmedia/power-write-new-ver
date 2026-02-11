import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'outlined' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', className, children, ...props }, ref) => {
    const variantStyles = {
      default:
        'bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--shadow-sm)]',
      elevated:
        'bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--shadow-md)]',
      interactive:
        'bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-[var(--border-strong)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
      outlined:
        'bg-transparent border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors',
      ghost:
        'bg-transparent hover:bg-[var(--surface-hover)] transition-colors',
    };

    const paddingStyles = {
      none: '',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-7',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl',
          variantStyles[variant],
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-between pb-4', className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h2' | 'h3' | 'h4';
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ as: Tag = 'h3', className, children, ...props }, ref) => (
    <Tag
      ref={ref}
      className={cn(
        'text-lg font-semibold text-[var(--text-primary)] tracking-tight',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  )
);
CardTitle.displayName = 'CardTitle';

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props}>
      {children}
    </div>
  )
);
CardBody.displayName = 'CardBody';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center pt-4 border-t border-[var(--border-subtle)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';
