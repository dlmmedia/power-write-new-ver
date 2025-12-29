'use client';

import { useState } from 'react';
import { TRIM_SIZES, TrimSize } from '@/lib/types/publishing';

interface TrimSizeSelectorProps {
  selectedSize: string;
  onSelect: (sizeId: string) => void;
  customSize?: { width: number; height: number };
  onCustomSizeChange?: (size: { width: number; height: number }) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  'paperback': 'Trade Paperback',
  'hardcover': 'Hardcover',
  'children': "Children's Books",
  'large-format': 'Large Format / Art',
  'standard': 'Standard Paper Sizes',
  'custom': 'Custom Size',
};

export function TrimSizeSelector({
  selectedSize,
  onSelect,
  customSize,
  onCustomSizeChange,
}: TrimSizeSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string>('paperback');
  const [showCustom, setShowCustom] = useState(selectedSize === 'custom');

  const categories = [...new Set(TRIM_SIZES.map(s => s.category))];
  const filteredSizes = TRIM_SIZES.filter(s => s.category === activeCategory);
  const selectedTrimSize = TRIM_SIZES.find(s => s.id === selectedSize);

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => {
              setActiveCategory(category);
              setShowCustom(false);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeCategory === category && !showCustom
                ? 'bg-yellow-400 text-black'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {CATEGORY_LABELS[category]}
          </button>
        ))}
        <button
          onClick={() => {
            setShowCustom(true);
            onSelect('custom');
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            showCustom
              ? 'bg-yellow-400 text-black'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Custom Size
        </button>
      </div>

      {/* Size Grid */}
      {!showCustom && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filteredSizes.map(size => (
            <TrimSizeCard
              key={size.id}
              size={size}
              isSelected={selectedSize === size.id}
              onSelect={() => onSelect(size.id)}
            />
          ))}
        </div>
      )}

      {/* Custom Size Input */}
      {showCustom && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Custom Dimensions</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Width (inches)</label>
              <input
                type="number"
                value={customSize?.width || 6}
                onChange={(e) => onCustomSizeChange?.({ 
                  width: parseFloat(e.target.value) || 6, 
                  height: customSize?.height || 9 
                })}
                step="0.125"
                min="4"
                max="14"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Height (inches)</label>
              <input
                type="number"
                value={customSize?.height || 9}
                onChange={(e) => onCustomSizeChange?.({ 
                  width: customSize?.width || 6, 
                  height: parseFloat(e.target.value) || 9 
                })}
                step="0.125"
                min="4"
                max="14"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Note: Custom sizes may not be supported by all print-on-demand services.
          </p>
        </div>
      )}

      {/* Selected Size Preview */}
      {selectedTrimSize && !showCustom && (
        <div className="flex items-center gap-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div 
            className="flex-shrink-0 bg-white dark:bg-gray-800 border-2 border-yellow-400 rounded shadow-lg"
            style={{
              width: `${selectedTrimSize.width * 8}px`,
              height: `${selectedTrimSize.height * 8}px`,
              maxWidth: '80px',
              maxHeight: '100px',
            }}
          >
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
              📖
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">{selectedTrimSize.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedTrimSize.width}" × {selectedTrimSize.height}"
            </p>
            {selectedTrimSize.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{selectedTrimSize.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TrimSizeCard({ 
  size, 
  isSelected, 
  onSelect 
}: { 
  size: TrimSize; 
  isSelected: boolean; 
  onSelect: () => void;
}) {
  // Calculate visual representation (scaled down)
  const scale = 6;
  const visualWidth = Math.min(size.width * scale, 60);
  const visualHeight = Math.min(size.height * scale, 80);

  return (
    <button
      onClick={onSelect}
      className={`relative p-3 rounded-lg border-2 transition-all text-left ${
        isSelected
          ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-600 bg-white dark:bg-gray-800'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Visual Size Preview */}
        <div 
          className={`flex-shrink-0 rounded border ${
            isSelected ? 'border-yellow-400 bg-yellow-100 dark:bg-yellow-800' : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700'
          }`}
          style={{ width: `${visualWidth}px`, height: `${visualHeight}px` }}
        />
        
        {/* Size Info */}
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium truncate ${
            isSelected ? 'text-yellow-700 dark:text-yellow-400' : 'text-gray-900 dark:text-white'
          }`}>
            {size.name}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {size.width}" × {size.height}"
          </p>
          {size.bestFor && size.bestFor.length > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
              {size.bestFor.slice(0, 2).join(', ')}
            </p>
          )}
        </div>
      </div>
      
      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </button>
  );
}















