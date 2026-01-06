'use client';

import React from 'react';
import { DividerBlock } from './types';

interface DividerBlockComponentProps {
  block: DividerBlock;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  isReadOnly?: boolean;
}

export const DividerBlockComponent: React.FC<DividerBlockComponentProps> = ({
  block,
  isSelected,
  onClick,
  onDelete,
  isReadOnly = false,
}) => {
  return (
    <div
      className={`relative my-6 group cursor-pointer ${
        isSelected ? 'py-2' : ''
      }`}
      onClick={onClick}
    >
      {/* Divider line */}
      <div
        className={`relative ${
          isSelected ? 'px-4' : ''
        }`}
      >
        <hr
          className={`border-t-2 transition-colors ${
            isSelected
              ? 'border-yellow-400'
              : 'border-gray-300 dark:border-gray-600 group-hover:border-gray-400 dark:group-hover:border-gray-500'
          }`}
        />
        
        {/* Decorative dots */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 bg-white dark:bg-gray-900 px-3">
          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-yellow-400' : 'bg-gray-400 dark:bg-gray-500'}`} />
          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-yellow-400' : 'bg-gray-400 dark:bg-gray-500'}`} />
          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-yellow-400' : 'bg-gray-400 dark:bg-gray-500'}`} />
        </div>
      </div>
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-yellow-400 rounded-lg pointer-events-none" />
      )}
      
      {/* Delete button */}
      {!isReadOnly && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-md hover:bg-red-600"
          title="Delete divider"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      
      {/* Hover hint */}
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded shadow-sm">
          Scene break
        </span>
      </div>
    </div>
  );
};
