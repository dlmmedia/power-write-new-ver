'use client';

import { useStudioStore } from '@/lib/store/studio-store';
import { CITATION_STYLE_LABELS } from '@/lib/types/bibliography';

export const BibliographySettings: React.FC = () => {
  const { config, updateConfig } = useStudioStore();

  // Get bibliography config or use defaults
  const bibliographyConfig = config.bibliography || {
    include: false,
    citationStyle: 'APA',
    referenceFormat: 'bibliography',
    sourceVerification: 'moderate',
  };

  const updateBibliography = (updates: Partial<typeof bibliographyConfig>) => {
    updateConfig({
      bibliography: {
        ...bibliographyConfig,
        ...updates,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          Bibliography & References
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Configure citation style and reference management for non-fiction books
        </p>
      </div>

      <div className="space-y-6">
        {/* Enable Bibliography */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-4">
            <input
              type="checkbox"
              id="include-bibliography"
              checked={bibliographyConfig.include}
              onChange={(e) => updateBibliography({ include: e.target.checked })}
              className="mt-1 w-5 h-5 text-yellow-500 rounded focus:ring-2 focus:ring-yellow-500"
            />
            <div className="flex-1">
              <label
                htmlFor="include-bibliography"
                className="block text-lg font-semibold text-gray-900 dark:text-white cursor-pointer"
              >
                📚 Enable Bibliography System
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Add professional citations and references to your non-fiction book. Supports 20+ reference types and 7 major citation styles.
              </p>
            </div>
          </div>
        </div>

        {/* Citation Style */}
        {bibliographyConfig.include && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Citation Style *
              </label>
              <select
                value={bibliographyConfig.citationStyle}
                onChange={(e) => updateBibliography({ citationStyle: e.target.value as any })}
                className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                {Object.entries(CITATION_STYLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Choose the citation format that matches your field or publisher requirements
              </p>
            </div>

            {/* Reference Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reference Format
              </label>
              <div className="space-y-2">
                {[
                  { value: 'footnotes', label: 'Footnotes', desc: 'Citations at bottom of each page' },
                  { value: 'endnotes', label: 'Endnotes', desc: 'Citations at end of each chapter' },
                  { value: 'in-text', label: 'In-Text', desc: 'Citations within the text (Author, Year)' },
                  { value: 'bibliography', label: 'Bibliography', desc: 'Complete reference list at book end' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-start gap-3 p-3 rounded border border-gray-200 dark:border-gray-700 hover:border-yellow-500 dark:hover:border-yellow-500 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="referenceFormat"
                      value={option.value}
                      checked={bibliographyConfig.referenceFormat === option.value}
                      onChange={(e) => updateBibliography({ referenceFormat: e.target.value as any })}
                      className="mt-1 text-yellow-500 focus:ring-2 focus:ring-yellow-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Source Verification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Source Verification Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'relaxed', label: 'Relaxed', desc: 'Basic checks' },
                  { value: 'moderate', label: 'Moderate', desc: 'Standard verification' },
                  { value: 'strict', label: 'Strict', desc: 'Academic rigor' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateBibliography({ sourceVerification: option.value as any })}
                    className={`px-4 py-3 rounded font-medium transition-colors text-left ${
                      bibliographyConfig.sourceVerification === option.value
                        ? 'bg-yellow-400 text-black'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-semibold">{option.label}</div>
                    <div className="text-xs mt-1">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Information Panel */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                📖 What You Can Do With Bibliography
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  <span>Add references for books, journals, websites, and 17+ other types</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  <span>Insert citations while writing with proper formatting</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  <span>Automatically generate formatted bibliography at book end</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  <span>Export references in JSON, BibTeX, or RIS formats</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  <span>Include bibliography in PDF exports with proper formatting</span>
                </li>
              </ul>
            </div>

            {/* Citation Style Guide */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Citation Style Guide
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">APA:</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    Sciences, Psychology, Education • (Smith, 2020, p. 42)
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">MLA:</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    Humanities, Literature • (Smith 42)
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Chicago:</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    History, Arts • Footnotes/Endnotes
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Harvard:</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    Business, Economics • (Smith 2020)
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">IEEE:</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    Engineering, Technology • [1]
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Vancouver:</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    Medicine, Health Sciences • Superscript numbers
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">AMA:</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    Medical, Clinical • Superscript numbers
                  </span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                🚀 Next Steps After Book Generation
              </h3>
              <ol className="space-y-2 text-sm text-yellow-800 dark:text-yellow-300 list-decimal list-inside">
                <li>Generate your book with bibliography enabled</li>
                <li>Open the book in the Library</li>
                <li>Click "Bibliography Manager" to add references</li>
                <li>Use "Edit Book" to insert citations while writing</li>
                <li>Export to PDF with complete bibliography included</li>
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  );
};



