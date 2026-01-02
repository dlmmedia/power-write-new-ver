'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { IMAGE_TYPE_INFO, IMAGE_SIZE_INFO, BookImageType, ImagePlacement, ImageSize } from '@/lib/types/book-images';

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
  metadata?: {
    size?: ImageSize;
    paragraphIndex?: number;
    [key: string]: unknown;
  };
}

interface ImageManagerProps {
  bookId: number;
  chapterId?: number;
  chapterContent?: string;  // Content to extract paragraphs from
  isOpen: boolean;
  onClose: () => void;
  onInsertImage: (position: number) => void;
  onImageClick?: (image: ChapterImage) => void;
  onImageDelete?: (imageId: number) => void;
  onImageUpdate?: (imageId: number, updates: Partial<ChapterImage>) => void;
  onImagesChanged?: () => void;  // Callback when images are modified
}

export const ImageManager: React.FC<ImageManagerProps> = ({
  bookId,
  chapterId,
  chapterContent = '',
  isOpen,
  onClose,
  onInsertImage,
  onImageClick,
  onImageDelete,
  onImageUpdate,
  onImagesChanged,
}) => {
  const [images, setImages] = useState<ChapterImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ChapterImage | null>(null);
  const [editingCaption, setEditingCaption] = useState<number | null>(null);
  const [captionDraft, setCaptionDraft] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showPlacementModal, setShowPlacementModal] = useState<number | null>(null);

  // Parse paragraphs from chapter content
  const paragraphs = useMemo(() => {
    if (!chapterContent) return [];
    // Split by double newlines or single newlines for paragraph detection
    return chapterContent
      .split(/\n\n+|\n(?=[A-Z])/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }, [chapterContent]);

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
        if (onImagesChanged) onImagesChanged();
      }
    } catch (error) {
      console.error('Error updating caption:', error);
    }
  };

  // Handle updating image size
  const handleUpdateSize = async (imageId: number, size: ImageSize) => {
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    const newMetadata = { ...image.metadata, size };
    
    try {
      const response = await fetch(`/api/books/${bookId}/images/${imageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata: newMetadata }),
      });

      if (response.ok) {
        setImages(images.map(img => 
          img.id === imageId ? { ...img, metadata: newMetadata } : img
        ));
        if (selectedImage?.id === imageId) {
          setSelectedImage({ ...selectedImage, metadata: newMetadata });
        }
        if (onImagesChanged) onImagesChanged();
      }
    } catch (error) {
      console.error('Error updating image size:', error);
    }
  };

  // Handle updating image placement position (paragraph-based)
  const handleUpdateParagraphPosition = async (imageId: number, paragraphIndex: number) => {
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    // Calculate character position based on paragraph index
    let position = 0;
    for (let i = 0; i <= paragraphIndex && i < paragraphs.length; i++) {
      position += paragraphs[i].length + 2; // +2 for newlines
    }

    const newMetadata = { ...image.metadata, paragraphIndex };
    
    try {
      const response = await fetch(`/api/books/${bookId}/images/${imageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position, metadata: newMetadata }),
      });

      if (response.ok) {
        const updatedImage = { ...image, position, metadata: newMetadata };
        const newImages = images.map(img => 
          img.id === imageId ? updatedImage : img
        ).sort((a, b) => a.position - b.position);
        
        setImages(newImages);
        if (selectedImage?.id === imageId) {
          setSelectedImage(updatedImage);
        }
        setShowPlacementModal(null);
        if (onImagesChanged) onImagesChanged();
      }
    } catch (error) {
      console.error('Error updating image position:', error);
    }
  };

  // Handle updating image placement style
  const handleUpdatePlacement = async (imageId: number, placement: ImagePlacement) => {
    try {
      const response = await fetch(`/api/books/${bookId}/images/${imageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placement }),
      });

      if (response.ok) {
        setImages(images.map(img => 
          img.id === imageId ? { ...img, placement } : img
        ));
        if (selectedImage?.id === imageId) {
          setSelectedImage({ ...selectedImage, placement });
        }
        if (onImagesChanged) onImagesChanged();
      }
    } catch (error) {
      console.error('Error updating placement:', error);
    }
  };

  // Get paragraph preview text
  const getParagraphPreview = (index: number, maxLength = 60) => {
    if (index < 0 || index >= paragraphs.length) return '';
    const para = paragraphs[index];
    if (para.length <= maxLength) return para;
    return para.substring(0, maxLength) + '...';
  };

  // Find which paragraph an image is currently placed after
  const getImageParagraphIndex = (image: ChapterImage): number => {
    if (image.metadata?.paragraphIndex !== undefined) {
      return image.metadata.paragraphIndex;
    }
    // Calculate based on position
    let charCount = 0;
    for (let i = 0; i < paragraphs.length; i++) {
      charCount += paragraphs[i].length + 2;
      if (charCount >= image.position) return i;
    }
    return paragraphs.length - 1;
  };

  // Handle moving images up/down (swap positions)
  const handleMoveImage = async (imageId: number, direction: 'up' | 'down') => {
    const currentIndex = images.findIndex(img => img.id === imageId);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Check bounds
    if (targetIndex < 0 || targetIndex >= images.length) return;
    
    const currentImage = images[currentIndex];
    const targetImage = images[targetIndex];
    
    // Swap positions in local state first for immediate feedback
    const newImages = [...images];
    const tempPosition = currentImage.position;
    newImages[currentIndex] = { ...currentImage, position: targetImage.position };
    newImages[targetIndex] = { ...targetImage, position: tempPosition };
    
    // Sort by position
    newImages.sort((a, b) => a.position - b.position);
    setImages(newImages);
    
    // Update in database
    try {
      const response = await fetch(`/api/books/${bookId}/images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: [
            { id: currentImage.id, position: targetImage.position },
            { id: targetImage.id, position: tempPosition },
          ],
        }),
      });

      if (!response.ok) {
        console.error('Failed to update image positions');
        // Revert on failure
        fetchImages();
      } else {
        // Notify parent component
        if (onImageUpdate) {
          onImageUpdate(currentImage.id, { position: targetImage.position });
          onImageUpdate(targetImage.id, { position: tempPosition });
        }
      }
    } catch (error) {
      console.error('Error updating image positions:', error);
      // Revert on failure
      fetchImages();
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
            {images.map((image, index) => (
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
                  {/* Move up/down buttons */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveImage(image.id, 'up');
                      }}
                      disabled={index === 0}
                      className={`p-1 rounded text-xs transition-colors ${
                        index === 0
                          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          : 'text-gray-500 hover:text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                      }`}
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveImage(image.id, 'down');
                      }}
                      disabled={index === images.length - 1}
                      className={`p-1 rounded text-xs transition-colors ${
                        index === images.length - 1
                          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          : 'text-gray-500 hover:text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                      }`}
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>
                  
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
                      <span className="text-xs text-gray-400">#{index + 1}</span>
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
                    {/* Size selector */}
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-gray-500">Size:</span>
                      <select
                        value={image.metadata?.size || 'medium'}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleUpdateSize(image.id, e.target.value as ImageSize);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      >
                        {Object.entries(IMAGE_SIZE_INFO).map(([key, info]) => (
                          <option key={key} value={key}>{info.name}</option>
                        ))}
                      </select>
                    </div>
                    {/* Placement info */}
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-gray-500">After paragraph:</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPlacementModal(image.id);
                        }}
                        className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline"
                      >
                        #{getImageParagraphIndex(image) + 1} (change)
                      </button>
                    </div>
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
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50 max-h-[50vh] overflow-y-auto">
          <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-2">
            Selected Image
          </h4>
          <img
            src={selectedImage.imageUrl}
            alt={selectedImage.altText || 'Selected image'}
            className="w-full h-32 object-contain rounded-lg bg-white dark:bg-gray-800 mb-3"
          />
          
          {/* Size Control */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Image Size
            </label>
            <div className="grid grid-cols-4 gap-1">
              {(Object.entries(IMAGE_SIZE_INFO) as [ImageSize, typeof IMAGE_SIZE_INFO[ImageSize]][]).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => handleUpdateSize(selectedImage.id, key)}
                  className={`text-xs py-1.5 px-2 rounded border transition-colors ${
                    (selectedImage.metadata?.size || 'medium') === key
                      ? 'bg-yellow-400 border-yellow-500 text-gray-900 font-medium'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-yellow-400'
                  }`}
                  title={info.description}
                >
                  {info.name}
                </button>
              ))}
            </div>
          </div>

          {/* Placement Style */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Alignment
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['center', 'float-left', 'float-right'] as ImagePlacement[]).map((placement) => (
                <button
                  key={placement}
                  onClick={() => handleUpdatePlacement(selectedImage.id, placement)}
                  className={`text-xs py-1.5 px-2 rounded border transition-colors ${
                    selectedImage.placement === placement
                      ? 'bg-yellow-400 border-yellow-500 text-gray-900 font-medium'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-yellow-400'
                  }`}
                >
                  {placement === 'center' ? '⬜ Center' : placement === 'float-left' ? '⬅ Left' : '➡ Right'}
                </button>
              ))}
            </div>
          </div>

          {/* Position Control */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Position in Chapter
            </label>
            <button
              onClick={() => setShowPlacementModal(selectedImage.id)}
              className="w-full text-left text-xs py-2 px-3 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-yellow-400 transition-colors"
            >
              <div className="flex justify-between items-center">
                <span>After paragraph #{getImageParagraphIndex(selectedImage) + 1}</span>
                <span className="text-yellow-600">Change →</span>
              </div>
              <p className="text-gray-500 dark:text-gray-500 mt-1 truncate">
                "{getParagraphPreview(getImageParagraphIndex(selectedImage), 40)}"
              </p>
            </button>
          </div>

          <div className="space-y-1 text-xs border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Type:</span>
              <span className="text-gray-900 dark:text-white">
                {IMAGE_TYPE_INFO[selectedImage.imageType]?.name}
              </span>
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
          Click an image to select • Resize & position using controls below
        </p>
      </div>

      {/* Paragraph Placement Modal */}
      {showPlacementModal !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[90vw] max-w-lg max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Place Image After Paragraph
                </h3>
                <button
                  onClick={() => setShowPlacementModal(null)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xl"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Select which paragraph the image should appear after
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {/* Start of chapter option */}
              <button
                onClick={() => {
                  // Position at very start (position 0)
                  const image = images.find(img => img.id === showPlacementModal);
                  if (image) {
                    handleUpdateParagraphPosition(showPlacementModal, -1);
                  }
                }}
                className={`w-full text-left p-3 rounded-lg mb-2 border-2 transition-colors ${
                  getImageParagraphIndex(images.find(img => img.id === showPlacementModal) || images[0]) === -1
                    ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
                    📍
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Start of Chapter
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Image appears before all text
                    </p>
                  </div>
                </div>
              </button>

              {paragraphs.map((para, index) => {
                const currentImage = images.find(img => img.id === showPlacementModal);
                const isSelected = currentImage && getImageParagraphIndex(currentImage) === index;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleUpdateParagraphPosition(showPlacementModal, index)}
                    className={`w-full text-left p-3 rounded-lg mb-2 border-2 transition-colors ${
                      isSelected
                        ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          {para.substring(0, 150)}{para.length > 150 ? '...' : ''}
                        </p>
                        {isSelected && (
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-medium">
                            ✓ Image currently placed here
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              {paragraphs.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p className="text-4xl mb-2">📝</p>
                  <p>No paragraphs detected in this chapter.</p>
                  <p className="text-sm mt-1">Add some content to position images.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowPlacementModal(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
