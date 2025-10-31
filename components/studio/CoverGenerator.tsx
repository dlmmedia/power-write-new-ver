'use client';

import { useState } from 'react';
import { CoverDesignOptions, GENRE_COVER_DEFAULTS } from '@/lib/types/cover';
import { CoverService } from '@/lib/services/cover-service';

interface CoverGeneratorProps {
  bookId?: number;
  title: string;
  author: string;
  genre: string;
  description: string;
  targetAudience: string;
  themes?: string[];
  currentCoverUrl?: string;
  onCoverGenerated: (coverUrl: string, metadata: any) => void;
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
  onCoverGenerated,
}: CoverGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | undefined>(currentCoverUrl);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'cover' | 'mockup'>('cover');
  
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

  const handleStyleChange = (style: CoverDesignOptions['style']) => {
    setDesignOptions(prev => ({ ...prev, style }));
  };

  const handleColorSchemeChange = (colorScheme: CoverDesignOptions['colorScheme']) => {
    setDesignOptions(prev => ({ ...prev, colorScheme }));
  };

  const handleMethodChange = (method: 'ai' | 'template' | 'hybrid') => {
    setDesignOptions(prev => ({ ...prev, generationMethod: method }));
  };

  // Generate preview SVG for when no cover exists
  const previewDataUrl = CoverService.generatePreviewDataURL(
    title || 'Book Title',
    author || 'Author Name',
    '#1a1a1a',
    '#ffffff'
  );

  return (
    <div className="space-y-6">
      {/* Cover Preview */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Book Cover</h3>
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
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt="Book cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={previewDataUrl}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          ) : (
            // 3D mockup view
            <div className="relative" style={{ perspective: '1000px' }}>
              <div
                className="w-64 h-96 bg-gray-800 rounded shadow-2xl"
                style={{
                  transform: 'rotateY(-15deg) rotateX(5deg)',
                  transformStyle: 'preserve-3d',
                }}
              >
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt="Book cover"
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <img
                    src={previewDataUrl}
                    alt="Cover preview"
                    className="w-full h-full object-cover rounded"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Design Options */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Design Options</h3>
        
        <div className="space-y-4">
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
              {designOptions.generationMethod === 'ai' && 'Full AI image generation using DALL-E 3'}
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

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Generate Button */}
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
            Generating Cover...
          </span>
        ) : coverUrl ? (
          'Regenerate Cover'
        ) : (
          'Generate Cover'
        )}
      </button>

      {coverUrl && (
        <div className="flex gap-2">
          <button
            onClick={() => {
              // Download cover
              const link = document.createElement('a');
              link.href = coverUrl;
              link.download = `${title.replace(/[^a-z0-9]/gi, '_')}_cover.png`;
              link.click();
            }}
            className="flex-1 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
          >
            Download Cover
          </button>
        </div>
      )}
    </div>
  );
}
