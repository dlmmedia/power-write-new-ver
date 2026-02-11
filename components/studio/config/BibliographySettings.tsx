'use client';

import { useStudioStore } from '@/lib/store/studio-store';
import { CITATION_STYLE_LABELS } from '@/lib/types/bibliography';
import { Library, BookOpen, Check, Rocket } from 'lucide-react';

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

  const selectedClass = 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 ring-1 ring-yellow-500/20';
  const unselectedClass = 'border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/30 hover:border-gray-300 dark:hover:border-gray-600';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Bibliography & References
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Configure citation style and reference management for non-fiction books
        </p>
      </div>

      <div className="space-y-5">
        {/* Enable Bibliography */}
        <div className="bg-white dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200/80 dark:border-gray-700/40">
          <label htmlFor="include-bibliography" className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="include-bibliography"
              checked={bibliographyConfig.include}
              onChange={(e) => updateBibliography({ include: e.target.checked })}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500/30"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Library className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Enable Bibliography System</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Add professional citations and references to your non-fiction book. Supports 20+ reference types and 7 major citation styles.
              </p>
            </div>
          </label>
        </div>

        {/* Citation Style */}
        {bibliographyConfig.include && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Citation Style *
              </label>
              <select
                value={bibliographyConfig.citationStyle}
                onChange={(e) => updateBibliography({ citationStyle: e.target.value as any })}
                className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/60 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/40 transition-shadow"
              >
                {Object.entries(CITATION_STYLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                Choose the citation format that matches your field or publisher requirements
              </p>
            </div>

            {/* Reference Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reference Format
              </label>
              <div className="space-y-1.5">
                {[
                  { value: 'footnotes', label: 'Footnotes', desc: 'Citations at bottom of each page' },
                  { value: 'endnotes', label: 'Endnotes', desc: 'Citations at end of each chapter' },
                  { value: 'in-text', label: 'In-Text', desc: 'Citations within the text (Author, Year)' },
                  { value: 'bibliography', label: 'Bibliography', desc: 'Complete reference list at book end' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      bibliographyConfig.referenceFormat === option.value
                        ? selectedClass
                        : unselectedClass
                    }`}
                  >
                    <input
                      type="radio"
                      name="referenceFormat"
                      value={option.value}
                      checked={bibliographyConfig.referenceFormat === option.value}
                      onChange={(e) => updateBibliography({ referenceFormat: e.target.value as any })}
                      className="mt-0.5 text-yellow-500 focus:ring-yellow-500/30"
                    />
                    <div>
                      <div className={`text-sm font-medium ${bibliographyConfig.referenceFormat === option.value ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-900 dark:text-white'}`}>{option.label}</div>
                      <div className={`text-xs ${bibliographyConfig.referenceFormat === option.value ? 'text-yellow-600/60 dark:text-yellow-400/50' : 'text-gray-500 dark:text-gray-400'}`}>{option.desc}</div>
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
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'relaxed', label: 'Relaxed', desc: 'Basic checks' },
                  { value: 'moderate', label: 'Moderate', desc: 'Standard verification' },
                  { value: 'strict', label: 'Strict', desc: 'Academic rigor' },
                ].map((option) => {
                  const isActive = bibliographyConfig.sourceVerification === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => updateBibliography({ sourceVerification: option.value as any })}
                      className={`px-3 py-2.5 rounded-lg text-left transition-all border ${
                        isActive ? selectedClass : unselectedClass
                      }`}
                    >
                      <div className={`text-sm font-medium ${isActive ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-900 dark:text-white'}`}>{option.label}</div>
                      <div className={`text-xs mt-0.5 ${isActive ? 'text-yellow-600/60 dark:text-yellow-400/50' : 'text-gray-500 dark:text-gray-400'}`}>{option.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Information Panel */}
            <div className="bg-blue-50/80 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-200/40 dark:border-blue-800/20">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Bibliography Features
              </h3>
              <ul className="space-y-1.5 text-xs text-blue-800 dark:text-blue-300/80">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Add references for books, journals, websites, and 17+ other types</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Insert citations while writing with proper formatting</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Automatically generate formatted bibliography at book end</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Export references in JSON, BibTeX, or RIS formats</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Include bibliography in PDF exports with proper formatting</span>
                </li>
              </ul>
            </div>

            {/* Citation Style Guide */}
            <div className="bg-gray-50/80 dark:bg-gray-800/30 rounded-xl p-4 border border-gray-200/40 dark:border-gray-700/20">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                Citation Style Guide
              </p>
              <div className="space-y-2 text-sm">
                {[
                  { style: 'APA', field: 'Sciences, Psychology, Education', example: '(Smith, 2020, p. 42)' },
                  { style: 'MLA', field: 'Humanities, Literature', example: '(Smith 42)' },
                  { style: 'Chicago', field: 'History, Arts', example: 'Footnotes/Endnotes' },
                  { style: 'Harvard', field: 'Business, Economics', example: '(Smith 2020)' },
                  { style: 'IEEE', field: 'Engineering, Technology', example: '[1]' },
                  { style: 'Vancouver', field: 'Medicine, Health Sciences', example: 'Superscript numbers' },
                  { style: 'AMA', field: 'Medical, Clinical', example: 'Superscript numbers' },
                ].map((item) => (
                  <div key={item.style} className="flex items-baseline gap-2">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-20 flex-shrink-0">{item.style}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.field}</span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 ml-auto flex-shrink-0">{item.example}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-yellow-50/80 dark:bg-yellow-950/10 rounded-xl p-4 border border-yellow-200/40 dark:border-yellow-800/20">
              <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-2 flex items-center gap-1.5">
                <Rocket className="w-3.5 h-3.5" /> Next Steps
              </h3>
              <ol className="space-y-1.5 text-xs text-yellow-800 dark:text-yellow-300/70 list-decimal list-inside">
                <li>Generate your book with bibliography enabled</li>
                <li>Open the book in the Library</li>
                <li>Click &quot;Bibliography Manager&quot; to add references</li>
                <li>Use &quot;Edit Book&quot; to insert citations while writing</li>
                <li>Export to PDF with complete bibliography included</li>
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
