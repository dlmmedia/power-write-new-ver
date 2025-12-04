'use client';

import { useState, useRef } from 'react';
import { CoverDesignOptions, GENRE_COVER_DEFAULTS } from '@/lib/types/cover';
import { CoverService } from '@/lib/services/cover-service';
import { IMAGE_MODELS, DEFAULT_IMAGE_MODEL } from '@/lib/types/models';

interface CoverGeneratorProps {
  bookId?: number;
  title: string;
  author: string;
  genre: string;
  description: string;
  targetAudience: string;
  themes?: string[];
  currentCoverUrl?: string;
  currentBackCoverUrl?: string;
  onCoverGenerated: (coverUrl: string, metadata: any) => void;
  onBackCoverGenerated?: (backCoverUrl: string, metadata: any) => void;
}

export default function CoverGenerator({
  bookId,
  title,
  author,
  genre,
  description,
  targetAudience,
  themes = [],
  currentCoverUrl,
  currentBackCoverUrl,
  onCoverGenerated,
  onBackCoverGenerated,
}: CoverGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingBack, setIsGeneratingBack] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | undefined>(currentCoverUrl);
  const [backCoverUrl, setBackCoverUrl] = useState<string | undefined>(currentBackCoverUrl);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'cover' | 'mockup'>('cover');
  const [coverType, setCoverType] = useState<'front' | 'back'>('front');
  const [imageModel, setImageModel] = useState(DEFAULT_IMAGE_MODEL);
  const [coverMode, setCoverMode] = useState<'generate' | 'upload'>('generate');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Design customization state
  const genreDefaults = GENRE_COVER_DEFAULTS[genre] || GENRE_COVER_DEFAULTS['Literary Fiction'];
  const [designOptions, setDesignOptions] = useState<Partial<CoverDesignOptions>>({
    style: genreDefaults.style,
    colorScheme: genreDefaults.colorScheme,
    generationMethod: 'ai',
  });

  const handleGenerateCover = async () => {
    if (!title || !author || !description) {
      setError('Please fill in title, author, and description first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Get demo user ID (or real user ID in production)
      const userId = 'demo_user'; // TODO: Get from auth context

      const response = await fetch('/api/generate/cover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          bookId,
          title,
          author,
          genre,
          description,
          targetAudience,
          themes,
          designOptions,
          imageModel,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to generate cover');
      }

      if (data.coverUrl) {
        setCoverUrl(data.coverUrl);
        onCoverGenerated(data.coverUrl, data.metadata);
      } else {
        throw new Error('No cover URL returned');
      }
    } catch (err) {
      console.error('Cover generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate cover');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateBackCover = async () => {
    if (!title || !description) {
      setError('Please fill in title and description first');
      return;
    }

    setIsGeneratingBack(true);
    setError(null);

    try {
      const userId = 'demo_user';

      const response = await fetch('/api/generate/back-cover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          bookId,
          title,
          author,
          genre,
          description,
          style: designOptions.style || 'photographic',
          imageModel,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to generate back cover');
      }

      if (data.coverUrl) {
        setBackCoverUrl(data.coverUrl);
        onBackCoverGenerated?.(data.coverUrl, data.metadata);
      } else {
        throw new Error('No back cover URL returned');
      }
    } catch (err) {
      console.error('Back cover generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate back cover');
    } finally {
      setIsGeneratingBack(false);
    }
  };

  const handleStyleChange = (style: CoverDesignOptions['style']) => {
    setDesignOptions(prev => ({ ...prev, style }));
  };

  const handleColorSchemeChange = (colorScheme: CoverDesignOptions['colorScheme']) => {
    setDesignOptions(prev => ({ ...prev, colorScheme }));
  };

  const handleMethodChange = (method: 'ai' | 'template' | 'hybrid') => {
    setDesignOptions(prev => ({ ...prev, generationMethod: method }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, WebP, or GIF image.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      if (!bookId) {
        // If no bookId, just show preview (for studio before book is created)
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          setCoverUrl(dataUrl);
          onCoverGenerated(dataUrl, { source: 'upload', fileName: file.name });
        };
        reader.readAsDataURL(file);
        setIsUploading(false);
        return;
      }

      // Upload to server
      const formData = new FormData();
      formData.append('cover', file);

      const response = await fetch(`/api/books/${bookId}/cover/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to upload cover');
      }

      if (data.coverUrl) {
        setCoverUrl(data.coverUrl);
        onCoverGenerated(data.coverUrl, { source: 'upload', fileName: file.name });
      } else {
        throw new Error('No cover URL returned');
      }
    } catch (err) {
      console.error('Cover upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload cover');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Create a synthetic event to reuse the file select handler
    const input = fileInputRef.current;
    if (input) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      
      // Trigger change event manually
      const event = new Event('change', { bubbles: true });
      input.dispatchEvent(event);
      handleFileSelect({ target: input } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  // Generate preview SVG for when no cover exists
  const previewDataUrl = CoverService.generatePreviewDataURL(
    title || 'Book Title',
    author || 'Author Name',
    '#1a1a1a',
    '#ffffff'
  );

  // Generate back cover preview SVG
  const backCoverPreviewDataUrl = CoverService.generateBackCoverPreviewDataURL(
    title || 'Book Title',
    description || 'Your book description will appear here...',
    '#1a1a1a',
    '#ffffff'
  );

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCoverMode('generate')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              coverMode === 'generate'
                ? 'bg-yellow-400 text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            🤖 Generate with AI
          </button>
          <button
            onClick={() => setCoverMode('upload')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              coverMode === 'upload'
                ? 'bg-yellow-400 text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            📤 Upload Your Own
          </button>
        </div>
      </div>

      {/* Cover Type Toggle */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCoverType('front')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all text-sm ${
              coverType === 'front'
                ? 'bg-yellow-400 text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            📖 Front Cover
          </button>
          <button
            onClick={() => setCoverType('back')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all text-sm ${
              coverType === 'back'
                ? 'bg-yellow-400 text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            📄 Back Cover
          </button>
        </div>
      </div>

      {/* Cover Preview */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            {coverType === 'front' ? 'Front Cover' : 'Back Cover'}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setPreviewMode('cover')}
              className={`px-3 py-1 text-sm rounded ${
                previewMode === 'cover'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Cover
            </button>
            <button
              onClick={() => setPreviewMode('mockup')}
              className={`px-3 py-1 text-sm rounded ${
                previewMode === 'mockup'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              3D Mockup
            </button>
          </div>
        </div>

        <div className="flex justify-center">
          {previewMode === 'cover' ? (
            <div className="relative w-64 h-96 bg-gray-800 rounded shadow-2xl overflow-hidden">
              {coverType === 'front' ? (
                coverUrl ? (
                  <img
                    src={coverUrl}
                    alt="Front cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={previewDataUrl}
                    alt="Front cover preview"
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                backCoverUrl ? (
                  <img
                    src={backCoverUrl}
                    alt="Back cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={backCoverPreviewDataUrl}
                    alt="Back cover preview"
                    className="w-full h-full object-cover"
                  />
                )
              )}
            </div>
          ) : (
            // 3D mockup view
            <div className="relative" style={{ perspective: '1000px' }}>
              <div
                className="w-64 h-96 bg-gray-800 rounded shadow-2xl"
                style={{
                  transform: coverType === 'front' ? 'rotateY(-15deg) rotateX(5deg)' : 'rotateY(15deg) rotateX(5deg)',
                  transformStyle: 'preserve-3d',
                }}
              >
                {coverType === 'front' ? (
                  coverUrl ? (
                    <img
                      src={coverUrl}
                      alt="Front cover"
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <img
                      src={previewDataUrl}
                      alt="Front cover preview"
                      className="w-full h-full object-cover rounded"
                    />
                  )
                ) : (
                  backCoverUrl ? (
                    <img
                      src={backCoverUrl}
                      alt="Back cover"
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <img
                      src={backCoverPreviewDataUrl}
                      alt="Back cover preview"
                      className="w-full h-full object-cover rounded"
                    />
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Design Options / Upload Area */}
      {coverMode === 'generate' ? (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Design Options</h3>
          
          <div className="space-y-4">
            {/* Image Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Image AI Model
              </label>
              <div className="grid grid-cols-1 gap-2">
                {IMAGE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setImageModel(model.id)}
                    className={`px-4 py-3 rounded text-left transition-all ${
                      imageModel === model.id
                        ? 'bg-yellow-400 text-black ring-2 ring-yellow-300'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{model.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        model.tier === 'premium' 
                          ? 'bg-yellow-500/20 text-yellow-400' 
                          : 'bg-gray-600 text-gray-300'
                      }`}>
                        {model.tier === 'premium' ? '⭐ Premium' : 'Standard'}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${imageModel === model.id ? 'text-black/70' : 'text-gray-500'}`}>
                      {model.description}
                    </p>
                    <div className={`flex gap-2 mt-1 text-xs ${imageModel === model.id ? 'text-black/60' : 'text-gray-600'}`}>
                      <span>Max: {model.maxResolution}</span>
                      {model.capabilities.textRendering && <span>• Text OK</span>}
                      {model.capabilities.highResolution && <span>• 4K</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generation Method */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Generation Method
              </label>
              <div className="flex gap-2">
                {(['ai', 'template', 'hybrid'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => handleMethodChange(method)}
                    className={`px-4 py-2 rounded text-sm font-medium ${
                      designOptions.generationMethod === method
                        ? 'bg-yellow-400 text-black'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {method === 'ai' && '🤖 AI Generated'}
                    {method === 'template' && '📐 Template'}
                    {method === 'hybrid' && '✨ Hybrid'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {designOptions.generationMethod === 'ai' && `Full AI image generation using ${IMAGE_MODELS.find(m => m.id === imageModel)?.name || 'selected model'}`}
                {designOptions.generationMethod === 'template' && 'Professional templates with custom text'}
                {designOptions.generationMethod === 'hybrid' && 'AI background with styled typography overlay'}
              </p>
            </div>

            {/* Cover Style */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cover Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['minimalist', 'illustrative', 'photographic', 'abstract', 'typographic'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => handleStyleChange(style)}
                    className={`px-3 py-2 rounded text-sm capitalize ${
                      designOptions.style === style
                        ? 'bg-yellow-400 text-black'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Scheme */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Color Scheme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['warm', 'cool', 'monochrome', 'vibrant', 'pastel', 'dark'] as const).map((scheme) => (
                  <button
                    key={scheme}
                    onClick={() => handleColorSchemeChange(scheme)}
                    className={`px-3 py-2 rounded text-sm capitalize ${
                      designOptions.colorScheme === scheme
                        ? 'bg-yellow-400 text-black'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {scheme}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Upload Your Cover</h3>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-yellow-400 hover:bg-gray-800/50 transition-all"
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin h-10 w-10 text-yellow-400" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <p className="text-gray-400">Uploading cover...</p>
              </div>
            ) : (
              <>
                <div className="text-5xl mb-4">📤</div>
                <p className="text-gray-300 font-medium mb-2">
                  Drop your cover image here
                </p>
                <p className="text-gray-500 text-sm mb-4">
                  or click to browse files
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Supported formats: JPEG, PNG, WebP, GIF</p>
                  <p>Maximum size: 5MB</p>
                  <p>Recommended: 1024×1536px (portrait, 2:3 ratio)</p>
                </div>
              </>
            )}
          </div>

          {/* Upload Tips */}
          <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-300 mb-2">📝 Tips for best results:</h4>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Use high-resolution images (at least 600×900px)</li>
              <li>• Portrait orientation works best for book covers</li>
              <li>• Ensure text is readable and well-contrasted</li>
              <li>• Keep important elements away from edges</li>
            </ul>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-400/70 text-xs mt-2 hover:text-red-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Generate / Upload Button */}
      {coverMode === 'generate' ? (
        coverType === 'front' ? (
          <button
            onClick={handleGenerateCover}
            disabled={isGenerating || !title || !author}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              isGenerating || !title || !author
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-yellow-400 text-black hover:bg-yellow-500'
            }`}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating Front Cover...
              </span>
            ) : coverUrl ? (
              '🔄 Regenerate Front Cover'
            ) : (
              '✨ Generate Front Cover'
            )}
          </button>
        ) : (
          <button
            onClick={handleGenerateBackCover}
            disabled={isGeneratingBack || !title || !description}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              isGeneratingBack || !title || !description
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-yellow-400 text-black hover:bg-yellow-500'
            }`}
          >
            {isGeneratingBack ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating Back Cover...
              </span>
            ) : backCoverUrl ? (
              '🔄 Regenerate Back Cover'
            ) : (
              '✨ Generate Back Cover'
            )}
          </button>
        )
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={`w-full py-3 rounded-lg font-semibold transition-colors ${
            isUploading
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-yellow-400 text-black hover:bg-yellow-500'
          }`}
        >
          {isUploading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Uploading...
            </span>
          ) : coverUrl ? (
            '📤 Upload New Cover'
          ) : (
            '📤 Select File to Upload'
          )}
        </button>
      )}

      {/* Download buttons for both covers */}
      {(coverUrl || backCoverUrl) && (
        <div className="flex flex-col gap-2">
          {coverUrl && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = coverUrl;
                  link.download = `${title.replace(/[^a-z0-9]/gi, '_')}_front_cover.png`;
                  link.click();
                }}
                className="flex-1 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
              >
                ⬇️ Download Front Cover
              </button>
            </div>
          )}
          {backCoverUrl && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = backCoverUrl;
                  link.download = `${title.replace(/[^a-z0-9]/gi, '_')}_back_cover.png`;
                  link.click();
                }}
                className="flex-1 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
              >
                ⬇️ Download Back Cover
              </button>
            </div>
          )}
          {coverMode === 'generate' && (
            <button
              onClick={() => setCoverMode('upload')}
              className="py-2 px-4 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 text-sm font-medium"
            >
              Replace with Upload
            </button>
          )}
        </div>
      )}
    </div>
  );
}
