import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showCount?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      showCount,
      className,
      disabled,
      maxLength,
      value,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-[var(--input-bg)] border rounded-lg px-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-[var(--input-focus)] focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error
                ? 'border-[var(--error)] focus:ring-[var(--error)] animate-shake'
                : 'border-[var(--input-border)] hover:border-[var(--border-strong)]',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            disabled={disabled}
            maxLength={maxLength}
            value={value}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[var(--text-muted)]">
              {rightIcon}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
          <div>
            {error && (
              <p className="text-sm text-[var(--error)] font-medium">{error}</p>
            )}
            {helperText && !error && (
              <p className="text-sm text-[var(--text-muted)]">{helperText}</p>
            )}
          </div>
          {showCount && maxLength && (
            <p className="text-xs text-[var(--text-muted)] tabular-nums">
              {String(value || '').length}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';
