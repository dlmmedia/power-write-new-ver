'use client';

import { useStudioStore } from '@/lib/store/studio-store';
import { Input } from '@/components/ui/Input';
import { GENRE_OPTIONS } from '@/lib/types/studio';

export const BasicInfo: React.FC = () => {
  const { config, updateConfig } = useStudioStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Basic Information</h2>
        <p className="text-gray-600 dark:text-gray-400">Essential details about your book</p>
      </div>

      <div className="space-y-4">
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors"
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
        <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Series Information (Optional)</h3>
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
              label="Book Number in Series"
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
        <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Co-Authors (Optional)</h3>
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
