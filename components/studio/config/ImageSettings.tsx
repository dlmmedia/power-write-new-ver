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
import { Sparkles } from 'lucide-react';

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
    { value: '16:9', label: '16:9', desc: 'Wide' },
    { value: '4:3', label: '4:3', desc: 'Classic' },
    { value: '1:1', label: '1:1', desc: 'Square' },
    { value: '3:2', label: '3:2', desc: 'Standard' },
    { value: '2:3', label: '2:3', desc: 'Portrait' },
  ];

  const selectedClass = 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 ring-1 ring-yellow-500/20';
  const unselectedClass = 'border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/30 hover:border-gray-300 dark:hover:border-gray-600';
  const selectedText = 'text-yellow-700 dark:text-yellow-300';
  const unselectedText = 'text-gray-900 dark:text-white';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Book Images</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Configure illustrations, diagrams, and other visual elements for your book
        </p>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200/80 dark:border-gray-700/40">
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Enable Book Images</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Generate AI images automatically during book creation
          </p>
        </div>
        <button
          onClick={() => updateImageConfig({ enabled: !imageConfig.enabled })}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            imageConfig.enabled ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
              imageConfig.enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
            }`}
          />
        </button>
      </div>

      {imageConfig.enabled && (
        <>
          {/* Genre Defaults Button */}
          <button
            onClick={applyGenreDefaults}
            className="w-full px-4 py-2.5 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200/60 dark:border-yellow-800/30 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-950/30 transition-colors text-sm font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 inline mr-1.5" /> Apply recommended settings for {config.basicInfo.genre || 'Fiction'}
          </button>

          {/* Images Per Chapter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Images Per Chapter
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {[0, 1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => updateImageConfig({ imagesPerChapter: num })}
                  className={`px-3 py-2 rounded-lg font-medium transition-all text-sm border ${
                    imageConfig.imagesPerChapter === num
                      ? selectedClass
                      : unselectedClass
                  }`}
                >
                  <span className={imageConfig.imagesPerChapter === num ? selectedText : unselectedText}>{num}</span>
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
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
                    className={`p-2.5 rounded-lg text-left transition-all border ${
                      isSelected ? selectedClass : unselectedClass
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{info.icon}</span>
                      <span className={`text-xs font-medium ${isSelected ? selectedText : unselectedText}`}>{info.name}</span>
                    </div>
                    <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-yellow-600/60 dark:text-yellow-400/50' : 'text-gray-400 dark:text-gray-500'}`}>{info.description.substring(0, 40)}...</div>
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
            <div className="grid grid-cols-3 gap-1.5">
              {imageStyles.map((style) => {
                const info = IMAGE_STYLE_INFO[style];
                const isActive = imageConfig.preferredStyle === style;
                return (
                  <button
                    key={style}
                    onClick={() => updateImageConfig({ preferredStyle: style })}
                    className={`p-2.5 rounded-lg text-left transition-all border ${
                      isActive ? selectedClass : unselectedClass
                    }`}
                  >
                    <div className={`text-xs font-medium ${isActive ? selectedText : unselectedText}`}>{info.name}</div>
                    <div className={`text-[11px] mt-0.5 ${isActive ? 'text-yellow-600/60 dark:text-yellow-400/50' : 'text-gray-400 dark:text-gray-500'}`}>{info.description}</div>
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
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5">
              {placementStrategies.map((strategy) => {
                const isActive = imageConfig.autoPlacement === strategy.value;
                return (
                  <button
                    key={strategy.value}
                    onClick={() => updateImageConfig({ autoPlacement: strategy.value })}
                    className={`p-2.5 rounded-lg text-left transition-all border ${
                      isActive ? selectedClass : unselectedClass
                    }`}
                  >
                    <div className={`text-xs font-medium ${isActive ? selectedText : unselectedText}`}>{strategy.label}</div>
                    <div className={`text-[11px] mt-0.5 ${isActive ? 'text-yellow-600/60 dark:text-yellow-400/50' : 'text-gray-400 dark:text-gray-500'}`}>{strategy.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Default Placement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Image Placement
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {placements.map((p) => {
                const isActive = imageConfig.placement === p.value;
                return (
                  <button
                    key={p.value}
                    onClick={() => updateImageConfig({ placement: p.value })}
                    className={`px-2 py-2 rounded-lg font-medium transition-all text-xs text-center border ${
                      isActive ? selectedClass : unselectedClass
                    }`}
                  >
                    <span className={isActive ? selectedText : unselectedText}>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Image Aspect Ratio
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {aspectRatios.map((ratio) => {
                const isActive = imageConfig.aspectRatio === ratio.value;
                return (
                  <button
                    key={ratio.value}
                    onClick={() => updateImageConfig({ aspectRatio: ratio.value as any })}
                    className={`p-2 rounded-lg text-center transition-all border ${
                      isActive ? selectedClass : unselectedClass
                    }`}
                  >
                    <div className={`text-xs font-medium ${isActive ? selectedText : unselectedText}`}>{ratio.label}</div>
                    <div className={`text-[11px] ${isActive ? 'text-yellow-600/60 dark:text-yellow-400/50' : 'text-gray-400 dark:text-gray-500'}`}>{ratio.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Additional Options
            </label>
            
            <label className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900/30 rounded-lg cursor-pointer border border-gray-200/60 dark:border-gray-700/30 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
              <input
                type="checkbox"
                checked={imageConfig.generateCaptions}
                onChange={(e) => updateImageConfig({ generateCaptions: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500/30"
              />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">Auto-generate Captions</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">Add descriptive captions below each image</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900/30 rounded-lg cursor-pointer border border-gray-200/60 dark:border-gray-700/30 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
              <input
                type="checkbox"
                checked={imageConfig.includeAltText}
                onChange={(e) => updateImageConfig({ includeAltText: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500/30"
              />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">Include Alt Text</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">Generate accessibility descriptions for screen readers</div>
              </div>
            </label>
          </div>

          {/* Summary */}
          <div className="bg-gray-50/80 dark:bg-gray-800/30 rounded-xl p-4 border border-gray-200/40 dark:border-gray-700/20">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Image Summary</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Images per chapter</span>
                <span className="font-medium text-gray-900 dark:text-white tabular-nums">{imageConfig.imagesPerChapter}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Total chapters</span>
                <span className="font-medium text-gray-900 dark:text-white tabular-nums">{config.content.numChapters || 10}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200/40 dark:border-gray-700/20">
                <span className="text-gray-500 dark:text-gray-400">Estimated total images</span>
                <span className="font-medium text-yellow-700 dark:text-yellow-300 tabular-nums">
                  ~{imageConfig.imagesPerChapter * (config.content.numChapters || 10)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Preferred types</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {imageConfig.preferredTypes.map((t) => IMAGE_TYPE_INFO[t].icon).join(' ')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Style</span>
                <span className="font-medium text-gray-900 dark:text-white">{IMAGE_STYLE_INFO[imageConfig.preferredStyle].name}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
