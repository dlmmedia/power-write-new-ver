'use client';

import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useStudioStore } from '@/lib/store/studio-store';

const CREATIVITY_LEVELS = [
  { value: 0.3, label: 'Conservative', description: 'Predictable, safe choices' },
  { value: 0.5, label: 'Balanced', description: 'Mix of familiar and creative' },
  { value: 0.7, label: 'Creative', description: 'More unexpected elements' },
  { value: 0.9, label: 'Very Creative', description: 'Highly original and bold' }
];

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

export function AdvancedSettings() {
  const { config, updateConfig } = useStudioStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-4">Advanced Settings</h3>
        <p className="text-gray-400 text-sm mb-6">
          Fine-tune generation parameters, content guidelines, and technical preferences.
        </p>
      </div>

      {/* AI Temperature/Creativity */}
      <div>
        <Label htmlFor="temperature">AI Creativity (Temperature)</Label>
        <input
          type="range"
          id="temperature"
          min="0"
          max="1"
          step="0.1"
          value={config.aiSettings?.temperature || 0.85}
          onChange={(e) => updateConfig({
            aiSettings: {
              ...config.aiSettings,
              temperature: parseFloat(e.target.value),
            },
          })}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-400 mt-1">
          <span>Conservative (0.3)</span>
          <span className="text-yellow-400 font-semibold">{config.aiSettings?.temperature || 0.85}</span>
          <span>Very Creative (0.9)</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Higher values mean more unexpected plot twists and unique stylistic choices
        </p>
      </div>

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
          placeholder="Any specific instructions for the AI when generating your book..."
          rows={5}
        />
        <p className="text-xs text-gray-500 mt-1">
          Provide any additional guidance, constraints, or preferences for the AI generation
        </p>
      </div>

      {/* Content Filtering */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-3">
        <h4 className="font-bold">Content Guidelines</h4>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.advanced?.contentFiltering || false}
            onChange={(e) => updateConfig({
              advanced: {
                ...config.advanced,
                contentFiltering: e.target.checked,
              },
            })}
            className="w-4 h-4 rounded border-gray-700 text-yellow-400 focus:ring-yellow-500"
          />
          <span className="text-sm">Enable content filtering</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.advanced?.factChecking || false}
            onChange={(e) => updateConfig({
              advanced: {
                ...config.advanced,
                factChecking: e.target.checked,
              },
            })}
            className="w-4 h-4 rounded border-gray-700 text-yellow-400 focus:ring-yellow-500"
          />
          <span className="text-sm">Enable fact-checking (for non-fiction)</span>
        </label>
      </div>

      {/* Generation Strategy */}
      <div>
        <Label htmlFor="generation-strategy">Generation Strategy</Label>
        <Select
          id="generation-strategy"
          value={config.aiSettings?.generationStrategy || 'sequential'}
          onChange={(e) => updateConfig({
            aiSettings: {
              ...config.aiSettings,
              generationStrategy: e.target.value as any,
            },
          })}
        >
          <option value="sequential">Sequential - Generate chapters one by one</option>
          <option value="parallel">Parallel - Generate multiple chapters simultaneously</option>
          <option value="hybrid">Hybrid - Mix of both approaches</option>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          Sequential is more consistent, parallel is faster
        </p>
      </div>
    </div>
  );
}
