'use client';

import { useStudioStore } from '@/lib/store/studio-store';
import { Input } from '@/components/ui/Input';
import { GENRE_OPTIONS } from '@/lib/types/studio';

export const BasicInfo: React.FC = () => {
  const { config, updateConfig } = useStudioStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Basic Information</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Essential details about your book</p>
      </div>

      <div className="space-y-5">
        <Input
          label="Book Title *"
          placeholder="Enter your book title"
          value={config.basicInfo.title}
          onChange={(e) =>
            updateConfig({
              basicInfo: {
                ...config.basicInfo,
                title: e.target.value,
              },
            })
          }
          helperText="This will be the main title of your book"
        />

        <Input
          label="Author Name *"
          placeholder="Your name"
          value={config.basicInfo.author}
          onChange={(e) =>
            updateConfig({
              basicInfo: {
                ...config.basicInfo,
                author: e.target.value,
              },
            })
          }
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Genre *
          </label>
          <select
            value={config.basicInfo.genre}
            onChange={(e) =>
              updateConfig({
                basicInfo: {
                  ...config.basicInfo,
                  genre: e.target.value,
                },
              })
            }
            className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/60 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/40 transition-shadow"
          >
            {GENRE_OPTIONS.map((genre) => (
              <option key={genre} value={genre.toLowerCase()}>
                {genre}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Sub-Genre (Optional)"
          placeholder="e.g., Urban Fantasy, Historical Romance"
          value={config.basicInfo.subGenre || ''}
          onChange={(e) =>
            updateConfig({
              basicInfo: {
                ...config.basicInfo,
                subGenre: e.target.value,
              },
            })
          }
        />

        {/* Series Information */}
        <div className="pt-5 mt-1 border-t border-gray-200/60 dark:border-gray-800/40">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Series Information</p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Series Name"
              placeholder="e.g., The Chronicles of..."
              value={config.basicInfo.series?.name || ''}
              onChange={(e) =>
                updateConfig({
                  basicInfo: {
                    ...config.basicInfo,
                    series: {
                      name: e.target.value,
                      number: config.basicInfo.series?.number || 1,
                    },
                  },
                })
              }
            />
            <Input
              type="number"
              label="Book Number"
              placeholder="1"
              value={config.basicInfo.series?.number || ''}
              onChange={(e) =>
                updateConfig({
                  basicInfo: {
                    ...config.basicInfo,
                    series: {
                      name: config.basicInfo.series?.name || '',
                      number: parseInt(e.target.value) || 1,
                    },
                  },
                })
              }
              min={1}
            />
          </div>
        </div>

        {/* Co-Authors */}
        <div className="pt-5 mt-1 border-t border-gray-200/60 dark:border-gray-800/40">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Collaboration</p>
          <Input
            label="Co-Author Names"
            placeholder="Separate multiple names with commas"
            value={config.basicInfo.coAuthors?.join(', ') || ''}
            onChange={(e) =>
              updateConfig({
                basicInfo: {
                  ...config.basicInfo,
                  coAuthors: e.target.value
                    .split(',')
                    .map((name) => name.trim())
                    .filter((name) => name.length > 0),
                },
              })
            }
            helperText="Add co-authors if this is a collaborative work"
          />
        </div>
      </div>
    </div>
  );
};
