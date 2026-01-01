'use client';

import React, { useMemo } from 'react';
import { BookImageType, ImagePlacement, IMAGE_TYPE_INFO } from '@/lib/types/book-images';

interface ChapterImage {
  id: number;
  imageUrl: string;
  thumbnailUrl?: string;
  imageType: BookImageType;
  position: number;
  placement: ImagePlacement;
  caption?: string;
  altText?: string;
  chapterId?: number;
}

interface ContentWithImagesProps {
  content: string;
  images: ChapterImage[];
  fontSize?: 'sm' | 'base' | 'lg' | 'xl';
  onImageClick?: (image: ChapterImage) => void;
  onImageDelete?: (imageId: number) => void;
  isEditing?: boolean;
}

/**
 * Renders chapter content with images inline at their correct positions.
 * Images are positioned based on their stored position (character offset in content).
 */
export const ContentWithImages: React.FC<ContentWithImagesProps> = ({
  content,
  images,
  fontSize = 'base',
  onImageClick,
  onImageDelete,
  isEditing = false,
}) => {
  const fontSizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  // Sort images by position to render them in order
  const sortedImages = useMemo(() => {
    console.log('[ContentWithImages] Received images:', images.length, images);
    return [...images].sort((a, b) => a.position - b.position);
  }, [images]);

  // Get placement classes for different image placements
  const getPlacementClasses = (placement: ImagePlacement) => {
    switch (placement) {
      case 'full-width':
        return 'w-full my-6';
      case 'float-left':
        return 'float-left mr-6 mb-4 w-1/3 max-w-xs';
      case 'float-right':
        return 'float-right ml-6 mb-4 w-1/3 max-w-xs';
      case 'inline':
        return 'inline-block mx-2 max-w-sm align-middle';
      case 'center':
      default:
        return 'mx-auto my-6 max-w-2xl';
    }
  };

  // Render an image with proper styling
  const renderImage = (image: ChapterImage, index: number) => {
    const placementClasses = getPlacementClasses(image.placement);
    
    return (
      <div
        key={`img-${image.id}-${index}`}
        className={`relative group ${placementClasses} clear-both`}
        onClick={() => onImageClick?.(image)}
      >
        <div className="relative overflow-hidden rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <img
            src={image.imageUrl}
            alt={image.altText || image.caption || 'Chapter illustration'}
            className="w-full h-auto object-cover cursor-pointer transition-transform hover:scale-[1.02]"
            loading="lazy"
          />
          
          {/* Image overlay with info */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{IMAGE_TYPE_INFO[image.imageType]?.icon || '🖼️'}</span>
                  <span className="text-sm font-medium">
                    {IMAGE_TYPE_INFO[image.imageType]?.name || 'Image'}
                  </span>
                </div>
                {isEditing && onImageDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this image?')) {
                        onImageDelete(image.id);
                      }
                    }}
                    className="p-1.5 bg-red-500/80 hover:bg-red-600 rounded-full transition-colors"
                    title="Delete image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Caption */}
        {image.caption && (
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
            {image.caption}
          </p>
        )}
      </div>
    );
  };

  // Split content into segments based on image positions
  const renderContentWithImages = () => {
    if (sortedImages.length === 0) {
      // No images, just render content as paragraphs
      return (
        <div className={`${fontSizeClasses[fontSize]} leading-relaxed font-serif whitespace-pre-wrap`}>
          {content}
        </div>
      );
    }

    const segments: React.ReactNode[] = [];
    let lastPosition = 0;

    sortedImages.forEach((image, index) => {
      // Skip images with invalid positions
      const position = Math.min(image.position, content.length);
      
      // Add text segment before this image
      if (position > lastPosition) {
        const textSegment = content.substring(lastPosition, position);
        if (textSegment.trim()) {
          segments.push(
            <div 
              key={`text-${index}`} 
              className={`${fontSizeClasses[fontSize]} leading-relaxed font-serif whitespace-pre-wrap`}
            >
              {textSegment}
            </div>
          );
        }
      }
      
      // Add the image
      segments.push(renderImage(image, index));
      
      lastPosition = position;
    });

    // Add remaining text after last image
    if (lastPosition < content.length) {
      const remainingText = content.substring(lastPosition);
      if (remainingText.trim()) {
        segments.push(
          <div 
            key="text-final" 
            className={`${fontSizeClasses[fontSize]} leading-relaxed font-serif whitespace-pre-wrap`}
          >
            {remainingText}
          </div>
        );
      }
    }

    return segments;
  };

  return (
    <div className="content-with-images">
      {renderContentWithImages()}
      
      {/* Clear floats at the end */}
      <div className="clear-both" />
    </div>
  );
};

/**
 * Compact image preview strip for the editor toolbar area
 */
export const ImagePreviewStrip: React.FC<{
  images: ChapterImage[];
  onImageClick?: (image: ChapterImage) => void;
  onAddImage?: () => void;
}> = ({ images, onImageClick, onAddImage }) => {
  console.log('[ImagePreviewStrip] Rendering with', images.length, 'images');
  
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg overflow-x-auto">
      {images.length === 0 && (
        <span className="text-sm text-gray-500 dark:text-gray-400 px-2">
          No images in this chapter yet
        </span>
      )}
      {images.map((image) => (
        <button
          key={image.id}
          onClick={() => onImageClick?.(image)}
          className="relative flex-shrink-0 group"
          title={image.caption || 'Chapter image'}
        >
          <img
            src={image.thumbnailUrl || image.imageUrl}
            alt={image.altText || 'Preview'}
            className="w-12 h-12 object-cover rounded border-2 border-transparent hover:border-yellow-400 transition-colors"
          />
          <div className="absolute bottom-0 right-0 bg-black/60 text-white text-xs px-1 rounded-tl">
            {IMAGE_TYPE_INFO[image.imageType]?.icon || '🖼️'}
          </div>
        </button>
      ))}
      {onAddImage && (
        <button
          onClick={onAddImage}
          className="flex-shrink-0 w-12 h-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center text-gray-400 hover:border-yellow-400 hover:text-yellow-500 transition-colors"
          title="Add image"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </div>
  );
};
