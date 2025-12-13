'use client';

import { MarginSettings as MarginSettingsType, MARGIN_PRESETS } from '@/lib/types/publishing';

interface MarginSettingsProps {
  settings: MarginSettingsType;
  currentPreset: string;
  onUpdate: (updates: Partial<MarginSettingsType>) => void;
  onPresetChange: (preset: string) => void;
}

export function MarginSettings({ 
  settings, 
  currentPreset, 
  onUpdate, 
  onPresetChange 
}: MarginSettingsProps) {
  const presetKeys = Object.keys(MARGIN_PRESETS);
  
  return (
    <div className="space-y-6">
      {/* Preset Selection */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-lg">📏</span>
          Margin Presets
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {presetKeys.map(preset => {
            const presetData = MARGIN_PRESETS[preset];
            return (
              <button
                key={preset}
                onClick={() => onPresetChange(preset)}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  currentPreset === preset
                    ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-600'
                }`}
              >
                <div className="text-lg mb-1">
                  {preset === 'tight' && '⊡'}
                  {preset === 'normal' && '⊞'}
                  {preset === 'comfortable' && '⊟'}
                  {preset === 'wide' && '⬜'}
                  {preset === 'academic' && '📚'}
                  {preset === 'picture-book' && '🎨'}
                </div>
                <div className="text-xs font-medium text-gray-900 dark:text-white capitalize">
                  {preset.replace('-', ' ')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {presetData.inside}" gutter
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Margin Controls */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-lg">🔧</span>
          Custom Margins (inches)
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Top Margin
            </label>
            <input
              type="number"
              value={settings.top}
              onChange={(e) => onUpdate({ top: parseFloat(e.target.value) || 0 })}
              step="0.125"
              min="0.25"
              max="3"
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-center"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Bottom Margin
            </label>
            <input
              type="number"
              value={settings.bottom}
              onChange={(e) => onUpdate({ bottom: parseFloat(e.target.value) || 0 })}
              step="0.125"
              min="0.25"
              max="3"
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-center"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Inside (Gutter)
            </label>
            <input
              type="number"
              value={settings.inside}
              onChange={(e) => onUpdate({ inside: parseFloat(e.target.value) || 0 })}
              step="0.125"
              min="0.375"
              max="2"
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-center"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">Binding side</p>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Outside Margin
            </label>
            <input
              type="number"
              value={settings.outside}
              onChange={(e) => onUpdate({ outside: parseFloat(e.target.value) || 0 })}
              step="0.125"
              min="0.25"
              max="2"
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-center"
            />
          </div>
        </div>
      </div>

      {/* Mirror Margins & Bleed */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-lg">📐</span>
          Advanced Options
        </h4>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.mirrorMargins}
              onChange={(e) => onUpdate({ mirrorMargins: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-0"
            />
            <div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Mirror margins for facing pages
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Essential for printed books - inside margin on binding side
              </p>
            </div>
          </label>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Bleed (for print)
              </label>
              <input
                type="number"
                value={settings.bleed}
                onChange={(e) => onUpdate({ bleed: parseFloat(e.target.value) || 0 })}
                step="0.0625"
                min="0"
                max="0.5"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-center"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">Usually 0.125"</p>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Header Space
              </label>
              <input
                type="number"
                value={settings.headerSpace}
                onChange={(e) => onUpdate({ headerSpace: parseFloat(e.target.value) || 0 })}
                step="0.05"
                min="0"
                max="1"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-center"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Footer Space
              </label>
              <input
                type="number"
                value={settings.footerSpace}
                onChange={(e) => onUpdate({ footerSpace: parseFloat(e.target.value) || 0 })}
                step="0.05"
                min="0"
                max="1"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-center"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Visual Preview */}
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wide">
          Page Layout Preview
        </h4>
        
        <div className="flex justify-center gap-4">
          {/* Left (Verso) Page */}
          <div className="relative">
            <div className="text-xs text-gray-400 dark:text-gray-500 text-center mb-2">Left (Even)</div>
            <div 
              className="w-32 h-44 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 relative rounded overflow-hidden"
            >
              {/* Bleed indicator */}
              {settings.bleed > 0 && (
                <div 
                  className="absolute inset-0 border-2 border-dashed border-red-300 dark:border-red-600 pointer-events-none"
                  style={{ 
                    margin: `${settings.bleed * 20}px`,
                  }}
                />
              )}
              
              {/* Content area */}
              <div 
                className="absolute bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700"
                style={{
                  top: `${settings.top * 12}px`,
                  bottom: `${settings.bottom * 12}px`,
                  left: settings.mirrorMargins ? `${settings.outside * 12}px` : `${settings.inside * 12}px`,
                  right: settings.mirrorMargins ? `${settings.inside * 12}px` : `${settings.outside * 12}px`,
                }}
              >
                <div className="p-1">
                  <div className="h-1 bg-gray-300 dark:bg-gray-600 mb-1 rounded"></div>
                  <div className="h-1 bg-gray-300 dark:bg-gray-600 mb-1 rounded"></div>
                  <div className="h-1 bg-gray-300 dark:bg-gray-600 mb-1 rounded w-3/4"></div>
                </div>
              </div>
              
              {/* Gutter indicator */}
              <div 
                className="absolute top-0 bottom-0 bg-gray-200 dark:bg-gray-700 opacity-50"
                style={{
                  right: 0,
                  width: `${settings.inside * 12}px`,
                }}
              />
            </div>
          </div>
          
          {/* Spine */}
          <div className="w-3 bg-gray-300 dark:bg-gray-700 rounded self-stretch my-6" />
          
          {/* Right (Recto) Page */}
          <div className="relative">
            <div className="text-xs text-gray-400 dark:text-gray-500 text-center mb-2">Right (Odd)</div>
            <div 
              className="w-32 h-44 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 relative rounded overflow-hidden"
            >
              {/* Bleed indicator */}
              {settings.bleed > 0 && (
                <div 
                  className="absolute inset-0 border-2 border-dashed border-red-300 dark:border-red-600 pointer-events-none"
                  style={{ 
                    margin: `${settings.bleed * 20}px`,
                  }}
                />
              )}
              
              {/* Gutter indicator */}
              <div 
                className="absolute top-0 bottom-0 bg-gray-200 dark:bg-gray-700 opacity-50"
                style={{
                  left: 0,
                  width: `${settings.inside * 12}px`,
                }}
              />
              
              {/* Content area */}
              <div 
                className="absolute bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700"
                style={{
                  top: `${settings.top * 12}px`,
                  bottom: `${settings.bottom * 12}px`,
                  left: settings.mirrorMargins ? `${settings.inside * 12}px` : `${settings.outside * 12}px`,
                  right: settings.mirrorMargins ? `${settings.outside * 12}px` : `${settings.inside * 12}px`,
                }}
              >
                <div className="p-1">
                  <div className="h-1 bg-gray-300 dark:bg-gray-600 mb-1 rounded"></div>
                  <div className="h-1 bg-gray-300 dark:bg-gray-600 mb-1 rounded"></div>
                  <div className="h-1 bg-gray-300 dark:bg-gray-600 mb-1 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center gap-8 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded"></div>
            <span className="text-gray-500 dark:text-gray-400">Text area</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <span className="text-gray-500 dark:text-gray-400">Gutter</span>
          </div>
          {settings.bleed > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-dashed border-red-300 dark:border-red-600 rounded"></div>
              <span className="text-gray-500 dark:text-gray-400">Bleed</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}






