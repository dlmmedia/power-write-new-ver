'use client';

import React from 'react';
import { ImageBlock } from './types';
import { IMAGE_TYPE_INFO, IMAGE_SIZE_INFO } from '@/lib/types/book-images';

interface ImageBlockComponentProps {
  block: ImageBlock;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onOpenSidePanel: () => void;
}

export const ImageBlockComponent: React.FC<ImageBlockComponentProps> = ({
  block,
  isSelected,
  onClick,
  onDelete,
  onOpenSidePanel,
}) => {
  // Get size classes based on image size setting
  const getSizeClasses = () => {
    const sizeInfo = IMAGE_SIZE_INFO[block.size || 'medium'];
    return sizeInfo?.cssClass || 'w-1/2 max-w-[400px]';
  };

  // Get placement classes
  const getPlacementClasses = () => {
    const sizeClass = getSizeClasses();
    
    switch (block.placement) {
      case 'full-width':
        return 'w-full my-4';
      case 'float-left':
        return `float-left mr-6 mb-4 ${sizeClass}`;
      case 'float-right':
        return `float-right ml-6 mb-4 ${sizeClass}`;
      case 'inline':
        return `inline-block mx-2 ${sizeClass} align-middle`;
      case 'center':
      default:
        return `mx-auto my-4 ${sizeClass}`;
    }
  };

  const isFloating = block.placement === 'float-left' || block.placement === 'float-right';

  return (
    <div
      className={`relative group ${getPlacementClasses()} ${!isFloating ? 'clear-both' : ''}`}
    >
      <div
        className={`relative overflow-hidden rounded-lg shadow-lg border-2 transition-all duration-200 cursor-pointer ${
          isSelected
            ? 'border-yellow-400 ring-2 ring-yellow-400/30'
            : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300'
        }`}
        onClick={onClick}
      >
        {/* Image */}
        <img
          src={block.imageUrl}
          alt={block.altText || block.caption || 'Chapter illustration'}
          className="w-full h-auto object-cover transition-transform hover:scale-[1.01]"
          loading="lazy"
        />
        
        {/* Overlay with controls - visible on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {/* Top controls */}
          <div className="absolute top-2 right-2 flex items-center gap-2">
            {/* Type badge */}
            <div className="px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs flex items-center gap-1">
              <span>{IMAGE_TYPE_INFO[block.imageType]?.icon || '🖼️'}</span>
              <span>{IMAGE_TYPE_INFO[block.imageType]?.name || 'Image'}</span>
            </div>
            
            {/* Size badge */}
            <div className="px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs">
              {IMAGE_SIZE_INFO[block.size || 'medium']?.name || 'Medium'}
            </div>
          </div>
          
          {/* Bottom controls */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenSidePanel();
                  }}
                  className="px-3 py-1.5 bg-white/90 hover:bg-white text-gray-900 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this image?')) {
                    onDelete();
                  }
                }}
                className="p-1.5 bg-red-500/90 hover:bg-red-600 rounded-lg transition-colors"
                title="Delete image"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 left-2">
            <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
      </div>
      
      {/* Caption */}
      {block.caption && (
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
          {block.caption}
        </p>
      )}
      
      {/* Click hint */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm">
          Click to edit
        </span>
      </div>
    </div>
  );
};
