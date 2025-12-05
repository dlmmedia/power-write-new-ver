'use client';

import { TypographySettings as TypographySettingsType, BODY_FONTS, HEADING_FONTS } from '@/lib/types/publishing';

interface TypographySettingsProps {
  settings: TypographySettingsType;
  onUpdate: (updates: Partial<TypographySettingsType>) => void;
}

export function TypographySettings({ settings, onUpdate }: TypographySettingsProps) {
  return (
    <div className="space-y-6">
      {/* Body Text Settings */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-lg">📝</span>
          Body Text
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Body Font */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Font Family
            </label>
            <select
              value={settings.bodyFont}
              onChange={(e) => onUpdate({ bodyFont: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            >
              <optgroup label="Serif (Recommended for Print)">
                {BODY_FONTS.filter(f => f.category === 'serif').map(font => (
                  <option key={font.id} value={font.id}>{font.name}</option>
                ))}
              </optgroup>
              <optgroup label="Sans-Serif">
                {BODY_FONTS.filter(f => f.category === 'sans-serif').map(font => (
                  <option key={font.id} value={font.id}>{font.name}</option>
                ))}
              </optgroup>
            </select>
          </div>
          
          {/* Font Size */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Font Size (pt)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="9"
                max="16"
                step="0.5"
                value={settings.bodyFontSize}
                onChange={(e) => onUpdate({ bodyFontSize: parseFloat(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
              />
              <span className="w-12 text-sm text-gray-900 dark:text-white font-medium text-right">
                {settings.bodyFontSize}pt
              </span>
            </div>
          </div>
          
          {/* Line Height */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Line Height
            </label>
            <select
              value={settings.bodyLineHeight}
              onChange={(e) => onUpdate({ bodyLineHeight: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            >
              <option value="1">Single (1.0)</option>
              <option value="1.15">Tight (1.15)</option>
              <option value="1.25">Compact (1.25)</option>
              <option value="1.5">Normal (1.5)</option>
              <option value="1.75">Relaxed (1.75)</option>
              <option value="2">Double (2.0)</option>
            </select>
          </div>
          
          {/* Text Alignment */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Text Alignment
            </label>
            <div className="flex gap-1">
              {(['left', 'justify', 'center', 'right'] as const).map(align => (
                <button
                  key={align}
                  onClick={() => onUpdate({ bodyAlignment: align })}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    settings.bodyAlignment === align
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {align === 'left' && '⌥ Left'}
                  {align === 'justify' && '⊞ Justify'}
                  {align === 'center' && '⊝ Center'}
                  {align === 'right' && '⌦ Right'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Heading Settings */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-lg">📰</span>
          Headings & Titles
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Heading Font */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Heading Font
            </label>
            <select
              value={settings.headingFont}
              onChange={(e) => onUpdate({ headingFont: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            >
              <option value="inherit">Same as Body</option>
              <optgroup label="Display & Decorative">
                {HEADING_FONTS.filter(f => f.category === 'display').map(font => (
                  <option key={font.id} value={font.id}>{font.name}</option>
                ))}
              </optgroup>
              <optgroup label="Serif">
                {HEADING_FONTS.filter(f => f.category === 'serif').map(font => (
                  <option key={font.id} value={font.id}>{font.name}</option>
                ))}
              </optgroup>
              <optgroup label="Sans-Serif">
                {HEADING_FONTS.filter(f => f.category === 'sans-serif').map(font => (
                  <option key={font.id} value={font.id}>{font.name}</option>
                ))}
              </optgroup>
            </select>
          </div>
          
          {/* Chapter Title Size */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Chapter Title Size (pt)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="16"
                max="48"
                step="1"
                value={settings.chapterTitleSize}
                onChange={(e) => onUpdate({ chapterTitleSize: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
              />
              <span className="w-12 text-sm text-gray-900 dark:text-white font-medium text-right">
                {settings.chapterTitleSize}pt
              </span>
            </div>
          </div>
          
          {/* Heading Alignment */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Heading Alignment
            </label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map(align => (
                <button
                  key={align}
                  onClick={() => onUpdate({ headingAlignment: align })}
                  className={`flex-1 px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                    settings.headingAlignment === align
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {align.charAt(0).toUpperCase() + align.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Paragraph Settings */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-lg">¶</span>
          Paragraph Formatting
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Paragraph Indent */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              First-line Indent
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={settings.paragraphIndent}
                onChange={(e) => onUpdate({ paragraphIndent: parseFloat(e.target.value) || 0 })}
                step="0.1"
                min="0"
                max="2"
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
              />
              <select
                value={settings.paragraphIndentUnit}
                onChange={(e) => onUpdate({ paragraphIndentUnit: e.target.value as 'inches' | 'em' | 'px' })}
                className="w-20 px-2 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
              >
                <option value="inches">in</option>
                <option value="em">em</option>
                <option value="px">px</option>
              </select>
            </div>
          </div>
          
          {/* Paragraph Spacing */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Paragraph Spacing
            </label>
            <select
              value={settings.paragraphSpacing}
              onChange={(e) => onUpdate({ paragraphSpacing: e.target.value as 'none' | 'small' | 'medium' | 'large' })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            >
              <option value="none">None (indent only)</option>
              <option value="small">Small (0.25em)</option>
              <option value="medium">Medium (0.5em)</option>
              <option value="large">Large (1em)</option>
            </select>
          </div>
          
          {/* First Paragraph Indent */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.firstParagraphIndent}
                onChange={(e) => onUpdate({ firstParagraphIndent: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-0"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Indent first paragraph after headings
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Drop Caps */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-2xl font-serif">A</span>
          Drop Caps
        </h4>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.dropCapEnabled}
              onChange={(e) => onUpdate({ dropCapEnabled: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-0"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Enable drop caps at chapter beginnings
            </span>
          </label>
          
          {settings.dropCapEnabled && (
            <div className="grid grid-cols-2 gap-4 pl-7">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Drop Cap Lines
                </label>
                <select
                  value={settings.dropCapLines}
                  onChange={(e) => onUpdate({ dropCapLines: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                >
                  <option value="2">2 lines</option>
                  <option value="3">3 lines</option>
                  <option value="4">4 lines</option>
                  <option value="5">5 lines</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Drop Cap Font
                </label>
                <select
                  value={settings.dropCapFont}
                  onChange={(e) => onUpdate({ dropCapFont: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                >
                  <option value="inherit">Same as Heading</option>
                  {HEADING_FONTS.filter(f => f.category === 'display' || f.category === 'serif').map(font => (
                    <option key={font.id} value={font.id}>{font.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Typography */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-lg">⚙️</span>
          Advanced Options
        </h4>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.hyphenation}
              onChange={(e) => onUpdate({ hyphenation: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-0"
            />
            <div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Enable hyphenation</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">Break long words at line endings</p>
            </div>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.widowControl}
              onChange={(e) => onUpdate({ widowControl: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-0"
            />
            <div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Widow control</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">Prevent single lines at page top</p>
            </div>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.orphanControl}
              onChange={(e) => onUpdate({ orphanControl: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-0"
            />
            <div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Orphan control</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">Prevent single lines at page bottom</p>
            </div>
          </label>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wide">
          Typography Preview
        </h4>
        <div 
          className="space-y-4"
          style={{
            fontFamily: settings.bodyFont.includes('-') 
              ? settings.bodyFont.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
              : settings.bodyFont.charAt(0).toUpperCase() + settings.bodyFont.slice(1),
            fontSize: `${settings.bodyFontSize}pt`,
            lineHeight: settings.bodyLineHeight,
          }}
        >
          <h2 
            className="font-semibold"
            style={{ 
              fontSize: `${settings.chapterTitleSize}pt`,
              textAlign: settings.headingAlignment,
            }}
          >
            Chapter One
          </h2>
          <p style={{ 
            textAlign: settings.bodyAlignment,
            textIndent: settings.firstParagraphIndent ? 0 : `${settings.paragraphIndent}${settings.paragraphIndentUnit}`,
          }}>
            {settings.dropCapEnabled && (
              <span 
                className="float-left font-bold mr-2"
                style={{ 
                  fontSize: `${settings.bodyFontSize * settings.dropCapLines * 0.9}pt`,
                  lineHeight: 1,
                }}
              >
                T
              </span>
            )}
            he journey of a thousand pages begins with a single word. This sample text demonstrates how your book will appear with the current typography settings. Notice the font selection, line height, and paragraph formatting.
          </p>
          <p style={{ 
            textAlign: settings.bodyAlignment,
            textIndent: `${settings.paragraphIndent}${settings.paragraphIndentUnit}`,
          }}>
            Each subsequent paragraph follows the indentation rules you have configured. Professional typesetting ensures readability and creates a pleasant reading experience for your audience.
          </p>
        </div>
      </div>
    </div>
  );
}

