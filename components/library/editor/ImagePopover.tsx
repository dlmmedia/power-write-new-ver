'use client';

import React, { useRef, useEffect } from 'react';
import { ChapterImage } from './types';
import { ImagePlacement, ImageSize, IMAGE_SIZE_INFO } from '@/lib/types/book-images';

interface ImagePopoverProps {
  image: ChapterImage;
  position: { top: number; left: number };
  onClose: () => void;
  onSizeChange: (size: ImageSize) => void;
  onAlignChange: (align: ImagePlacement) => void;
  onDelete: () => void;
  onOpenSidePanel: () => void;
}

export const ImagePopover: React.FC<ImagePopoverProps> = ({
  image,
  position,
  onClose,
  onSizeChange,
  onAlignChange,
  onDelete,
  onOpenSidePanel,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);
  
  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);
  
  const currentSize = image.metadata?.size || 'medium';
  const currentAlign = image.placement || 'center';
  
  const sizeOptions: ImageSize[] = ['small', 'medium', 'large', 'full'];
  const alignOptions: { value: ImagePlacement; icon: string; label: string }[] = [
    { value: 'float-left', icon: '⬅️', label: 'Left' },
    { value: 'center', icon: '⬜', label: 'Center' },
    { value: 'float-right', icon: '➡️', label: 'Right' },
  ];
  
  return (
    <div
      ref={popoverRef}
      className="fixed z-50 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 animate-in fade-in zoom-in-95 duration-150"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)',
      }}
    >
      {/* Arrow pointing down */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-gray-900 border-r border-b border-gray-200 dark:border-gray-700 transform rotate-45" />
      
      <div className="flex items-center gap-4">
        {/* Size selector */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Size:</span>
          {sizeOptions.map((size) => (
            <button
              key={size}
              onClick={() => onSizeChange(size)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                currentSize === size
                  ? 'bg-yellow-400 text-black font-medium'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title={IMAGE_SIZE_INFO[size]?.description}
            >
              {IMAGE_SIZE_INFO[size]?.name || size}
            </button>
          ))}
        </div>
        
        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
        
        {/* Alignment selector */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Align:</span>
          {alignOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onAlignChange(option.value)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                currentAlign === option.value
                  ? 'bg-yellow-400 text-black font-medium'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title={option.label}
            >
              {option.icon}
            </button>
          ))}
        </div>
        
        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
        
        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenSidePanel}
            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors flex items-center gap-1"
            title="Open full editor"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          
          <button
            onClick={() => {
              if (confirm('Delete this image?')) {
                onDelete();
              }
            }}
            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            title="Delete image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
