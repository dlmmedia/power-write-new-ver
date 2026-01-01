'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { IMAGE_TYPE_INFO, BookImageType, ImagePlacement } from '@/lib/types/book-images';

interface ChapterImage {
  id: number;
  imageUrl: string;
  thumbnailUrl?: string;
  imageType: BookImageType;
  position: number;
  placement: ImagePlacement;
  caption?: string;
  altText?: string;
  prompt?: string;
  chapterId?: number;
}

interface ImageManagerProps {
  bookId: number;
  chapterId?: number;
  isOpen: boolean;
  onClose: () => void;
  onInsertImage: (position: number) => void;
  onImageClick?: (image: ChapterImage) => void;
  onImageDelete?: (imageId: number) => void;
  onImageUpdate?: (imageId: number, updates: Partial<ChapterImage>) => void;
}

export const ImageManager: React.FC<ImageManagerProps> = ({
  bookId,
  chapterId,
  isOpen,
  onClose,
  onInsertImage,
  onImageClick,
  onImageDelete,
  onImageUpdate,
}) => {
  const [images, setImages] = useState<ChapterImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ChapterImage | null>(null);
  const [editingCaption, setEditingCaption] = useState<number | null>(null);
  const [captionDraft, setCaptionDraft] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch images
  const fetchImages = useCallback(async () => {
    if (!bookId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/books/${bookId}/images`);
      const data = await response.json();
      
      if (data.success && data.images) {
        // Filter by chapter if specified
        let filteredImages = data.images;
        if (chapterId) {
          filteredImages = data.images.filter((img: ChapterImage) => 
            img.chapterId === chapterId
          );
        }
        setImages(filteredImages);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setIsLoading(false);
    }
  }, [bookId, chapterId]);

  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen, fetchImages]);

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const response = await fetch(`/api/books/${bookId}/images/${imageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setImages(images.filter(img => img.id !== imageId));
        if (selectedImage?.id === imageId) {
          setSelectedImage(null);
        }
        if (onImageDelete) {
          onImageDelete(imageId);
        }
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const handleUpdateCaption = async (imageId: number) => {
    try {
      const response = await fetch(`/api/books/${bookId}/images/${imageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: captionDraft }),
      });

      if (response.ok) {
        setImages(images.map(img => 
          img.id === imageId ? { ...img, caption: captionDraft } : img
        ));
        setEditingCaption(null);
        if (onImageUpdate) {
          onImageUpdate(imageId, { caption: captionDraft });
        }
      }
    } catch (error) {
      console.error('Error updating caption:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Chapter Images</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {images.length} image{images.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            title={viewMode === 'grid' ? 'List view' : 'Grid view'}
          >
            {viewMode === 'grid' ? '☰' : '▦'}
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Add Image Button */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <Button
          variant="primary"
          size="md"
          className="w-full"
          onClick={() => onInsertImage(0)}
        >
          ✨ Add New Image
        </Button>
      </div>

      {/* Image List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <span className="text-gray-500 dark:text-gray-400">Loading images...</span>
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 px-4">
            <span className="text-4xl mb-2">🖼️</span>
            <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
              No images yet. Add images to enhance your book.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-2 p-4">
            {images.map((image) => (
              <div
                key={image.id}
                className={`relative group rounded-lg overflow-hidden border-2 transition-colors cursor-pointer ${
                  selectedImage?.id === image.id
                    ? 'border-yellow-400'
                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => {
                  setSelectedImage(image);
                  if (onImageClick) onImageClick(image);
                }}
              >
                <img
                  src={image.thumbnailUrl || image.imageUrl}
                  alt={image.altText || 'Book image'}
                  className="w-full h-24 object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                  <div className="p-1 w-full bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-xs">
                        {IMAGE_TYPE_INFO[image.imageType]?.icon}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(image.id);
                        }}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {images.map((image) => (
              <div
                key={image.id}
                className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                  selectedImage?.id === image.id ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                }`}
                onClick={() => {
                  setSelectedImage(image);
                  if (onImageClick) onImageClick(image);
                }}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={image.thumbnailUrl || image.imageUrl}
                    alt={image.altText || 'Book image'}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{IMAGE_TYPE_INFO[image.imageType]?.icon}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {IMAGE_TYPE_INFO[image.imageType]?.name}
                      </span>
                    </div>
                    {editingCaption === image.id ? (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={captionDraft}
                          onChange={(e) => setCaptionDraft(e.target.value)}
                          className="flex-1 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateCaption(image.id);
                            if (e.key === 'Escape') setEditingCaption(null);
                          }}
                        />
                        <button
                          onClick={() => handleUpdateCaption(image.id)}
                          className="text-green-600 text-xs px-2"
                        >
                          ✓
                        </button>
                      </div>
                    ) : (
                      <p
                        className="text-xs text-gray-600 dark:text-gray-400 truncate cursor-text"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCaption(image.id);
                          setCaptionDraft(image.caption || '');
                        }}
                      >
                        {image.caption || 'Click to add caption'}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Pos: {image.position} | {image.placement}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(image.id);
                    }}
                    className="text-red-400 hover:text-red-600 dark:hover:text-red-300 p-1"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Image Details */}
      {selectedImage && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
          <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-2">
            Selected Image
          </h4>
          <img
            src={selectedImage.imageUrl}
            alt={selectedImage.altText || 'Selected image'}
            className="w-full h-32 object-contain rounded-lg bg-white dark:bg-gray-800 mb-2"
          />
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Type:</span>
              <span className="text-gray-900 dark:text-white">
                {IMAGE_TYPE_INFO[selectedImage.imageType]?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Placement:</span>
              <span className="text-gray-900 dark:text-white">{selectedImage.placement}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Position:</span>
              <span className="text-gray-900 dark:text-white">{selectedImage.position}</span>
            </div>
          </div>
          {selectedImage.prompt && (
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">Prompt:</span> {selectedImage.prompt.substring(0, 100)}...
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => window.open(selectedImage.imageUrl, '_blank')}
            >
              View Full Size
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300"
              onClick={() => handleDeleteImage(selectedImage.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Footer Help */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
        <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
          Click an image to view details • Drag to reorder
        </p>
      </div>
    </div>
  );
};
