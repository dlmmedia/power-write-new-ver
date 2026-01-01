'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  BookImageType,
  ImageStyle,
  ImagePlacement,
  IMAGE_TYPE_INFO,
  IMAGE_STYLE_INFO,
  GENRE_IMAGE_STYLES,
} from '@/lib/types/book-images';

interface ImageInsertModalProps {
  bookId: number;
  chapterId: number;
  bookTitle: string;
  bookGenre: string;
  chapterTitle: string;
  chapterContent: string;
  cursorPosition: number;
  onClose: () => void;
  onImageGenerated: (image: {
    imageUrl: string;
    caption?: string;
    altText?: string;
    imageType: BookImageType;
    placement: ImagePlacement;
    position: number;
    prompt?: string;
  }) => void;
}

export const ImageInsertModal: React.FC<ImageInsertModalProps> = ({
  bookId,
  chapterId,
  bookTitle,
  bookGenre,
  chapterTitle,
  chapterContent,
  cursorPosition,
  onClose,
  onImageGenerated,
}) => {
  const [mode, setMode] = useState<'generate' | 'upload'>('generate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generation options
  const [imageType, setImageType] = useState<BookImageType>('illustration');
  const [style, setStyle] = useState<ImageStyle>('illustrated');
  const [placement, setPlacement] = useState<ImagePlacement>('center');
  const [customPrompt, setCustomPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3' | '1:1' | '3:2' | '2:3'>('16:9');

  // Upload mode
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');

  // Get recommended settings based on genre
  useEffect(() => {
    const genreConfig = GENRE_IMAGE_STYLES[bookGenre] || GENRE_IMAGE_STYLES['Fiction'];
    if (genreConfig) {
      setStyle(genreConfig.primary);
      if (genreConfig.recommendedTypes.length > 0) {
        setImageType(genreConfig.recommendedTypes[0]);
      }
    }
  }, [bookGenre]);

  // Get context around cursor for smart generation
  const getContextAroundCursor = () => {
    const contextLength = 300;
    const before = chapterContent.substring(Math.max(0, cursorPosition - contextLength), cursorPosition);
    const after = chapterContent.substring(cursorPosition, cursorPosition + contextLength);
    return { before, after };
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const { before, after } = getContextAroundCursor();

      const response = await fetch('/api/generate/book-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user', // TODO: Get actual user ID
          bookId,
          chapterId,
          bookTitle,
          bookGenre,
          chapterTitle,
          chapterContent: chapterContent.substring(0, 1000), // First 1000 chars for context
          imageType,
          style,
          customPrompt: customPrompt || undefined,
          contextBefore: before,
          contextAfter: after,
          placement,
          aspectRatio,
        }),
      });

      const data = await response.json();
      console.log('[ImageInsertModal] API response:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate image');
      }

      if (!data.imageUrl) {
        throw new Error('No image URL returned from API');
      }

      console.log('[ImageInsertModal] Calling onImageGenerated with:', {
        imageUrl: data.imageUrl,
        caption: data.caption,
        altText: data.altText,
        imageType,
        placement,
        position: cursorPosition,
      });

      onImageGenerated({
        imageUrl: data.imageUrl,
        caption: data.caption,
        altText: data.altText,
        imageType,
        placement,
        position: cursorPosition,
        prompt: data.prompt,
      });

      console.log('[ImageInsertModal] Image generated successfully, closing modal');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpload = () => {
    if (!uploadUrl) {
      setError('Please enter an image URL');
      return;
    }

    onImageGenerated({
      imageUrl: uploadUrl,
      caption: uploadCaption || undefined,
      altText: uploadCaption || 'Book image',
      imageType,
      placement,
      position: cursorPosition,
    });

    onClose();
  };

  const imageTypes: BookImageType[] = [
    'illustration',
    'scene',
    'diagram',
    'infographic',
    'chart',
    'photo',
    'concept',
  ];

  const styles: ImageStyle[] = [
    'illustrated',
    'realistic',
    'minimal',
    'modern',
    'vintage',
    'watercolor',
    'digital-art',
    'line-art',
    'technical',
  ];

  const placements: { value: ImagePlacement; label: string }[] = [
    { value: 'center', label: 'Centered' },
    { value: 'full-width', label: 'Full Width' },
    { value: 'float-left', label: 'Float Left' },
    { value: 'float-right', label: 'Float Right' },
    { value: 'inline', label: 'Inline' },
  ];

  const aspectRatios: { value: string; label: string }[] = [
    { value: '16:9', label: '16:9 (Wide)' },
    { value: '4:3', label: '4:3 (Classic)' },
    { value: '1:1', label: '1:1 (Square)' },
    { value: '3:2', label: '3:2 (Photo)' },
    { value: '2:3', label: '2:3 (Portrait)' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Insert Image</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add an image to Chapter: {chapterTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={() => setMode('generate')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                mode === 'generate'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              ✨ Generate with AI
            </button>
            <button
              onClick={() => setMode('upload')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                mode === 'upload'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              📎 Use URL
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg">
              {error}
            </div>
          )}

          {mode === 'generate' ? (
            <>
              {/* Image Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {imageTypes.map((type) => {
                    const info = IMAGE_TYPE_INFO[type];
                    return (
                      <button
                        key={type}
                        onClick={() => setImageType(type)}
                        className={`p-2 rounded-lg transition-colors text-left ${
                          imageType === type
                            ? 'bg-yellow-400 text-black'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="text-lg">{info.icon}</div>
                        <div className="text-xs font-medium mt-1">{info.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Visual Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {styles.map((s) => {
                    const info = IMAGE_STYLE_INFO[s];
                    return (
                      <button
                        key={s}
                        onClick={() => setStyle(s)}
                        className={`p-2 rounded-lg transition-colors text-left ${
                          style === s
                            ? 'bg-yellow-400 text-black'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="text-sm font-medium">{info.name}</div>
                        <div className="text-xs opacity-70">{info.description.substring(0, 30)}...</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Description (Optional)
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Describe what you want the image to show... Leave blank to auto-generate based on chapter content."
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  rows={3}
                />
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {aspectRatios.map((ratio) => (
                    <button
                      key={ratio.value}
                      onClick={() => setAspectRatio(ratio.value as any)}
                      className={`p-2 rounded-lg transition-colors text-center ${
                        aspectRatio === ratio.value
                          ? 'bg-yellow-400 text-black'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="text-sm font-medium">{ratio.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image URL
                </label>
                <Input
                  type="url"
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Caption (Optional)
                </label>
                <Input
                  type="text"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="Enter image caption..."
                />
              </div>

              {/* Image Type for uploaded */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {imageTypes.map((type) => {
                    const info = IMAGE_TYPE_INFO[type];
                    return (
                      <button
                        key={type}
                        onClick={() => setImageType(type)}
                        className={`p-2 rounded-lg transition-colors text-left ${
                          imageType === type
                            ? 'bg-yellow-400 text-black'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="text-lg">{info.icon}</div>
                        <div className="text-xs font-medium mt-1">{info.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Placement (for both modes) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Placement in Document
            </label>
            <div className="grid grid-cols-5 gap-2">
              {placements.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPlacement(p.value)}
                  className={`p-2 rounded-lg transition-colors text-center text-sm ${
                    placement === p.value
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Context Preview */}
          {mode === 'generate' && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content Context (Auto-detected)
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
                {chapterContent.substring(Math.max(0, cursorPosition - 100), cursorPosition + 100)}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          {mode === 'generate' ? (
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Generating...
                </>
              ) : (
                <>✨ Generate Image</>
              )}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={!uploadUrl}
            >
              📎 Insert Image
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
