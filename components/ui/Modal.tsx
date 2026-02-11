'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  /** Use drawer mode on mobile */
  mobileDrawer?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  mobileDrawer = false,
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setIsVisible(false);
      onClose();
    }, 150);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, handleClose]);

  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw]',
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop with blur */}
      <div
        className={cn(
          'fixed inset-0 bg-[var(--overlay)] backdrop-blur-sm transition-opacity duration-200',
          isClosing ? 'opacity-0' : 'opacity-100'
        )}
        onClick={handleClose}
      />

      {/* Modal panel */}
      <div className={cn(
        'flex min-h-full items-center justify-center p-4',
        mobileDrawer && 'md:items-center items-end !p-0 md:!p-4'
      )}>
        <div
          className={cn(
            'relative w-full bg-[var(--background-elevated)] rounded-xl shadow-[var(--shadow-floating)] border border-[var(--border)]',
            sizeStyles[size],
            isClosing ? 'animate-scaleOut' : 'animate-scaleIn',
            mobileDrawer && 'md:rounded-xl rounded-b-none rounded-t-2xl md:max-h-none max-h-[90vh]'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer handle for mobile */}
          {mobileDrawer && (
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-8 h-1 bg-[var(--border-strong)] rounded-full" />
            </div>
          )}

          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between px-6 py-4 border-b border-[var(--border)]">
              <div className="flex-1 pr-4">
                {title && (
                  <h3
                    id="modal-title"
                    className="text-lg font-semibold text-[var(--text-primary)] tracking-tight"
                  >
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-sm text-[var(--text-muted)] mt-1">{description}</p>
                )}
              </div>
              {showCloseButton && (
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className={cn(
            'px-6 py-4',
            mobileDrawer && 'overflow-y-auto max-h-[70vh] md:max-h-none'
          )}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
