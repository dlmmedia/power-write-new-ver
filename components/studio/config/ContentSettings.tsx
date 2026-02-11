'use client';

import { useStudioStore } from '@/lib/store/studio-store';
import { Input } from '@/components/ui/Input';

export const ContentSettings: React.FC = () => {
  const { config, updateConfig } = useStudioStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Content Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Define the scope and structure of your book</p>
      </div>

      <div className="space-y-5">
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
            className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/60 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/40 resize-none transition-shadow"
          />
          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
            500-1000 words recommended. This will guide the AI in generating your book.
          </p>
        </div>

        {/* Target Word Count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Target Word Count
          </label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Flash', value: 10000, desc: 'Brief guide' },
              { label: 'Novella', value: 20000, desc: 'Short read' },
              { label: 'Short', value: 30000, desc: 'Quick book' },
              { label: 'Standard', value: 50000, desc: 'Full book' },
              { label: 'Medium', value: 80000, desc: 'Detailed' },
              { label: 'Long', value: 120000, desc: 'Comprehensive' },
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
                className={`px-3 py-2.5 rounded-lg text-left transition-all border ${
                  config.content.targetWordCount === option.value
                    ? 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 ring-1 ring-yellow-500/20'
                    : 'border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/30 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className={`text-sm font-medium ${config.content.targetWordCount === option.value ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-900 dark:text-white'}`}>{option.label}</div>
                <div className={`text-xs tabular-nums ${config.content.targetWordCount === option.value ? 'text-yellow-600/70 dark:text-yellow-400/60' : 'text-gray-500 dark:text-gray-400'}`}>{option.value.toLocaleString()}</div>
                <div className={`text-[11px] mt-0.5 ${config.content.targetWordCount === option.value ? 'text-yellow-600/50 dark:text-yellow-400/40' : 'text-gray-400 dark:text-gray-500'}`}>{option.desc}</div>
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Chapter Length Preference
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() =>
                updateConfig({
                  content: {
                    ...config.content,
                    chapterLengthPreference: 'consistent',
                  },
                })
              }
              className={`px-4 py-3 rounded-lg text-left transition-all border ${
                config.content.chapterLengthPreference === 'consistent'
                  ? 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 ring-1 ring-yellow-500/20'
                  : 'border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/30 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className={`text-sm font-medium ${config.content.chapterLengthPreference === 'consistent' ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-900 dark:text-white'}`}>Consistent</div>
              <div className={`text-xs mt-0.5 ${config.content.chapterLengthPreference === 'consistent' ? 'text-yellow-600/60 dark:text-yellow-400/50' : 'text-gray-500 dark:text-gray-400'}`}>All chapters similar length</div>
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
              className={`px-4 py-3 rounded-lg text-left transition-all border ${
                config.content.chapterLengthPreference === 'variable'
                  ? 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 ring-1 ring-yellow-500/20'
                  : 'border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/30 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className={`text-sm font-medium ${config.content.chapterLengthPreference === 'variable' ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-900 dark:text-white'}`}>Variable</div>
              <div className={`text-xs mt-0.5 ${config.content.chapterLengthPreference === 'variable' ? 'text-yellow-600/60 dark:text-yellow-400/50' : 'text-gray-500 dark:text-gray-400'}`}>Chapters vary by content</div>
            </button>
          </div>
        </div>

        {/* Book Structure */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Book Structure
          </label>
          <div className="grid grid-cols-2 gap-2">
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
                className={`px-4 py-3 rounded-lg text-left transition-all border ${
                  config.content.bookStructure === option.value
                    ? 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 ring-1 ring-yellow-500/20'
                    : 'border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/30 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className={`text-sm font-medium ${config.content.bookStructure === option.value ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-900 dark:text-white'}`}>{option.label}</div>
                <div className={`text-xs mt-0.5 ${config.content.bookStructure === option.value ? 'text-yellow-600/60 dark:text-yellow-400/50' : 'text-gray-500 dark:text-gray-400'}`}>{option.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Word Count Summary */}
        <div className="bg-gray-50/80 dark:bg-gray-800/30 rounded-xl p-4 border border-gray-200/40 dark:border-gray-700/20">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Estimated Breakdown</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">Total Words</span>
              <span className="font-medium text-gray-900 dark:text-white tabular-nums">{config.content.targetWordCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">Chapters</span>
              <span className="font-medium text-gray-900 dark:text-white tabular-nums">{config.content.numChapters}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">Words per Chapter</span>
              <span className="font-medium text-gray-900 dark:text-white tabular-nums">
                ~{Math.floor(config.content.targetWordCount / config.content.numChapters).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200/40 dark:border-gray-700/20">
              <span className="text-gray-500 dark:text-gray-400">Estimated Pages</span>
              <span className="font-medium text-gray-900 dark:text-white tabular-nums">
                ~{Math.floor(config.content.targetWordCount / 250)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
