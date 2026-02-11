'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useStudioStore } from '@/lib/store/studio-store';
import { ModelSelection } from './ModelSelection';
import { GENERATION_SPEED_OPTIONS, GenerationSpeed } from '@/lib/types/studio';
import { ChapterOutline } from '@/lib/types/generation';
import { Bot, Settings, FileText, Layers, Zap, Shuffle, Check, Clock, AlertTriangle, X } from 'lucide-react';

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

type SettingsTab = 'models' | 'generation' | 'content' | 'chapters';

export function AdvancedSettings() {
  const { config, updateConfig, outline, setOutline } = useStudioStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('models');

  const tabs = [
    { id: 'models' as SettingsTab, label: 'AI Models', icon: <Bot className="w-3.5 h-3.5" /> },
    { id: 'generation' as SettingsTab, label: 'Generation', icon: <Settings className="w-3.5 h-3.5" /> },
    { id: 'content' as SettingsTab, label: 'Content', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'chapters' as SettingsTab, label: 'Chapters', icon: <Layers className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Advanced Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Configure AI models, generation parameters, and content guidelines.
        </p>
      </div>

      {/* Tabs - underline style */}
      <div className="flex gap-1 border-b border-gray-200/60 dark:border-gray-700/40">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-sm font-medium transition-all flex items-center gap-1.5 border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-yellow-500 text-yellow-700 dark:text-yellow-300'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <span className={`flex items-center ${activeTab === tab.id ? 'opacity-100' : 'opacity-50'}`}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Model Selection Tab */}
      {activeTab === 'models' && <ModelSelection />}

      {/* Generation Settings Tab */}
      {activeTab === 'generation' && (
        <div className="space-y-5">
          {/* Current Model Display */}
          <div className="bg-white dark:bg-gray-900/50 border border-gray-200/80 dark:border-gray-700/40 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Active Chapter Model
                  </span>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    {config.aiSettings?.generationSpeed 
                      ? `Using ${config.aiSettings.generationSpeed} preset`
                      : 'Using custom model from AI Models tab'
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {(config.aiSettings as any)?.chapterModel || config.aiSettings?.model || 'anthropic/claude-sonnet-4'}
                </div>
              </div>
            </div>
          </div>

          {/* Generation Speed Selector */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Speed Presets</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">Quick presets for common use cases</p>
                </div>
              </div>
              {config.aiSettings?.generationSpeed && (
                <button
                  onClick={() => updateConfig({
                    aiSettings: {
                      ...config.aiSettings,
                      generationSpeed: undefined,
                    },
                  })}
                  className="text-[11px] px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-3 h-3 inline mr-0.5" /> Clear
                </button>
              )}
            </div>

            {!config.aiSettings?.generationSpeed && (
              <div className="mb-3 p-2.5 bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200/40 dark:border-blue-800/20 rounded-lg">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  <span className="font-medium">Custom Model Active</span> — Using the model from AI Models tab. Select a preset to use a recommended model.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {GENERATION_SPEED_OPTIONS.map((option) => {
                const isSelected = config.aiSettings?.generationSpeed === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      if (isSelected) {
                        updateConfig({
                          aiSettings: {
                            ...config.aiSettings,
                            generationSpeed: undefined,
                          },
                        });
                      } else {
                        updateConfig({
                          aiSettings: {
                            ...config.aiSettings,
                            generationSpeed: option.value as GenerationSpeed,
                            chapterModel: option.model,
                          },
                        });
                      }
                    }}
                    className={`relative p-3.5 rounded-xl text-left transition-all border ${
                      isSelected
                        ? 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 ring-1 ring-yellow-500/20'
                        : 'border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/30 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center shadow-sm">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className={`text-sm font-medium mb-1 ${isSelected ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-900 dark:text-white'}`}>{option.label}</div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {option.description}
                    </p>
                    <div className="text-[11px] text-gray-400 space-y-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 inline" />
                        <span>{option.estimatedTime}</span>
                      </div>
                      <ul className="space-y-0.5 mt-1.5">
                        {option.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0"></span>
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
          <div className="bg-white dark:bg-gray-900/50 border border-gray-200/80 dark:border-gray-700/40 rounded-xl p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
                  <Shuffle className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Parallel Chapter Generation
                  </span>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    Generate multiple chapters simultaneously (~4x faster)
                  </p>
                </div>
              </div>
              <button
                onClick={() => updateConfig({
                  aiSettings: {
                    ...config.aiSettings,
                    useParallelGeneration: config.aiSettings?.useParallelGeneration === false ? true : false,
                  },
                })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  config.aiSettings?.useParallelGeneration !== false ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                    config.aiSettings?.useParallelGeneration !== false ? 'translate-x-[18px]' : 'translate-x-[3px]'
                  }`}
                />
              </button>
            </label>
            {config.aiSettings?.useParallelGeneration !== false && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 ml-[42px]">
                <AlertTriangle className="w-3 h-3 inline mr-0.5" /> Chapters in the same batch share context. For maximum coherence, disable this.
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
              className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500 mt-2"
            />
            <div className="flex justify-between text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
              <span>Conservative (0.3)</span>
              <span className="text-yellow-600 dark:text-yellow-400 font-semibold tabular-nums">{config.aiSettings?.temperature || 0.85}</span>
              <span>Very Creative (0.95)</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
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
              rows={5}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Provide any additional guidance, constraints, or preferences for the AI generation
            </p>
          </div>
        </div>
      )}

      {/* Content Settings Tab */}
      {activeTab === 'content' && (
        <div className="space-y-5">
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
            <p className="text-[11px] text-gray-400 mt-1">
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
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Content Guidelines</p>
            
            <label className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900/30 rounded-lg cursor-pointer border border-gray-200/60 dark:border-gray-700/30 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
              <input
                type="checkbox"
                checked={config.advanced?.contentFiltering || false}
                onChange={(e) => updateConfig({
                  advanced: {
                    ...config.advanced,
                    contentFiltering: e.target.checked,
                  },
                })}
                className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500/30"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Enable content filtering</span>
                <p className="text-[11px] text-gray-400">Automatically filter inappropriate content based on rating</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900/30 rounded-lg cursor-pointer border border-gray-200/60 dark:border-gray-700/30 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
              <input
                type="checkbox"
                checked={config.advanced?.factChecking || false}
                onChange={(e) => updateConfig({
                  advanced: {
                    ...config.advanced,
                    factChecking: e.target.checked,
                  },
                })}
                className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500/30"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Enable fact-checking (non-fiction)</span>
                <p className="text-[11px] text-gray-400">Verify factual claims for non-fiction books</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900/30 rounded-lg cursor-pointer border border-gray-200/60 dark:border-gray-700/30 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
              <input
                type="checkbox"
                checked={config.advanced?.plagiarismChecking || false}
                onChange={(e) => updateConfig({
                  advanced: {
                    ...config.advanced,
                    plagiarismChecking: e.target.checked,
                  },
                })}
                className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500/30"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Check for originality</span>
                <p className="text-[11px] text-gray-400">Ensure generated content is original</p>
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
            <p className="text-[11px] text-gray-400 mt-1">
              Comma-separated list of content warnings to include
            </p>
          </div>
        </div>
      )}

      {/* Chapters Tab */}
      {activeTab === 'chapters' && (
        <div className="space-y-5">
          {outline ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {outline.title} — Chapter Structure
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5 tabular-nums">
                      {outline.chapters.length} chapters · ~{outline.chapters.reduce((sum: number, ch: any) => sum + (ch.wordCount || 0), 0).toLocaleString()} words
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newChapter = {
                        number: outline.chapters.length + 1,
                        title: `Chapter ${outline.chapters.length + 1}`,
                        summary: 'New chapter',
                        wordCount: 5000,
                        scenes: [],
                      };
                      setOutline({
                        ...outline,
                        chapters: [...outline.chapters, newChapter],
                      });
                    }}
                    className="px-2.5 py-1.5 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-300 text-xs font-medium rounded-md ring-1 ring-yellow-500/20 hover:bg-yellow-100 dark:hover:bg-yellow-950/30 transition-colors"
                  >
                    + Add Chapter
                  </button>
                </div>

                <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                  {outline.chapters.map((chapter: any, idx: number) => (
                    <div key={idx} className="bg-white dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200/80 dark:border-gray-700/40 group">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 w-7 tabular-nums">#{chapter.number}</span>
                          <input
                            type="text"
                            value={chapter.title}
                            onChange={(e) => {
                              const updated = [...outline.chapters];
                              updated[idx] = { ...updated[idx], title: e.target.value };
                              setOutline({ ...outline, chapters: updated });
                            }}
                            className="flex-1 text-sm font-medium bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-yellow-500/50 focus:outline-none text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {idx > 0 && (
                            <button
                              onClick={() => {
                                const updated = [...outline.chapters];
                                [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
                                const renumbered = updated.map((ch: any, i: number) => ({ ...ch, number: i + 1 }));
                                setOutline({ ...outline, chapters: renumbered });
                              }}
                              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5"
                              title="Move up"
                            >
                              &#9650;
                            </button>
                          )}
                          {idx < outline.chapters.length - 1 && (
                            <button
                              onClick={() => {
                                const updated = [...outline.chapters];
                                [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
                                const renumbered = updated.map((ch: any, i: number) => ({ ...ch, number: i + 1 }));
                                setOutline({ ...outline, chapters: renumbered });
                              }}
                              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5"
                              title="Move down"
                            >
                              &#9660;
                            </button>
                          )}
                          <span className="text-[11px] text-gray-400 tabular-nums">{(chapter.wordCount || 0).toLocaleString()}w</span>
                          {outline.chapters.length > 1 && (
                            <button
                              onClick={() => {
                                if (!confirm(`Delete "${chapter.title}"?`)) return;
                                const updated = outline.chapters
                                  .filter((_: any, i: number) => i !== idx)
                                  .map((ch: any, i: number) => ({ ...ch, number: i + 1 }));
                                setOutline({ ...outline, chapters: updated });
                              }}
                              className="text-gray-400 hover:text-red-500 p-0.5 transition-colors"
                              title="Delete chapter"
                            >
                              <span className="text-xs">&#10005;</span>
                            </button>
                          )}
                        </div>
                      </div>
                      <textarea
                        value={chapter.summary || ''}
                        onChange={(e) => {
                          const updated = [...outline.chapters];
                          updated[idx] = { ...updated[idx], summary: e.target.value };
                          setOutline({ ...outline, chapters: updated });
                        }}
                        rows={2}
                        className="w-full text-xs text-gray-500 dark:text-gray-400 bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-600 focus:border-yellow-500/40 focus:outline-none rounded px-2 py-1 resize-none transition-colors"
                        placeholder="Chapter summary..."
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50/80 dark:bg-blue-950/20 rounded-lg p-2.5 text-[11px] text-blue-600 dark:text-blue-400 border border-blue-200/40 dark:border-blue-800/20">
                Changes here are synced with the outline editor. Switch to the &quot;Outline&quot; view for detailed editing.
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <p className="text-sm mb-1.5">No outline available</p>
              <p className="text-xs">Generate an outline first using Smart Prompt (Magic Fill) or the &quot;Generate Outline&quot; button.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
