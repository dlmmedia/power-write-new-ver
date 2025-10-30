'use client';

import { useStudioStore } from '@/lib/store/studio-store';
import { Input } from '@/components/ui/Input';

export const ContentSettings: React.FC = () => {
  const { config, updateConfig } = useStudioStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Content Settings</h2>
        <p className="text-gray-400">Define the scope and structure of your book</p>
      </div>

      <div className="space-y-4">
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Book Description / Synopsis *
          </label>
          <textarea
            value={config.content.description}
            onChange={(e) =>
              updateConfig({
                content: {
                  ...config.content,
                  description: e.target.value,
                },
              })
            }
            placeholder="Provide a detailed description of your book's story, themes, and key elements..."
            rows={6}
            className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <p className="mt-1 text-sm text-gray-400">
            500-1000 words recommended. This will guide the AI in generating your book.
          </p>
        </div>

        {/* Target Word Count */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Target Word Count
          </label>
          <div className="grid grid-cols-4 gap-3 mb-3">
            {[
              { label: 'Short', value: 50000 },
              { label: 'Medium', value: 80000 },
              { label: 'Long', value: 120000 },
              { label: 'Epic', value: 150000 },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  updateConfig({
                    content: {
                      ...config.content,
                      targetWordCount: option.value,
                    },
                  })
                }
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  config.content.targetWordCount === option.value
                    ? 'bg-yellow-400 text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {option.label}
                <div className="text-xs mt-1">{option.value.toLocaleString()}</div>
              </button>
            ))}
          </div>
          <Input
            type="number"
            placeholder="Or enter custom word count"
            value={config.content.targetWordCount}
            onChange={(e) =>
              updateConfig({
                content: {
                  ...config.content,
                  targetWordCount: parseInt(e.target.value) || 80000,
                },
              })
            }
            min={1000}
          />
        </div>

        {/* Number of Chapters */}
        <Input
          type="number"
          label="Number of Chapters"
          placeholder="10"
          value={config.content.numChapters}
          onChange={(e) =>
            updateConfig({
              content: {
                ...config.content,
                numChapters: parseInt(e.target.value) || 10,
              },
            })
          }
          min={1}
          max={100}
          helperText="Most books have between 10-30 chapters"
        />

        {/* Chapter Length Preference */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Chapter Length Preference
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() =>
                updateConfig({
                  content: {
                    ...config.content,
                    chapterLengthPreference: 'consistent',
                  },
                })
              }
              className={`px-4 py-3 rounded font-medium transition-colors text-left ${
                config.content.chapterLengthPreference === 'consistent'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="font-semibold">Consistent</div>
              <div className="text-xs mt-1">All chapters similar length</div>
            </button>
            <button
              onClick={() =>
                updateConfig({
                  content: {
                    ...config.content,
                    chapterLengthPreference: 'variable',
                  },
                })
              }
              className={`px-4 py-3 rounded font-medium transition-colors text-left ${
                config.content.chapterLengthPreference === 'variable'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="font-semibold">Variable</div>
              <div className="text-xs mt-1">Chapters vary by content</div>
            </button>
          </div>
        </div>

        {/* Book Structure */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Book Structure
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'linear', label: 'Linear', desc: 'Chronological order' },
              { value: 'non-linear', label: 'Non-Linear', desc: 'Flashbacks, time jumps' },
              { value: 'episodic', label: 'Episodic', desc: 'Self-contained chapters' },
              { value: 'circular', label: 'Circular', desc: 'Ends where it begins' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  updateConfig({
                    content: {
                      ...config.content,
                      bookStructure: option.value as any,
                    },
                  })
                }
                className={`px-4 py-3 rounded font-medium transition-colors text-left ${
                  config.content.bookStructure === option.value
                    ? 'bg-yellow-400 text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="font-semibold">{option.label}</div>
                <div className="text-xs mt-1">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Word Count Summary */}
        <div className="bg-gray-800 rounded p-4 border border-gray-700">
          <h3 className="font-semibold mb-2">Estimated Breakdown</h3>
          <div className="space-y-1 text-sm text-gray-300">
            <div className="flex justify-between">
              <span>Total Words:</span>
              <span className="font-semibold">{config.content.targetWordCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Chapters:</span>
              <span className="font-semibold">{config.content.numChapters}</span>
            </div>
            <div className="flex justify-between">
              <span>Words per Chapter:</span>
              <span className="font-semibold">
                ~{Math.floor(config.content.targetWordCount / config.content.numChapters).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Pages:</span>
              <span className="font-semibold">
                ~{Math.floor(config.content.targetWordCount / 250)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
