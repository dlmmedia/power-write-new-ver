'use client';

import React, { useRef, useEffect } from 'react';
import { QuoteBlock } from './types';

interface QuoteBlockComponentProps {
  block: QuoteBlock;
  isSelected: boolean;
  isFocused: boolean;
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  onFocus: () => void;
  onChange: (content: string, attribution?: string) => void;
  onDelete: () => void;
  isReadOnly?: boolean;
}

export const QuoteBlockComponent: React.FC<QuoteBlockComponentProps> = ({
  block,
  isSelected,
  isFocused,
  fontSize,
  onFocus,
  onChange,
  onDelete,
  isReadOnly = false,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const attributionRef = useRef<HTMLInputElement>(null);
  
  const fontSizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };
  
  // Focus content when block is focused
  useEffect(() => {
    if (isFocused && contentRef.current) {
      contentRef.current.focus();
    }
  }, [isFocused]);
  
  const handleContentBlur = () => {
    const newContent = contentRef.current?.textContent || '';
    if (newContent !== block.content) {
      onChange(newContent, block.attribution);
    }
  };
  
  const handleAttributionBlur = () => {
    const newAttribution = attributionRef.current?.value || '';
    if (newAttribution !== block.attribution) {
      onChange(block.content, newAttribution || undefined);
    }
  };
  
  return (
    <div
      className={`relative my-4 group ${
        isSelected ? 'ring-2 ring-yellow-400/50 rounded-lg' : ''
      }`}
    >
      <div
        className={`border-l-4 border-yellow-400 pl-4 py-2 bg-yellow-50/50 dark:bg-yellow-900/10 rounded-r-lg ${
          isFocused ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
        }`}
      >
        {/* Quote content */}
        <div
          ref={contentRef}
          contentEditable={!isReadOnly}
          suppressContentEditableWarning
          className={`${fontSizeClasses[fontSize]} italic text-gray-700 dark:text-gray-300 outline-none min-h-[1.5em]`}
          style={{ fontFamily: 'Georgia, serif' }}
          onFocus={onFocus}
          onBlur={handleContentBlur}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !contentRef.current?.textContent) {
              e.preventDefault();
              onDelete();
            }
          }}
          dangerouslySetInnerHTML={{ __html: block.content || 'Enter quote...' }}
        />
        
        {/* Attribution */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-gray-400">—</span>
          <input
            ref={attributionRef}
            type="text"
            defaultValue={block.attribution || ''}
            placeholder="Attribution (optional)"
            disabled={isReadOnly}
            className="flex-1 text-sm text-gray-600 dark:text-gray-400 bg-transparent outline-none placeholder-gray-400 dark:placeholder-gray-600"
            onBlur={handleAttributionBlur}
          />
        </div>
      </div>
      
      {/* Delete button */}
      {!isReadOnly && (
        <button
          onClick={onDelete}
          className="absolute -right-2 -top-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-md hover:bg-red-600"
          title="Delete quote"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};
