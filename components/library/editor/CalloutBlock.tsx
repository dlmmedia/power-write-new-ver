'use client';

import React, { useRef, useEffect, useState } from 'react';
import { CalloutBlock, CalloutType, CALLOUT_TYPE_INFO } from './types';

interface CalloutBlockComponentProps {
  block: CalloutBlock;
  isSelected: boolean;
  isFocused: boolean;
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  onFocus: () => void;
  onChange: (content: string, title?: string, calloutType?: CalloutType) => void;
  onDelete: () => void;
  isReadOnly?: boolean;
}

export const CalloutBlockComponent: React.FC<CalloutBlockComponentProps> = ({
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
  const titleRef = useRef<HTMLInputElement>(null);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  
  const info = CALLOUT_TYPE_INFO[block.calloutType];
  
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
      onChange(newContent, block.title, block.calloutType);
    }
  };
  
  const handleTitleBlur = () => {
    const newTitle = titleRef.current?.value || '';
    if (newTitle !== block.title) {
      onChange(block.content, newTitle || undefined, block.calloutType);
    }
  };
  
  const handleTypeChange = (newType: CalloutType) => {
    onChange(block.content, block.title, newType);
    setShowTypeMenu(false);
  };
  
  return (
    <div
      className={`relative my-4 group ${
        isSelected ? 'ring-2 ring-yellow-400/50 rounded-lg' : ''
      }`}
    >
      <div
        className={`border-l-4 ${info.borderClass} ${info.bgClass} rounded-r-lg p-4 ${
          isFocused ? 'ring-1 ring-inset ring-gray-300 dark:ring-gray-600' : ''
        }`}
      >
        {/* Header with icon and title */}
        <div className="flex items-center gap-2 mb-2">
          {/* Type selector */}
          <div className="relative">
            <button
              onClick={() => !isReadOnly && setShowTypeMenu(!showTypeMenu)}
              disabled={isReadOnly}
              className={`text-xl hover:scale-110 transition-transform ${!isReadOnly ? 'cursor-pointer' : ''}`}
              title={isReadOnly ? info.label : 'Change callout type'}
            >
              {info.icon}
            </button>
            
            {showTypeMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-[120px]">
                {Object.entries(CALLOUT_TYPE_INFO).map(([type, typeInfo]) => (
                  <button
                    key={type}
                    onClick={() => handleTypeChange(type as CalloutType)}
                    className={`w-full px-3 py-1.5 flex items-center gap-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                      type === block.calloutType ? 'bg-gray-100 dark:bg-gray-800' : ''
                    }`}
                  >
                    <span>{typeInfo.icon}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{typeInfo.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Title */}
          <input
            ref={titleRef}
            type="text"
            defaultValue={block.title || ''}
            placeholder={`${info.label} title (optional)`}
            disabled={isReadOnly}
            className="flex-1 font-semibold text-gray-900 dark:text-white bg-transparent outline-none placeholder-gray-400 dark:placeholder-gray-500"
            onBlur={handleTitleBlur}
          />
        </div>
        
        {/* Content */}
        <div
          ref={contentRef}
          contentEditable={!isReadOnly}
          suppressContentEditableWarning
          className={`${fontSizeClasses[fontSize]} text-gray-700 dark:text-gray-300 outline-none min-h-[1.5em]`}
          onFocus={onFocus}
          onBlur={handleContentBlur}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !contentRef.current?.textContent && !block.title) {
              e.preventDefault();
              onDelete();
            }
          }}
          dangerouslySetInnerHTML={{ __html: block.content || 'Enter content...' }}
        />
      </div>
      
      {/* Delete button */}
      {!isReadOnly && (
        <button
          onClick={onDelete}
          className="absolute -right-2 -top-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-md hover:bg-red-600"
          title="Delete callout"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};
