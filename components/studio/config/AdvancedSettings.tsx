'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useStudioStore } from '@/lib/store/studio-store';
import { ModelSelection } from './ModelSelection';
import { GENERATION_SPEED_OPTIONS, GenerationSpeed } from '@/lib/types/studio';

const CONTENT_RATINGS = [
  { value: 'G', label: 'General Audiences', description: 'Suitable for all ages' },
  { value: 'PG', label: 'Parental Guidance', description: 'Some material may not be suitable for children' },
  { value: 'PG-13', label: 'Parents Strongly Cautioned', description: 'Some material may be inappropriate for children under 13' },
  { value: 'R', label: 'Restricted', description: 'Contains adult material' },
  { value: 'MA', label: 'Mature Audiences', description: 'For mature readers only' }
];

const LANGUAGE_LEVELS = [
  { value: 'simple', label: 'Simple', description: '5th-8th grade reading level' },
  { value: 'moderate', label: 'Moderate', description: 'High school reading level' },
  { value: 'advanced', label: 'Advanced', description: 'College/adult reading level' },
  { value: 'literary', label: 'Literary', description: 'Complex, sophisticated vocabulary' }
];

type SettingsTab = 'models' | 'generation' | 'content';

export function AdvancedSettings() {
  const { config, updateConfig } = useStudioStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('models');

  const tabs = [
    { id: 'models' as SettingsTab, label: 'AI Models', icon: '🤖' },
    { id: 'generation' as SettingsTab, label: 'Generation', icon: '⚙️' },
    { id: 'content' as SettingsTab, label: 'Content', icon: '📝' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Advanced Settings</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Configure AI models, generation parameters, and content guidelines.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-yellow-400 text-black'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Model Selection Tab */}
      {activeTab === 'models' && <ModelSelection />}

      {/* Generation Settings Tab */}
      {activeTab === 'generation' && (
        <div className="space-y-6">
          {/* Generation Speed Selector - Primary Option */}
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border border-yellow-200 dark:border-yellow-800/50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">⚡</span>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Generation Speed</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose your priority: quality or speed
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {GENERATION_SPEED_OPTIONS.map((option) => {
                const isSelected = (config.aiSettings?.generationSpeed || 'quality') === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => updateConfig({
                      aiSettings: {
                        ...config.aiSettings,
                        generationSpeed: option.value as GenerationSpeed,
                        // Auto-update the model based on speed selection
                        chapterModel: option.model,
                      },
                    })}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-yellow-400 bg-white dark:bg-gray-900 shadow-lg ring-2 ring-yellow-400/50'
                        : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-yellow-300 dark:hover:border-yellow-700'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                        <span className="text-black text-sm">✓</span>
                      </div>
                    )}
                    <div className="text-xl mb-2">{option.label}</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {option.description}
                    </p>
                    <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                      <div className="flex items-center gap-1">
                        <span>⏱</span>
                        <span>{option.estimatedTime}</span>
                      </div>
                      <ul className="space-y-0.5 mt-2">
                        {option.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-1">
                            <span className="text-green-500">•</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parallel Generation Toggle */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔀</span>
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Parallel Chapter Generation
                  </span>
                  <p className="text-xs text-gray-500">
                    Generate multiple chapters simultaneously (~4x faster)
                  </p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={config.aiSettings?.useParallelGeneration !== false}
                  onChange={(e) => updateConfig({
                    aiSettings: {
                      ...config.aiSettings,
                      useParallelGeneration: e.target.checked,
                    },
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-400"></div>
              </div>
            </label>
            {config.aiSettings?.useParallelGeneration !== false && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 ml-9">
                ⚠️ Chapters in the same batch share context. For maximum coherence, disable this option.
              </p>
            )}
          </div>

          {/* AI Temperature/Creativity */}
          <div>
            <Label htmlFor="temperature">AI Creativity (Temperature)</Label>
            <input
              type="range"
              id="temperature"
              min="0"
              max="1"
              step="0.05"
              value={config.aiSettings?.temperature || 0.85}
              onChange={(e) => updateConfig({
                aiSettings: {
                  ...config.aiSettings,
                  temperature: parseFloat(e.target.value),
                },
              })}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
            />
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-1">
              <span>Conservative (0.3)</span>
              <span className="text-yellow-600 dark:text-yellow-400 font-semibold">{config.aiSettings?.temperature || 0.85}</span>
              <span>Very Creative (0.95)</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Higher values mean more unexpected plot twists and unique stylistic choices
            </p>
          </div>

          {/* Custom Instructions */}
          <div>
            <Label htmlFor="custom-instructions">Custom Instructions</Label>
            <Textarea
              id="custom-instructions"
              value={config.customInstructions || ''}
              onChange={(e) => {
                const { setConfig } = useStudioStore.getState();
                setConfig({ ...config, customInstructions: e.target.value });
              }}
              placeholder="Any specific instructions for the AI when generating your book...&#10;&#10;Examples:&#10;- Include a plot twist in chapter 5&#10;- Write in the style of Brandon Sanderson&#10;- Add more dialogue between characters"
              rows={6}
            />
            <p className="text-xs text-gray-500 mt-1">
              Provide any additional guidance, constraints, or preferences for the AI generation
            </p>
          </div>
        </div>
      )}

      {/* Content Settings Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Content Rating */}
          <div>
            <Label htmlFor="content-rating">Content Rating</Label>
            <Select
              id="content-rating"
              value={config.audience?.rating || 'PG-13'}
              onChange={(e) => updateConfig({
                audience: {
                  ...config.audience,
                  rating: e.target.value as any,
                },
              })}
            >
              {CONTENT_RATINGS.map((rating) => (
                <option key={rating.value} value={rating.value}>
                  {rating.label} - {rating.description}
                </option>
              ))}
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Determines appropriate level of violence, language, and mature themes
            </p>
          </div>

          {/* Language Complexity */}
          <div>
            <Label htmlFor="language-level">Language Complexity</Label>
            <Select
              id="language-level"
              value={config.language?.complexity || 'moderate'}
              onChange={(e) => updateConfig({
                language: {
                  ...config.language,
                  complexity: e.target.value as any,
                },
              })}
            >
              {LANGUAGE_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label} - {level.description}
                </option>
              ))}
            </Select>
          </div>

          {/* Content Guidelines */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-3">
            <h4 className="font-bold text-gray-900 dark:text-white">Content Guidelines</h4>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.advanced?.contentFiltering || false}
                onChange={(e) => updateConfig({
                  advanced: {
                    ...config.advanced,
                    contentFiltering: e.target.checked,
                  },
                })}
                className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-yellow-400 focus:ring-yellow-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Enable content filtering</span>
                <p className="text-xs text-gray-500">Automatically filter inappropriate content based on rating</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.advanced?.factChecking || false}
                onChange={(e) => updateConfig({
                  advanced: {
                    ...config.advanced,
                    factChecking: e.target.checked,
                  },
                })}
                className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-yellow-400 focus:ring-yellow-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Enable fact-checking (non-fiction)</span>
                <p className="text-xs text-gray-500">Verify factual claims for non-fiction books</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.advanced?.plagiarismChecking || false}
                onChange={(e) => updateConfig({
                  advanced: {
                    ...config.advanced,
                    plagiarismChecking: e.target.checked,
                  },
                })}
                className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-yellow-400 focus:ring-yellow-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Check for originality</span>
                <p className="text-xs text-gray-500">Ensure generated content is original</p>
              </div>
            </label>
          </div>

          {/* Content Warnings */}
          <div>
            <Label htmlFor="content-warnings">Content Warnings (Optional)</Label>
            <Textarea
              id="content-warnings"
              value={config.audience?.contentWarnings?.join(', ') || ''}
              onChange={(e) => updateConfig({
                audience: {
                  ...config.audience,
                  contentWarnings: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                },
              })}
              placeholder="e.g., violence, strong language, adult themes"
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-1">
              Comma-separated list of content warnings to include
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
