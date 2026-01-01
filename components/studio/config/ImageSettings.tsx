'use client';

import { useStudioStore } from '@/lib/store/studio-store';
import {
  BookImageType,
  ImageStyle,
  AutoPlacementStrategy,
  ImagePlacement,
  IMAGE_TYPE_INFO,
  IMAGE_STYLE_INFO,
  getGenreImageDefaults,
  DEFAULT_IMAGE_CONFIG,
} from '@/lib/types/book-images';

export const ImageSettings: React.FC = () => {
  const { config, updateConfig } = useStudioStore();
  
  // Get current image config or defaults
  const imageConfig = config.bookImages || DEFAULT_IMAGE_CONFIG;

  // Update image config helper
  const updateImageConfig = (updates: Partial<typeof imageConfig>) => {
    updateConfig({
      bookImages: {
        ...imageConfig,
        ...updates,
      },
    });
  };

  // Apply genre defaults
  const applyGenreDefaults = () => {
    const genreDefaults = getGenreImageDefaults(config.basicInfo.genre);
    updateImageConfig(genreDefaults);
  };

  const imageTypes: BookImageType[] = [
    'illustration',
    'diagram',
    'infographic',
    'chart',
    'photo',
    'scene',
    'concept',
  ];

  const imageStyles: ImageStyle[] = [
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

  const placementStrategies: { value: AutoPlacementStrategy; label: string; desc: string }[] = [
    { value: 'none', label: 'Manual Only', desc: 'Add images manually in editor' },
    { value: 'chapter-start', label: 'Chapter Headers', desc: 'One image per chapter start' },
    { value: 'section-breaks', label: 'Section Breaks', desc: 'Images at scene/section breaks' },
    { value: 'key-concepts', label: 'Key Concepts', desc: 'When important ideas appear' },
    { value: 'smart', label: 'Smart AI', desc: 'AI analyzes and suggests placement' },
  ];

  const placements: { value: ImagePlacement; label: string }[] = [
    { value: 'center', label: 'Centered' },
    { value: 'full-width', label: 'Full Width' },
    { value: 'float-left', label: 'Float Left' },
    { value: 'float-right', label: 'Float Right' },
    { value: 'inline', label: 'Inline with Text' },
  ];

  const aspectRatios: { value: string; label: string; desc: string }[] = [
    { value: '16:9', label: '16:9', desc: 'Wide (landscape)' },
    { value: '4:3', label: '4:3', desc: 'Classic' },
    { value: '1:1', label: '1:1', desc: 'Square' },
    { value: '3:2', label: '3:2', desc: 'Standard' },
    { value: '2:3', label: '2:3', desc: 'Portrait' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Book Images</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Configure illustrations, diagrams, and other visual elements for your book
        </p>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Enable Book Images</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generate AI images automatically during book creation
          </p>
        </div>
        <button
          onClick={() => updateImageConfig({ enabled: !imageConfig.enabled })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            imageConfig.enabled ? 'bg-yellow-400' : 'bg-gray-400 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              imageConfig.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {imageConfig.enabled && (
        <>
          {/* Genre Defaults Button */}
          <button
            onClick={applyGenreDefaults}
            className="w-full px-4 py-2 bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 border border-yellow-400/50 rounded-lg hover:bg-yellow-400/30 transition-colors"
          >
            ✨ Apply Recommended Settings for {config.basicInfo.genre || 'Fiction'}
          </button>

          {/* Images Per Chapter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Images Per Chapter
            </label>
            <div className="grid grid-cols-6 gap-2">
              {[0, 1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => updateImageConfig({ imagesPerChapter: num })}
                  className={`px-4 py-3 rounded font-medium transition-colors ${
                    imageConfig.imagesPerChapter === num
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {imageConfig.imagesPerChapter === 0
                ? 'No automatic images (you can still add manually in editor)'
                : `Approximately ${imageConfig.imagesPerChapter * (config.content.numChapters || 10)} images total`}
            </p>
          </div>

          {/* Image Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preferred Image Types
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {imageTypes.map((type) => {
                const info = IMAGE_TYPE_INFO[type];
                const isSelected = imageConfig.preferredTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => {
                      const newTypes = isSelected
                        ? imageConfig.preferredTypes.filter((t) => t !== type)
                        : [...imageConfig.preferredTypes, type];
                      updateImageConfig({ preferredTypes: newTypes.length > 0 ? newTypes : ['illustration'] });
                    }}
                    className={`p-3 rounded font-medium transition-colors text-left ${
                      isSelected
                        ? 'bg-yellow-400 text-black'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{info.icon}</span>
                      <span className="font-semibold text-sm">{info.name}</span>
                    </div>
                    <div className="text-xs mt-1 opacity-80">{info.description.substring(0, 40)}...</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Image Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Visual Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {imageStyles.map((style) => {
                const info = IMAGE_STYLE_INFO[style];
                return (
                  <button
                    key={style}
                    onClick={() => updateImageConfig({ preferredStyle: style })}
                    className={`p-3 rounded font-medium transition-colors text-left ${
                      imageConfig.preferredStyle === style
                        ? 'bg-yellow-400 text-black'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-semibold text-sm">{info.name}</div>
                    <div className="text-xs mt-1 opacity-80">{info.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auto-Placement Strategy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Auto-Placement Strategy
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {placementStrategies.map((strategy) => (
                <button
                  key={strategy.value}
                  onClick={() => updateImageConfig({ autoPlacement: strategy.value })}
                  className={`p-3 rounded font-medium transition-colors text-left ${
                    imageConfig.autoPlacement === strategy.value
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="font-semibold text-sm">{strategy.label}</div>
                  <div className="text-xs mt-1 opacity-80">{strategy.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Default Placement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Image Placement
            </label>
            <div className="grid grid-cols-5 gap-2">
              {placements.map((p) => (
                <button
                  key={p.value}
                  onClick={() => updateImageConfig({ placement: p.value })}
                  className={`px-3 py-2 rounded font-medium transition-colors text-sm ${
                    imageConfig.placement === p.value
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Image Aspect Ratio
            </label>
            <div className="grid grid-cols-5 gap-2">
              {aspectRatios.map((ratio) => (
                <button
                  key={ratio.value}
                  onClick={() => updateImageConfig({ aspectRatio: ratio.value as any })}
                  className={`p-2 rounded font-medium transition-colors text-center ${
                    imageConfig.aspectRatio === ratio.value
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="font-semibold text-sm">{ratio.label}</div>
                  <div className="text-xs opacity-80">{ratio.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Additional Options
            </label>
            
            <label className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <input
                type="checkbox"
                checked={imageConfig.generateCaptions}
                onChange={(e) => updateImageConfig({ generateCaptions: e.target.checked })}
                className="w-4 h-4 accent-yellow-400"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Auto-generate Captions</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Add descriptive captions below each image</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <input
                type="checkbox"
                checked={imageConfig.includeAltText}
                onChange={(e) => updateImageConfig({ includeAltText: e.target.checked })}
                className="w-4 h-4 accent-yellow-400"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Include Alt Text</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Generate accessibility descriptions for screen readers</div>
              </div>
            </label>
          </div>

          {/* Summary */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-700">
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Image Generation Summary</h3>
            <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex justify-between">
                <span>Images per chapter:</span>
                <span className="font-semibold">{imageConfig.imagesPerChapter}</span>
              </div>
              <div className="flex justify-between">
                <span>Total chapters:</span>
                <span className="font-semibold">{config.content.numChapters || 10}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated total images:</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                  ~{imageConfig.imagesPerChapter * (config.content.numChapters || 10)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Preferred types:</span>
                <span className="font-semibold">
                  {imageConfig.preferredTypes.map((t) => IMAGE_TYPE_INFO[t].icon).join(' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Style:</span>
                <span className="font-semibold">{IMAGE_STYLE_INFO[imageConfig.preferredStyle].name}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
