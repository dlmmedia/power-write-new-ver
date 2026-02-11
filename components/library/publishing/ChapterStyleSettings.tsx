'use client';

import { useEffect } from 'react';
import { ChapterSettings } from '@/lib/types/publishing';
import { getGoogleFontUrl } from '@/lib/utils/font-mapping';
import { BookOpen, File, Palette, Image, FileText, Zap, Pencil, Sparkles, Ruler } from 'lucide-react';

interface ChapterStyleSettingsProps {
  settings: ChapterSettings;
  onUpdate: (updates: Partial<ChapterSettings>) => void;
}

// Track loaded fonts
const loadedFonts = new Set<string>();

// Helper to convert number to display format
function formatChapterNumber(num: number, style: string): string {
  switch (style) {
    case 'roman':
      return toRoman(num);
    case 'word':
      return toWord(num);
    case 'ordinal':
      return toOrdinal(num);
    default:
      return String(num);
  }
}

function toRoman(num: number): string {
  const romanNumerals: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let result = '';
  for (const [value, numeral] of romanNumerals) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}

function toWord(num: number): string {
  const words = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
  return num <= 10 ? words[num] : String(num);
}

function toOrdinal(num: number): string {
  const ordinals = ['', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
  return num <= 10 ? ordinals[num] : String(num);
}

// Get ornament symbol
function getOrnamentSymbol(ornament: string): string {
  switch (ornament) {
    case 'line': return '━━━━━━━━━';
    case 'flourish': return '❧';
    case 'stars': return '✦ ✦ ✦';
    case 'dots': return '• • •';
    default: return '';
  }
}

// Get scene break symbol
function getSceneBreakSymbol(style: string, custom?: string): string {
  switch (style) {
    case 'blank-line': return '';
    case 'asterisks': return '* * *';
    case 'ornament': return '❦';
    case 'number': return '2';
    case 'custom': return custom || '* * *';
    default: return '* * *';
  }
}

export function ChapterStyleSettings({ settings, onUpdate }: ChapterStyleSettingsProps) {
  // Load Google Fonts for preview (using EB Garamond for elegant preview)
  useEffect(() => {
    const fontsToLoad = ['garamond', 'playfair'];
    
    for (const fontId of fontsToLoad) {
      if (loadedFonts.has(fontId)) continue;
      
      const googleUrl = getGoogleFontUrl(fontId);
      if (googleUrl) {
        loadedFonts.add(fontId);
        const linkId = `font-${fontId}`;
        if (!document.getElementById(linkId)) {
          const link = document.createElement('link');
          link.id = linkId;
          link.rel = 'stylesheet';
          link.href = `https://fonts.googleapis.com/css2?family=${googleUrl}&display=swap`;
          document.head.appendChild(link);
        }
      }
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Chapter Opening Style */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 inline" />
          Chapter Opening Style
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {([
            { id: 'simple', label: 'Simple', icon: <File className="w-4 h-4 inline" />, desc: 'Clean, minimal design' },
            { id: 'decorated', label: 'Decorated', icon: <Palette className="w-4 h-4 inline" />, desc: 'With ornaments' },
            { id: 'illustrated', label: 'Illustrated', icon: <Image className="w-4 h-4 inline" />, desc: 'Space for images' },
            { id: 'full-page', label: 'Full Page', icon: <FileText className="w-4 h-4 inline" />, desc: 'Title on own page' },
            { id: 'minimal', label: 'Minimal', icon: <Zap className="w-4 h-4 inline" />, desc: 'Ultra-clean' },
          ] as const).map(style => (
            <button
              key={style.id}
              onClick={() => onUpdate({ chapterOpeningStyle: style.id })}
              className={`p-3 rounded-lg border-2 transition-all text-center ${
                settings.chapterOpeningStyle === style.id
                  ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-600'
              }`}
            >
              <div className="text-2xl mb-1">{style.icon}</div>
              <div className="text-xs font-medium text-gray-900 dark:text-white">{style.label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{style.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Chapter Number Settings */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-lg">#</span>
          Chapter Numbering
        </h4>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showChapterNumber}
              onChange={(e) => onUpdate({ showChapterNumber: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-0"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Show chapter numbers
            </span>
          </label>
          
          {settings.showChapterNumber && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Number Style
                </label>
                <select
                  value={settings.chapterNumberStyle}
                  onChange={(e) => onUpdate({ chapterNumberStyle: e.target.value as ChapterSettings['chapterNumberStyle'] })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                >
                  <option value="numeric">Numeric (1, 2, 3...)</option>
                  <option value="roman">Roman (I, II, III...)</option>
                  <option value="word">Word (One, Two, Three...)</option>
                  <option value="ordinal">Ordinal (First, Second...)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Label Text
                </label>
                <input
                  type="text"
                  value={settings.chapterNumberLabel}
                  onChange={(e) => onUpdate({ chapterNumberLabel: e.target.value })}
                  placeholder="Chapter"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Number Position
                </label>
                <div className="flex gap-2">
                  {([
                    { id: 'above-title', label: 'Above Title' },
                    { id: 'before-title', label: 'Before Title' },
                    { id: 'below-title', label: 'Below Title' },
                    { id: 'hidden', label: 'Hidden' },
                  ] as const).map(pos => (
                    <button
                      key={pos.id}
                      onClick={() => onUpdate({ chapterNumberPosition: pos.id })}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                        settings.chapterNumberPosition === pos.id
                          ? 'bg-yellow-400 text-black'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chapter Title Styling */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Pencil className="w-4 h-4 inline" />
          Chapter Title Style
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Title Position
            </label>
            <div className="flex gap-1">
              {(['left', 'centered', 'right'] as const).map(pos => (
                <button
                  key={pos}
                  onClick={() => onUpdate({ chapterTitlePosition: pos })}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    settings.chapterTitlePosition === pos
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {pos.charAt(0).toUpperCase() + pos.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Title Case
            </label>
            <select
              value={settings.chapterTitleCase}
              onChange={(e) => onUpdate({ chapterTitleCase: e.target.value as ChapterSettings['chapterTitleCase'] })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
            >
              <option value="title-case">Title Case</option>
              <option value="uppercase">UPPERCASE</option>
              <option value="lowercase">lowercase</option>
              <option value="as-written">As Written</option>
            </select>
          </div>
        </div>
      </div>

      {/* Page Position Settings */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Ruler className="w-5 h-5" />
          Page Positioning
        </h4>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.startOnOddPage}
              onChange={(e) => onUpdate({ startOnOddPage: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-0"
            />
            <div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Start chapters on right (odd) pages
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Traditional for printed books - may add blank pages
              </p>
            </div>
          </label>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Drop from Top (inches)
              </label>
              <input
                type="number"
                value={settings.chapterDropFromTop}
                onChange={(e) => onUpdate({ chapterDropFromTop: parseFloat(e.target.value) || 0 })}
                step="0.25"
                min="0"
                max="5"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Space before chapter title</p>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Space After Title (inches)
              </label>
              <input
                type="number"
                value={settings.afterChapterTitleSpace}
                onChange={(e) => onUpdate({ afterChapterTitleSpace: parseFloat(e.target.value) || 0 })}
                step="0.125"
                min="0"
                max="2"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Before content begins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ornaments */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 inline" />
          Decorative Elements
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Chapter Ornament
            </label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {([
                { id: 'none', label: 'None', preview: '—' },
                { id: 'line', label: 'Line', preview: '━━━' },
                { id: 'flourish', label: 'Flourish', preview: '❧' },
                { id: 'stars', label: 'Stars', preview: '✦ ✦ ✦' },
                { id: 'dots', label: 'Dots', preview: '• • •' },
                { id: 'custom', label: 'Custom', preview: '...' },
              ] as const).map(ornament => (
                <button
                  key={ornament.id}
                  onClick={() => onUpdate({ chapterOrnament: ornament.id })}
                  className={`p-2 rounded-lg border-2 transition-all text-center ${
                    settings.chapterOrnament === ornament.id
                      ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300'
                  }`}
                >
                  <div className="text-lg mb-0.5">{ornament.preview}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{ornament.label}</div>
                </button>
              ))}
            </div>
          </div>
          
          {settings.chapterOrnament !== 'none' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Ornament Position
              </label>
              <div className="flex gap-2">
                {([
                  { id: 'above-number', label: 'Above Number' },
                  { id: 'between-number-title', label: 'Between' },
                  { id: 'below-title', label: 'Below Title' },
                ] as const).map(pos => (
                  <button
                    key={pos.id}
                    onClick={() => onUpdate({ chapterOrnamentPosition: pos.id })}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      settings.chapterOrnamentPosition === pos.id
                        ? 'bg-yellow-400 text-black'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scene Breaks */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-lg">⸻</span>
          Scene Breaks
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Scene Break Style
            </label>
            <div className="grid grid-cols-5 gap-2">
              {([
                { id: 'blank-line', label: 'Blank', preview: '⎯' },
                { id: 'asterisks', label: 'Asterisks', preview: '* * *' },
                { id: 'ornament', label: 'Ornament', preview: '❦' },
                { id: 'number', label: 'Number', preview: '2' },
                { id: 'custom', label: 'Custom', preview: '...' },
              ] as const).map(style => (
                <button
                  key={style.id}
                  onClick={() => onUpdate({ sceneBreakStyle: style.id })}
                  className={`p-2 rounded-lg border-2 transition-all text-center ${
                    settings.sceneBreakStyle === style.id
                      ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300'
                  }`}
                >
                  <div className="text-base mb-0.5">{style.preview}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{style.label}</div>
                </button>
              ))}
            </div>
          </div>
          
          {settings.sceneBreakStyle === 'custom' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Custom Symbol
              </label>
              <input
                type="text"
                value={settings.sceneBreakSymbol}
                onChange={(e) => onUpdate({ sceneBreakSymbol: e.target.value })}
                placeholder="* * *"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-center"
              />
            </div>
          )}
        </div>
      </div>

      {/* Live Preview - Matches PDF output */}
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-6 uppercase tracking-wide">
          Chapter Opening Preview
        </h4>
        
        {/* Preview styled to match PDF output */}
        <div 
          className="py-8"
          style={{ 
            paddingTop: `${Math.min(settings.chapterDropFromTop * 40, 120)}px`,
            textAlign: settings.chapterTitlePosition === 'centered' ? 'center' : settings.chapterTitlePosition,
            fontFamily: "'EB Garamond', Garamond, 'Times New Roman', serif",
          }}
        >
          {/* Ornament above number */}
          {settings.chapterOrnament !== 'none' && settings.chapterOrnamentPosition === 'above-number' && (
            <div className="text-gray-400 dark:text-gray-500 text-lg mb-4" style={{ color: '#8B4513' }}>
              {getOrnamentSymbol(settings.chapterOrnament)}
            </div>
          )}
          
          {/* Chapter number above title */}
          {settings.showChapterNumber && settings.chapterNumberPosition === 'above-title' && (
            <div className="mb-2">
              <span 
                className="text-sm uppercase tracking-widest"
                style={{ 
                  color: '#666',
                  letterSpacing: '0.2em',
                }}
              >
                {settings.chapterNumberLabel}
              </span>
              <span 
                className="block text-3xl mt-1"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {formatChapterNumber(1, settings.chapterNumberStyle)}
              </span>
            </div>
          )}
          
          {/* Ornament between number and title */}
          {settings.chapterOrnament !== 'none' && settings.chapterOrnamentPosition === 'between-number-title' && (
            <div className="text-lg my-2" style={{ color: '#8B4513' }}>
              {settings.chapterOrnament === 'line' ? '━━━' : getOrnamentSymbol(settings.chapterOrnament)}
            </div>
          )}
          
          {/* Chapter title */}
          <h2 
            className="text-2xl"
            style={{ 
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 'normal',
              textTransform: settings.chapterTitleCase === 'uppercase' ? 'uppercase' : 
                           settings.chapterTitleCase === 'lowercase' ? 'lowercase' : 'none',
              margin: 0,
            }}
          >
            {settings.showChapterNumber && settings.chapterNumberPosition === 'before-title' && (
              <span style={{ color: '#666', marginRight: '0.5em' }}>
                {formatChapterNumber(1, settings.chapterNumberStyle)}.
              </span>
            )}
            The Beginning
          </h2>
          
          {/* Chapter number below title */}
          {settings.showChapterNumber && settings.chapterNumberPosition === 'below-title' && (
            <div 
              className="text-sm uppercase tracking-widest mt-3"
              style={{ color: '#666', letterSpacing: '0.2em' }}
            >
              {settings.chapterNumberLabel} {formatChapterNumber(1, settings.chapterNumberStyle)}
            </div>
          )}
          
          {/* Ornament below title */}
          {settings.chapterOrnament !== 'none' && settings.chapterOrnamentPosition === 'below-title' && (
            <div className="text-lg mt-4" style={{ color: '#8B4513' }}>
              {getOrnamentSymbol(settings.chapterOrnament)}
            </div>
          )}
        </div>
        
        {/* Scene break preview */}
        {settings.sceneBreakStyle !== 'blank-line' && (
          <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Scene Break Preview:</p>
            <div 
              className="text-center py-4"
              style={{ 
                color: '#666',
                letterSpacing: '0.5em',
                fontFamily: "'EB Garamond', Garamond, serif",
              }}
            >
              {getSceneBreakSymbol(settings.sceneBreakStyle, settings.sceneBreakSymbol)}
            </div>
          </div>
        )}
        
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 text-center italic">
          This preview uses the same styling as your exported PDF
        </p>
      </div>
    </div>
  );
}
