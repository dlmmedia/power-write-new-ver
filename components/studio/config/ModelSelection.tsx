'use client';

import { useState, type ReactNode } from 'react';
import { useStudioStore } from '@/lib/store/studio-store';
import { 
  ALL_MODELS, 
  MODEL_CATEGORIES, 
  AIModel,
  getModelsByCategory,
  getRecommendedModels 
} from '@/lib/types/models';
import { LayoutGrid, Star, PenTool, Zap, Brain, Microscope, Lightbulb, Check } from 'lucide-react';

type ModelCategory = 'all' | 'flagship' | 'creative' | 'fast' | 'reasoning' | 'specialized';

export function ModelSelection() {
  const { config, updateConfig } = useStudioStore();
  const [activeCategory, setActiveCategory] = useState<ModelCategory>('all');
  const [showAllModels, setShowAllModels] = useState(false);

  const currentOutlineModel = config.aiSettings?.model || 'gpt-4o-mini';
  const currentChapterModel = (config.aiSettings as any)?.chapterModel || 'anthropic/claude-sonnet-4';

  const categories: { id: ModelCategory; label: string; icon: ReactNode }[] = [
    { id: 'all', label: 'All Models', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { id: 'flagship', label: 'Flagship', icon: <Star className="w-3.5 h-3.5" /> },
    { id: 'creative', label: 'Creative', icon: <PenTool className="w-3.5 h-3.5" /> },
    { id: 'fast', label: 'Fast', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'reasoning', label: 'Reasoning', icon: <Brain className="w-3.5 h-3.5" /> },
    { id: 'specialized', label: 'Specialized', icon: <Microscope className="w-3.5 h-3.5" /> },
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
        generationSpeed: undefined,
      } as any,
    });
  };

  const getModelInfo = (modelId: string): AIModel | undefined => {
    return ALL_MODELS.find(m => m.id === modelId);
  };

  const getTierBadge = (tier: AIModel['tier']) => {
    const styles = {
      premium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/20',
      standard: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 ring-1 ring-blue-500/20',
      budget: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-500/20',
    };
    const labels = { premium: 'Premium', standard: 'Standard', budget: 'Budget' };
    return (
      <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-medium ${styles[tier]}`}>
        {labels[tier]}
      </span>
    );
  };

  const getProviderBadge = (provider: string) => {
    const styles: Record<string, string> = {
      openai: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
      openrouter: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    };
    return (
      <span className={`px-1.5 py-0.5 rounded text-[11px] ${styles[provider] || 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
        {provider === 'openrouter' ? 'OpenRouter' : 'OpenAI'}
      </span>
    );
  };

  const recommendedModels = getRecommendedModels();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">AI Model Selection</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Choose models for outline generation and chapter writing.
        </p>
      </div>

      {/* Current Selection Summary */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200/80 dark:border-gray-700/40 rounded-xl p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Current Selection</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3 border border-gray-200/60 dark:border-gray-700/30">
            <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">Outline Model</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {getModelInfo(currentOutlineModel)?.name || currentOutlineModel}
            </div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
              {getModelInfo(currentOutlineModel)?.description}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3 border border-gray-200/60 dark:border-gray-700/30">
            <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">Chapter Model</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {getModelInfo(currentChapterModel)?.name || currentChapterModel}
            </div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
              {getModelInfo(currentChapterModel)?.description}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Models */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-yellow-500" /> Recommended
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {recommendedModels.slice(0, 4).map((model) => (
            <div
              key={model.id}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                currentChapterModel === model.id
                  ? 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 ring-1 ring-yellow-500/20'
                  : 'border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/30 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => handleSelectChapterModel(model.id)}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{model.name}</span>
                <div className="flex gap-1">
                  {getTierBadge(model.tier)}
                </div>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{model.description}</p>
              <div className="flex items-center gap-2">
                {getProviderBadge(model.provider)}
                <span className="text-[11px] text-gray-400 tabular-nums">
                  {(model.contextLength / 1000).toFixed(0)}K ctx
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Browse All Models</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeCategory === cat.id
                  ? 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 ring-1 ring-yellow-500/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }`}
            >
              <span className="flex items-center">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Model Grid */}
      <div className="space-y-2">
        {displayedModels.map((model) => {
          const isActive = currentChapterModel === model.id || currentOutlineModel === model.id;
          return (
            <div
              key={model.id}
              className={`p-3 rounded-lg border transition-all ${
                isActive
                  ? 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/10 ring-1 ring-yellow-500/20'
                  : 'border-gray-200/80 dark:border-gray-700/40 bg-white dark:bg-gray-900/30 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{model.name}</span>
                    {getTierBadge(model.tier)}
                    {getProviderBadge(model.provider)}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 line-clamp-1">{model.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 tabular-nums">
                    <span>{(model.contextLength / 1000).toFixed(0)}K context</span>
                    <span>In: ${model.pricing.input}/1M</span>
                    <span>Out: ${model.pricing.output}/1M</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 ml-3 flex-shrink-0">
                  <button
                    onClick={() => handleSelectOutlineModel(model.id)}
                    className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-all ${
                      currentOutlineModel === model.id
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600'
                    }`}
                  >
                    {currentOutlineModel === model.id ? <><Check className="w-3 h-3 inline mr-0.5" /> Outline</> : 'Outline'}
                  </button>
                  <button
                    onClick={() => handleSelectChapterModel(model.id)}
                    className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-all ${
                      currentChapterModel === model.id
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600'
                    }`}
                  >
                    {currentChapterModel === model.id ? <><Check className="w-3 h-3 inline mr-0.5" /> Chapters</> : 'Chapters'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredModels.length > 8 && (
          <button
            onClick={() => setShowAllModels(!showAllModels)}
            className="w-full py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
          >
            {showAllModels ? 'Show Less' : `Show All ${filteredModels.length} Models`}
          </button>
        )}
      </div>

      {/* Model Tips */}
      <div className="bg-gray-50/80 dark:bg-gray-800/30 rounded-xl p-4 border border-gray-200/40 dark:border-gray-700/20">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-yellow-500" /> Tips
        </p>
        <ul className="space-y-1 text-[11px] text-gray-500 dark:text-gray-400 list-disc list-inside">
          <li><strong className="font-medium text-gray-600 dark:text-gray-300">Outline:</strong> Use faster models for quick structured output</li>
          <li><strong className="font-medium text-gray-600 dark:text-gray-300">Chapters:</strong> Use flagship models for the best creative writing</li>
          <li><strong className="font-medium text-gray-600 dark:text-gray-300">Budget:</strong> Llama 3.3 70B and Qwen 2.5 offer great quality at lower cost</li>
          <li><strong className="font-medium text-gray-600 dark:text-gray-300">Long content:</strong> Gemini models support up to 1M tokens</li>
        </ul>
      </div>
    </div>
  );
}
