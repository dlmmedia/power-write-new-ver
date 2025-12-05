'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookPublishingSettings } from '@/lib/store/publishing-store';
import { 
  BookType, 
  TRIM_SIZES,
  STYLE_PRESETS,
  BOOK_TYPE_PRESETS,
  DEFAULT_PUBLISHING_SETTINGS,
} from '@/lib/types/publishing';
import { TrimSizeSelector } from './TrimSizeSelector';
import { TypographySettings } from './TypographySettings';
import { ChapterStyleSettings } from './ChapterStyleSettings';
import { MarginSettings } from './MarginSettings';
import { Button } from '@/components/ui/Button';

interface PublishingSettingsProps {
  bookId: number;
  bookTitle: string;
  onSave?: () => void;
}

type Tab = 'book-type' | 'page-size' | 'typography' | 'margins' | 'chapters' | 'headers' | 'front-matter' | 'export';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'book-type', label: 'Book Type', icon: '📚' },
  { id: 'page-size', label: 'Page Size', icon: '📐' },
  { id: 'typography', label: 'Typography', icon: '📝' },
  { id: 'margins', label: 'Margins', icon: '📏' },
  { id: 'chapters', label: 'Chapters', icon: '📖' },
  { id: 'headers', label: 'Headers', icon: '📄' },
  { id: 'front-matter', label: 'Front/Back', icon: '📑' },
  { id: 'export', label: 'Export', icon: '💾' },
];

const BOOK_TYPE_OPTIONS: { id: BookType; label: string; icon: string; description: string }[] = [
  { id: 'novel', label: 'Novel', icon: '📖', description: 'Standard fiction, 60k-100k words' },
  { id: 'novella', label: 'Novella', icon: '📕', description: 'Shorter fiction, 17k-40k words' },
  { id: 'short-story-collection', label: 'Short Stories', icon: '📚', description: 'Anthology collection' },
  { id: 'picture-book', label: 'Picture Book', icon: '🎨', description: "Children's illustrated" },
  { id: 'storybook', label: 'Storybook', icon: '👶', description: "Children's chapter book" },
  { id: 'young-adult', label: 'Young Adult', icon: '🎭', description: 'YA fiction' },
  { id: 'middle-grade', label: 'Middle Grade', icon: '🌟', description: 'Ages 8-12' },
  { id: 'memoir', label: 'Memoir', icon: '💭', description: 'Personal memoir' },
  { id: 'biography', label: 'Biography', icon: '👤', description: 'Life story' },
  { id: 'self-help', label: 'Self-Help', icon: '🌱', description: 'Personal development' },
  { id: 'business', label: 'Business', icon: '💼', description: 'Professional/business' },
  { id: 'technical', label: 'Technical', icon: '⚙️', description: 'Technical manual' },
  { id: 'textbook', label: 'Textbook', icon: '🎓', description: 'Educational' },
  { id: 'cookbook', label: 'Cookbook', icon: '🍳', description: 'Recipe book' },
  { id: 'poetry', label: 'Poetry', icon: '✨', description: 'Poetry collection' },
  { id: 'art-book', label: 'Art Book', icon: '🖼️', description: 'Photography/art' },
  { id: 'coffee-table-book', label: 'Coffee Table', icon: '☕', description: 'Large format visual' },
  { id: 'academic', label: 'Academic', icon: '📜', description: 'Academic paper/thesis' },
  { id: 'custom', label: 'Custom', icon: '⚡', description: 'Custom format' },
];

