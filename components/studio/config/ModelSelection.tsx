'use client';

import { useState } from 'react';
import { useStudioStore } from '@/lib/store/studio-store';
import { 
  ALL_MODELS, 
  MODEL_CATEGORIES, 
  AIModel,
  getModelsByCategory,
  getRecommendedModels 
} from '@/lib/types/models';

type ModelCategory = 'all' | 'flagship' | 'creative' | 'fast' | 'reasoning' | 'specialized';

export function ModelSelection() {
  const { config, updateConfig } = useStudioStore();
  const [activeCategory, setActiveCategory] = useState<ModelCategory>('all');
  const [showAllModels, setShowAllModels] = useState(false);

  const currentOutlineModel = config.aiSettings?.model || 'gpt-4o-mini';
  const currentChapterModel = (config.aiSettings as any)?.chapterModel || 'anthropic/claude-sonnet-4';

  const categories: { id: ModelCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'All Models', icon: '📋' },
    { id: 'flagship', label: 'Flagship', icon: '⭐' },
    { id: 'creative', label: 'Creative', icon: '✍️' },
    { id: 'fast', label: 'Fast', icon: '⚡' },
    { id: 'reasoning', label: 'Reasoning', icon: '🧠' },
    { id: 'specialized', label: 'Specialized', icon: '🔬' },
  ];

  const filteredModels = activeCategory === 'all' 
    ? ALL_MODELS 
    : getModelsByCategory(activeCategory as AIModel['category']);

  const displayedModels = showAllModels ? filteredModels : filteredModels.slice(0, 8);

  const handleSelectOutlineModel = (modelId: string) => {
    updateConfig({
      aiSettings: {
        ...config.aiSettings,
        model: modelId,
      },
    });
  };

  const handleSelectChapterModel = (modelId: string) => {
    updateConfig({
      aiSettings: {
        ...config.aiSettings,
        chapterModel: modelId,
      } as any,
    });
  };

  const getModelInfo = (modelId: string): AIModel | undefined => {
    return ALL_MODELS.find(m => m.id === modelId);
  };

  const getTierBadge = (tier: AIModel['tier']) => {
    const styles = {
      premium: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black',
      standard: 'bg-blue-500 text-white',
      budget: 'bg-green-500 text-white',
    };
    const labels = {
      premium: 'Premium',
      standard: 'Standard',
      budget: 'Budget',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles[tier]}`}>
        {labels[tier]}
      </span>
    );
  };

  const getProviderBadge = (provider: string) => {
    const styles: Record<string, string> = {
      openai: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
      openrouter: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs ${styles[provider] || 'bg-gray-100 dark:bg-gray-800'}`}>
        {provider === 'openrouter' ? 'OpenRouter' : 'OpenAI'}
      </span>
    );
  };

  const recommendedModels = getRecommendedModels();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">AI Model Selection</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Choose the AI models for outline generation and chapter writing. Different models have different strengths.
        </p>
      </div>

      {/* Current Selection Summary */}
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">Current Selection</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Outline Model</div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {getModelInfo(currentOutlineModel)?.name || currentOutlineModel}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getModelInfo(currentOutlineModel)?.description}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Chapter Model</div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {getModelInfo(currentChapterModel)?.name || currentChapterModel}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getModelInfo(currentChapterModel)?.description}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Models */}
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <span>⭐</span> Recommended Models
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recommendedModels.slice(0, 4).map((model) => (
            <div
              key={model.id}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                currentChapterModel === model.id
                  ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-600'
              }`}
              onClick={() => handleSelectChapterModel(model.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900 dark:text-white">{model.name}</span>
                <div className="flex gap-1">
                  {getTierBadge(model.tier)}
                  {model.recommended && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                      ⭐ Recommended
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{model.description}</p>
              <div className="flex items-center gap-2">
                {getProviderBadge(model.provider)}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {(model.contextLength / 1000).toFixed(0)}K context
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Browse All Models</h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeCategory === cat.id
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Model Grid */}
      <div className="space-y-3">
        {displayedModels.map((model) => (
          <div
            key={model.id}
            className={`p-4 rounded-lg border transition-all ${
              currentChapterModel === model.id || currentOutlineModel === model.id
                ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 dark:text-white">{model.name}</span>
                  {getTierBadge(model.tier)}
                  {getProviderBadge(model.provider)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{model.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>{(model.contextLength / 1000).toFixed(0)}K context</span>
                  <span>Input: ${model.pricing.input}/1M</span>
                  <span>Output: ${model.pricing.output}/1M</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 ml-4">
                <button
                  onClick={() => handleSelectOutlineModel(model.id)}
                  className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                    currentOutlineModel === model.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900'
                  }`}
                >
                  {currentOutlineModel === model.id ? '✓ Outline' : 'Use for Outline'}
                </button>
                <button
                  onClick={() => handleSelectChapterModel(model.id)}
                  className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                    currentChapterModel === model.id
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900'
                  }`}
                >
                  {currentChapterModel === model.id ? '✓ Chapters' : 'Use for Chapters'}
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredModels.length > 8 && (
          <button
            onClick={() => setShowAllModels(!showAllModels)}
            className="w-full py-2 text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 font-medium"
          >
            {showAllModels ? 'Show Less' : `Show All ${filteredModels.length} Models`}
          </button>
        )}
      </div>

      {/* Model Info */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
        <h5 className="font-semibold text-gray-900 dark:text-white mb-2">💡 Model Selection Tips</h5>
        <ul className="space-y-1 list-disc list-inside">
          <li><strong>Outline:</strong> Use faster models (GPT-4o Mini, Gemini Flash) for quick structured output</li>
          <li><strong>Chapters:</strong> Use flagship models (Claude Opus 4, GPT-4.1) for the best creative writing</li>
          <li><strong>Budget:</strong> Llama 3.3 70B and Qwen 2.5 offer great quality at lower cost</li>
          <li><strong>Long content:</strong> Gemini models support up to 1M tokens for very long books</li>
        </ul>
      </div>
    </div>
  );
}