export function PublishingSettings({ bookId, bookTitle, onSave }: PublishingSettingsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('book-type');
  const [isSaving, setIsSaving] = useState(false);
  
  const {
    settings,
    updateSettings,
    updateTypography,
    updateMargins,
    updateChapters,
    updateHeaderFooter,
    updateFrontMatter,
    updateBackMatter,
    updateExport,
    applyStylePreset,
    applyBookTypePreset,
    applyMarginPreset,
    resetSettings,
    hasUnsavedChanges,
  } = useBookPublishingSettings(bookId);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to API
      const response = await fetch(`/api/books/${bookId}/publishing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishingSettings: settings }),
      });
      
      if (response.ok) {
        onSave?.();
      }
    } catch (error) {
      console.error('Failed to save publishing settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-2xl">📚</span>
              Publishing Settings
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configure how "{bookTitle}" will be formatted for export
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm('Reset all settings to defaults?')) {
                  resetSettings();
                }
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={!hasUnsavedChanges}
            >
              Save Settings
            </Button>
          </div>
        </div>
        
        {/* Unsaved Changes Indicator */}
        {hasUnsavedChanges && (
          <div className="mt-3 flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-sm">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            Unsaved changes
          </div>
        )}
      </div>
      
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20 overflow-x-auto">
        <div className="flex min-w-max">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'text-yellow-600 dark:text-yellow-400 border-b-2 border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="p-4 md:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Book Type Tab */}
            {activeTab === 'book-type' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    What type of book are you publishing?
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Selecting a book type will apply recommended formatting presets for that genre.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {BOOK_TYPE_OPTIONS.map(option => (
                    <button
                      key={option.id}
                      onClick={() => {
                        applyBookTypePreset(option.id);
                      }}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        settings.bookType === option.id
                          ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-600 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {option.description}
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* Style Presets */}
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Design Style
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Choose an overall aesthetic for your book's interior design.
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {Object.keys(STYLE_PRESETS).map(preset => (
                      <button
                        key={preset}
                        onClick={() => applyStylePreset(preset)}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          settings.stylePreset === preset
                            ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300'
                        }`}
                      >
                        <div className="text-xl mb-1">
                          {preset === 'classic' && '📜'}
                          {preset === 'modern' && '✨'}
                          {preset === 'minimal' && '⚡'}
                          {preset === 'elegant' && '👑'}
                          {preset === 'bold' && '💥'}
                          {preset === 'academic' && '🎓'}
                          {preset === 'childrens' && '🌈'}
                          {preset === 'custom' && '🔧'}
                        </div>
                        <div className="text-xs font-medium text-gray-900 dark:text-white capitalize">
                          {preset}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Page Size Tab */}
            {activeTab === 'page-size' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Trim Size & Orientation
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Select the physical dimensions of your printed book. Different sizes suit different genres and reader expectations.
                  </p>
                </div>
                
                <TrimSizeSelector
                  selectedSize={settings.trimSize}
                  onSelect={(sizeId) => updateSettings({ trimSize: sizeId })}
                  customSize={settings.customTrimSize}
                  onCustomSizeChange={(size) => updateSettings({ customTrimSize: size })}
                />
                
                {/* Orientation */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Page Orientation
                  </h4>
                  <div className="flex gap-3">
                    <button
                      onClick={() => updateSettings({ orientation: 'portrait' })}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        settings.orientation === 'portrait'
                          ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300'
                      }`}
                    >
                      <div className="w-8 h-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 mx-auto mb-2 rounded" />
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Portrait</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Standard for most books</div>
                    </button>
                    <button
                      onClick={() => updateSettings({ orientation: 'landscape' })}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        settings.orientation === 'landscape'
                          ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300'
                      }`}
                    >
                      <div className="w-12 h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 mx-auto mb-2 rounded" />
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Landscape</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Photo books, art books</div>
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Typography Tab */}
            {activeTab === 'typography' && (
              <div>
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Typography Settings
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configure fonts, sizes, and text formatting for optimal readability.
                  </p>
                </div>
                <TypographySettings
                  settings={settings.typography}
                  onUpdate={updateTypography}
                />
              </div>
            )}
            
            {/* Margins Tab */}
            {activeTab === 'margins' && (
              <div>
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Page Margins
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Set margins for your book pages. The gutter margin (inside) should be larger to accommodate binding.
                  </p>
                </div>
                <MarginSettings
                  settings={settings.margins}
                  currentPreset={settings.marginPreset}
                  onUpdate={updateMargins}
                  onPresetChange={applyMarginPreset}
                />
              </div>
            )}
            
            {/* Chapters Tab */}
            {activeTab === 'chapters' && (
              <div>
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Chapter Styling
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configure how chapter openings and scene breaks appear in your book.
                  </p>
                </div>
                <ChapterStyleSettings
                  settings={settings.chapters}
                  onUpdate={updateChapters}
                />
              </div>
            )}
            
            {/* Headers Tab */}
            {activeTab === 'headers' && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Headers & Footers
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configure running headers and page numbers for your book.
                  </p>
                </div>
                
                {/* Header Settings */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="text-lg">📄</span>
                      Page Header
                    </h4>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.headerFooter.headerEnabled}
                        onChange={(e) => updateHeaderFooter({ headerEnabled: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-yellow-400 focus:ring-yellow-400"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Enable</span>
                    </label>
                  </div>
                  
                  {settings.headerFooter.headerEnabled && (
                    <div className="grid grid-cols-3 gap-4">
                      {['Left', 'Center', 'Right'].map((pos) => {
                        const key = `header${pos}Content` as keyof typeof settings.headerFooter;
                        return (
                          <div key={pos}>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                              {pos}
                            </label>
                            <select
                              value={settings.headerFooter[key] as string}
                              onChange={(e) => updateHeaderFooter({ [key]: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                            >
                              <option value="none">None</option>
                              <option value="title">Book Title</option>
                              <option value="author">Author Name</option>
                              <option value="chapter">Chapter Title</option>
                              <option value="page-number">Page Number</option>
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {/* Footer Settings */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="text-lg">📃</span>
                      Page Footer
                    </h4>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.headerFooter.footerEnabled}
                        onChange={(e) => updateHeaderFooter({ footerEnabled: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-yellow-400 focus:ring-yellow-400"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Enable</span>
                    </label>
                  </div>
                  
                  {settings.headerFooter.footerEnabled && (
                    <div className="grid grid-cols-3 gap-4">
                      {['Left', 'Center', 'Right'].map((pos) => {
                        const key = `footer${pos}Content` as keyof typeof settings.headerFooter;
                        return (
                          <div key={pos}>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                              {pos}
                            </label>
                            <select
                              value={settings.headerFooter[key] as string}
                              onChange={(e) => updateHeaderFooter({ [key]: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                            >
                              <option value="none">None</option>
                              <option value="title">Book Title</option>
                              <option value="author">Author Name</option>
                              <option value="chapter">Chapter Title</option>
                              <option value="page-number">Page Number</option>
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {/* Page Number Settings */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-lg">#</span>
                    Page Numbering
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                        Number Style
                      </label>
                      <select
                        value={settings.headerFooter.pageNumberStyle}
                        onChange={(e) => updateHeaderFooter({ pageNumberStyle: e.target.value as 'arabic' | 'roman-lower' | 'roman-upper' | 'none' })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                      >
                        <option value="arabic">Arabic (1, 2, 3...)</option>
                        <option value="roman-lower">Roman Lower (i, ii, iii...)</option>
                        <option value="roman-upper">Roman Upper (I, II, III...)</option>
                        <option value="none">No Page Numbers</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                        Front Matter Numbers
                      </label>
                      <select
                        value={settings.headerFooter.frontMatterNumbering}
                        onChange={(e) => updateHeaderFooter({ frontMatterNumbering: e.target.value as 'roman-lower' | 'none' })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                      >
                        <option value="roman-lower">Roman Numerals (i, ii, iii...)</option>
                        <option value="none">No Numbers</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!settings.headerFooter.firstPageNumberVisible}
                        onChange={(e) => updateHeaderFooter({ firstPageNumberVisible: !e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-yellow-400 focus:ring-yellow-400"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Hide page number on chapter first pages
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.headerFooter.mirrorHeaders}
                        onChange={(e) => updateHeaderFooter({ mirrorHeaders: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-yellow-400 focus:ring-yellow-400"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Mirror headers for odd/even pages
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {/* Front/Back Matter Tab */}
            {activeTab === 'front-matter' && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Front & Back Matter
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configure which sections to include before and after your main content.
                  </p>
                </div>
                
                {/* Front Matter */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-lg">📑</span>
                    Front Matter
                  </h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { id: 'halfTitlePage', label: 'Half Title', desc: 'Book title only' },
                      { id: 'titlePage', label: 'Title Page', desc: 'Full title page' },
                      { id: 'copyrightPage', label: 'Copyright', desc: 'Copyright info' },
                      { id: 'dedicationPage', label: 'Dedication', desc: 'Dedication page' },
                      { id: 'tableOfContents', label: 'TOC', desc: 'Table of contents' },
                      { id: 'foreword', label: 'Foreword', desc: 'By another author' },
                      { id: 'preface', label: 'Preface', desc: "Author's preface" },
                      { id: 'acknowledgments', label: 'Acknowledgments', desc: 'Thank you page' },
                      { id: 'introduction', label: 'Introduction', desc: 'Book intro' },
                    ].map(item => (
                      <label
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          settings.frontMatter[item.id as keyof typeof settings.frontMatter]
                            ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!settings.frontMatter[item.id as keyof typeof settings.frontMatter]}
                          onChange={(e) => updateFrontMatter({ [item.id]: e.target.checked })}
                          className="w-4 h-4 mt-0.5 rounded border-gray-300 dark:border-gray-600 text-yellow-400 focus:ring-yellow-400"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Back Matter */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-lg">📚</span>
                    Back Matter
                  </h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { id: 'epilogue', label: 'Epilogue', desc: 'Story conclusion' },
                      { id: 'afterword', label: 'Afterword', desc: "Author's reflection" },
                      { id: 'appendices', label: 'Appendices', desc: 'Additional material' },
                      { id: 'glossary', label: 'Glossary', desc: 'Term definitions' },
                      { id: 'bibliography', label: 'Bibliography', desc: 'References' },
                      { id: 'index', label: 'Index', desc: 'Alphabetical index' },
                      { id: 'aboutAuthor', label: 'About Author', desc: 'Author bio' },
                      { id: 'alsoBy', label: 'Also By', desc: 'Other works' },
                      { id: 'bookClubQuestions', label: 'Book Club', desc: 'Discussion questions' },
                    ].map(item => (
                      <label
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          settings.backMatter[item.id as keyof typeof settings.backMatter]
                            ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!settings.backMatter[item.id as keyof typeof settings.backMatter]}
                          onChange={(e) => updateBackMatter({ [item.id]: e.target.checked })}
                          className="w-4 h-4 mt-0.5 rounded border-gray-300 dark:border-gray-600 text-yellow-400 focus:ring-yellow-400"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Export Tab */}
            {activeTab === 'export' && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Export Settings
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configure format-specific export options.
                  </p>
                </div>
                
                {/* PDF Settings */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-lg">📄</span>
                    PDF Export
                  </h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                        Quality
                      </label>
                      <select
                        value={settings.export.pdf.quality}
                        onChange={(e) => updateExport({ pdf: { ...settings.export.pdf, quality: e.target.value as 'screen' | 'ebook' | 'print' | 'press' } })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                      >
                        <option value="screen">Screen (72 DPI)</option>
                        <option value="ebook">eBook (150 DPI)</option>
                        <option value="print">Print (300 DPI)</option>
                        <option value="press">Press (600 DPI)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                        Color Profile
                      </label>
                      <select
                        value={settings.export.pdf.colorProfile}
                        onChange={(e) => updateExport({ pdf: { ...settings.export.pdf, colorProfile: e.target.value as 'rgb' | 'cmyk' | 'grayscale' } })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                      >
                        <option value="rgb">RGB (Digital)</option>
                        <option value="cmyk">CMYK (Print)</option>
                        <option value="grayscale">Grayscale</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={settings.export.pdf.embedFonts}
                          onChange={(e) => updateExport({ pdf: { ...settings.export.pdf, embedFonts: e.target.checked } })}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-yellow-400 focus:ring-yellow-400"
                        />
                        Embed Fonts
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={settings.export.pdf.includeBleed}
                          onChange={(e) => updateExport({ pdf: { ...settings.export.pdf, includeBleed: e.target.checked } })}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-yellow-400 focus:ring-yellow-400"
                        />
                        Include Bleed
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* EPUB Settings */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-lg">📱</span>
                    EPUB / Kindle Export
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                        EPUB Version
                      </label>
                      <select
                        value={settings.export.epub.version}
                        onChange={(e) => updateExport({ epub: { ...settings.export.epub, version: e.target.value as 'epub2' | 'epub3' } })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                      >
                        <option value="epub3">EPUB 3 (Modern)</option>
                        <option value="epub2">EPUB 2 (Legacy)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                        Layout Type
                      </label>
                      <select
                        value={settings.export.epub.layout}
                        onChange={(e) => updateExport({ epub: { ...settings.export.epub, layout: e.target.value as 'reflowable' | 'fixed' } })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                      >
                        <option value="reflowable">Reflowable (Recommended)</option>
                        <option value="fixed">Fixed Layout</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={settings.export.kindle.enhancedTypesetting}
                        onChange={(e) => updateExport({ kindle: { ...settings.export.kindle, enhancedTypesetting: e.target.checked } })}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-yellow-400 focus:ring-yellow-400"
                      />
                      Enable Enhanced Typesetting (Kindle)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={settings.export.kindle.textToSpeechEnabled}
                        onChange={(e) => updateExport({ kindle: { ...settings.export.kindle, textToSpeechEnabled: e.target.checked } })}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-yellow-400 focus:ring-yellow-400"
                      />
                      Enable Text-to-Speech
                    </label>
                  </div>
                </div>
                
                {/* Metadata */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-lg">📋</span>
                    Book Metadata
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                        ISBN
                      </label>
                      <input
                        type="text"
                        value={settings.isbn || ''}
                        onChange={(e) => updateSettings({ isbn: e.target.value })}
                        placeholder="978-0-123456-78-9"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                        Publisher
                      </label>
                      <input
                        type="text"
                        value={settings.publisher || ''}
                        onChange={(e) => updateSettings({ publisher: e.target.value })}
                        placeholder="Publisher Name"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                        Language
                      </label>
                      <select
                        value={settings.language}
                        onChange={(e) => updateSettings({ language: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                      >
                        <option value="en-US">English (US)</option>
                        <option value="en-GB">English (UK)</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                        <option value="pt">Portuguese</option>
                        <option value="ja">Japanese</option>
                        <option value="zh">Chinese</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                        Edition
                      </label>
                      <input
                        type="text"
                        value={settings.edition || ''}
                        onChange={(e) => updateSettings({ edition: e.target.value })}
                        placeholder="First Edition"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

