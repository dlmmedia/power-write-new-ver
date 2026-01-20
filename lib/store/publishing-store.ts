import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  PublishingSettings,
  DEFAULT_PUBLISHING_SETTINGS,
  STYLE_PRESETS,
  BOOK_TYPE_PRESETS,
  getPublishingPreset,
  BookType,
  TypographySettings,
  MarginSettings,
  ChapterSettings,
  HeaderFooterSettings,
  FrontMatterSettings,
  BackMatterSettings,
  ExportSettings,
  MARGIN_PRESETS,
} from '../types/publishing';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge<T>(base: T, patch: Partial<T>): T {
  if (!isPlainObject(base) || !isPlainObject(patch)) {
    return ((patch ?? base) as unknown) as T;
  }

  const baseObj = base as unknown as Record<string, unknown>;
  const patchObj = patch as unknown as Record<string, unknown>;

  const result: Record<string, unknown> = { ...baseObj };
  for (const key of Object.keys(patchObj)) {
    const nextVal = patchObj[key];
    const prevVal = baseObj[key];

    // Replace arrays entirely (orders, etc.)
    if (Array.isArray(nextVal)) {
      result[key] = nextVal;
      continue;
    }

    if (isPlainObject(prevVal) && isPlainObject(nextVal)) {
      result[key] = deepMerge(prevVal, nextVal);
      continue;
    }

    result[key] = nextVal;
  }

  return result as T;
}

interface PublishingStore {
  // Current publishing settings (by book ID)
  settingsByBookId: Record<number, PublishingSettings>;
  
  // Get settings for a specific book
  getSettings: (bookId: number) => PublishingSettings;
  
  // Update entire settings for a book
  setSettings: (bookId: number, settings: PublishingSettings) => void;
  
  // Update partial settings for a book
  updateSettings: (bookId: number, updates: Partial<PublishingSettings>) => void;
  
  // Update nested settings
  updateTypography: (bookId: number, updates: Partial<TypographySettings>) => void;
  updateMargins: (bookId: number, updates: Partial<MarginSettings>) => void;
  updateChapters: (bookId: number, updates: Partial<ChapterSettings>) => void;
  updateHeaderFooter: (bookId: number, updates: Partial<HeaderFooterSettings>) => void;
  updateFrontMatter: (bookId: number, updates: Partial<FrontMatterSettings>) => void;
  updateBackMatter: (bookId: number, updates: Partial<BackMatterSettings>) => void;
  updateExport: (bookId: number, updates: Partial<ExportSettings>) => void;
  
  // Apply presets
  applyStylePreset: (bookId: number, preset: string) => void;
  applyBookTypePreset: (bookId: number, bookType: BookType) => void;
  applyMarginPreset: (bookId: number, preset: string) => void;
  applyPublishingPreset: (bookId: number, presetId: string) => void;
  
  // Reset to defaults
  resetSettings: (bookId: number) => void;
  
  // Copy settings from one book to another
  copySettings: (fromBookId: number, toBookId: number) => void;
  
  // Export settings to JSON
  exportSettingsToJSON: (bookId: number) => string;
  
  // Import settings from JSON
  importSettingsFromJSON: (bookId: number, json: string) => boolean;
  
  // Check if settings have been modified
  hasUnsavedChanges: (bookId: number) => boolean;
  
  // Track modification state
  modifiedBookIds: Set<number>;
  markAsModified: (bookId: number) => void;
  clearModified: (bookId: number) => void;
}

export const usePublishingStore = create<PublishingStore>()(
  persist(
    (set, get) => ({
      settingsByBookId: {},
      modifiedBookIds: new Set(),
      
      getSettings: (bookId: number) => {
        const settings = get().settingsByBookId[bookId];
        if (settings) {
          return settings;
        }
        return { ...DEFAULT_PUBLISHING_SETTINGS };
      },
      
      setSettings: (bookId: number, settings: PublishingSettings) => {
        set((state) => ({
          settingsByBookId: {
            ...state.settingsByBookId,
            [bookId]: settings,
          },
          modifiedBookIds: new Set([...state.modifiedBookIds, bookId]),
        }));
      },
      
      updateSettings: (bookId: number, updates: Partial<PublishingSettings>) => {
        set((state) => {
          const currentSettings = state.settingsByBookId[bookId] || { ...DEFAULT_PUBLISHING_SETTINGS };
          return {
            settingsByBookId: {
              ...state.settingsByBookId,
              [bookId]: {
                ...currentSettings,
                ...updates,
                publishingPresetId: updates.publishingPresetId ?? 'custom',
              },
            },
            modifiedBookIds: new Set([...state.modifiedBookIds, bookId]),
          };
        });
      },
      
      updateTypography: (bookId: number, updates: Partial<TypographySettings>) => {
        set((state) => {
          const currentSettings = state.settingsByBookId[bookId] || { ...DEFAULT_PUBLISHING_SETTINGS };
          return {
            settingsByBookId: {
              ...state.settingsByBookId,
              [bookId]: {
                ...currentSettings,
                typography: {
                  ...currentSettings.typography,
                  ...updates,
                },
                publishingPresetId: 'custom',
              },
            },
            modifiedBookIds: new Set([...state.modifiedBookIds, bookId]),
          };
        });
      },
      
      updateMargins: (bookId: number, updates: Partial<MarginSettings>) => {
        set((state) => {
          const currentSettings = state.settingsByBookId[bookId] || { ...DEFAULT_PUBLISHING_SETTINGS };
          return {
            settingsByBookId: {
              ...state.settingsByBookId,
              [bookId]: {
                ...currentSettings,
                margins: {
                  ...currentSettings.margins,
                  ...updates,
                },
                marginPreset: 'custom',
                publishingPresetId: 'custom',
              },
            },
            modifiedBookIds: new Set([...state.modifiedBookIds, bookId]),
          };
        });
      },
      
      updateChapters: (bookId: number, updates: Partial<ChapterSettings>) => {
        set((state) => {
          const currentSettings = state.settingsByBookId[bookId] || { ...DEFAULT_PUBLISHING_SETTINGS };
          return {
            settingsByBookId: {
              ...state.settingsByBookId,
              [bookId]: {
                ...currentSettings,
                chapters: {
                  ...currentSettings.chapters,
                  ...updates,
                },
                publishingPresetId: 'custom',
              },
            },
            modifiedBookIds: new Set([...state.modifiedBookIds, bookId]),
          };
        });
      },
      
      updateHeaderFooter: (bookId: number, updates: Partial<HeaderFooterSettings>) => {
        set((state) => {
          const currentSettings = state.settingsByBookId[bookId] || { ...DEFAULT_PUBLISHING_SETTINGS };
          return {
            settingsByBookId: {
              ...state.settingsByBookId,
              [bookId]: {
                ...currentSettings,
                headerFooter: {
                  ...currentSettings.headerFooter,
                  ...updates,
                },
                publishingPresetId: 'custom',
              },
            },
            modifiedBookIds: new Set([...state.modifiedBookIds, bookId]),
          };
        });
      },
      
      updateFrontMatter: (bookId: number, updates: Partial<FrontMatterSettings>) => {
        set((state) => {
          const currentSettings = state.settingsByBookId[bookId] || { ...DEFAULT_PUBLISHING_SETTINGS };
          return {
            settingsByBookId: {
              ...state.settingsByBookId,
              [bookId]: {
                ...currentSettings,
                frontMatter: {
                  ...currentSettings.frontMatter,
                  ...updates,
                },
                publishingPresetId: 'custom',
              },
            },
            modifiedBookIds: new Set([...state.modifiedBookIds, bookId]),
          };
        });
      },
      
      updateBackMatter: (bookId: number, updates: Partial<BackMatterSettings>) => {
        set((state) => {
          const currentSettings = state.settingsByBookId[bookId] || { ...DEFAULT_PUBLISHING_SETTINGS };
          return {
            settingsByBookId: {
              ...state.settingsByBookId,
              [bookId]: {
                ...currentSettings,
                backMatter: {
                  ...currentSettings.backMatter,
                  ...updates,
                },
                publishingPresetId: 'custom',
              },
            },
            modifiedBookIds: new Set([...state.modifiedBookIds, bookId]),
          };
        });
      },
      
      updateExport: (bookId: number, updates: Partial<ExportSettings>) => {
        set((state) => {
          const currentSettings = state.settingsByBookId[bookId] || { ...DEFAULT_PUBLISHING_SETTINGS };
          return {
            settingsByBookId: {
              ...state.settingsByBookId,
              [bookId]: {
                ...currentSettings,
                export: {
                  ...currentSettings.export,
                  ...updates,
                },
                publishingPresetId: 'custom',
              },
            },
            modifiedBookIds: new Set([...state.modifiedBookIds, bookId]),
          };
        });
      },
      
      applyStylePreset: (bookId: number, preset: string) => {
        const presetSettings = STYLE_PRESETS[preset];
        if (!presetSettings) return;
        
        set((state) => {
          const currentSettings = state.settingsByBookId[bookId] || { ...DEFAULT_PUBLISHING_SETTINGS };
          return {
            settingsByBookId: {
              ...state.settingsByBookId,
              [bookId]: {
                ...currentSettings,
                ...presetSettings,
                stylePreset: preset as PublishingSettings['stylePreset'],
                publishingPresetId: 'custom',
              },
            },
            modifiedBookIds: new Set([...state.modifiedBookIds, bookId]),
          };
        });
      },
      
      applyBookTypePreset: (bookId: number, bookType: BookType) => {
        const presetSettings = BOOK_TYPE_PRESETS[bookType];
        if (!presetSettings) return;
        
        set((state) => {
          const currentSettings = state.settingsByBookId[bookId] || { ...DEFAULT_PUBLISHING_SETTINGS };
          
          // Deep merge the preset
          const merged: PublishingSettings = {
            ...currentSettings,
            bookType,
            trimSize: presetSettings.trimSize || currentSettings.trimSize,
            orientation: presetSettings.orientation || currentSettings.orientation,
            stylePreset: presetSettings.stylePreset || currentSettings.stylePreset,
            typography: {
              ...currentSettings.typography,
              ...(presetSettings.typography || {}),
            },
            margins: presetSettings.margins || currentSettings.margins,
            chapters: {
              ...currentSettings.chapters,
              ...(presetSettings.chapters || {}),
            },
            headerFooter: {
              ...currentSettings.headerFooter,
              ...(presetSettings.headerFooter || {}),
            },
            publishingPresetId: 'custom',
          };
          
          return {
            settingsByBookId: {
              ...state.settingsByBookId,
              [bookId]: merged,
            },
            modifiedBookIds: new Set([...state.modifiedBookIds, bookId]),
          };
        });
      },
      
      applyMarginPreset: (bookId: number, preset: string) => {
        const marginSettings = MARGIN_PRESETS[preset];
        if (!marginSettings) return;
        
        set((state) => {
          const currentSettings = state.settingsByBookId[bookId] || { ...DEFAULT_PUBLISHING_SETTINGS };
          return {
            settingsByBookId: {
              ...state.settingsByBookId,
              [bookId]: {
                ...currentSettings,
                margins: { ...marginSettings },
                marginPreset: preset,
                publishingPresetId: 'custom',
              },
            },
            modifiedBookIds: new Set([...state.modifiedBookIds, bookId]),
          };
        });
      },

      applyPublishingPreset: (bookId: number, presetId: string) => {
        const preset = getPublishingPreset(presetId);
        if (!preset) return;

        set((state) => {
          const currentSettings = state.settingsByBookId[bookId] || { ...DEFAULT_PUBLISHING_SETTINGS };

          // Apply by deep-merging the preset patch over current settings.
          // Presets intentionally replace arrays (e.g., matter order) and nested objects.
          const merged = deepMerge(currentSettings, preset.settings);

          return {
            settingsByBookId: {
              ...state.settingsByBookId,
              [bookId]: {
                ...merged,
                publishingPresetId: preset.id,
              },
            },
            modifiedBookIds: new Set([...state.modifiedBookIds, bookId]),
          };
        });
      },
      
      resetSettings: (bookId: number) => {
        set((state) => {
          const newSettingsByBookId = { ...state.settingsByBookId };
          delete newSettingsByBookId[bookId];
          
          const newModified = new Set(state.modifiedBookIds);
          newModified.delete(bookId);
          
          return {
            settingsByBookId: newSettingsByBookId,
            modifiedBookIds: newModified,
          };
        });
      },
      
      copySettings: (fromBookId: number, toBookId: number) => {
        const sourceSettings = get().getSettings(fromBookId);
        get().setSettings(toBookId, { ...sourceSettings });
      },
      
      exportSettingsToJSON: (bookId: number) => {
        const settings = get().getSettings(bookId);
        return JSON.stringify(settings, null, 2);
      },
      
      importSettingsFromJSON: (bookId: number, json: string) => {
        try {
          const settings = JSON.parse(json) as PublishingSettings;
          // Basic validation
          if (!settings.bookType || !settings.trimSize || !settings.typography) {
            return false;
          }
          get().setSettings(bookId, settings);
          return true;
        } catch {
          return false;
        }
      },
      
      hasUnsavedChanges: (bookId: number) => {
        return get().modifiedBookIds.has(bookId);
      },
      
      markAsModified: (bookId: number) => {
        set((state) => ({
          modifiedBookIds: new Set([...state.modifiedBookIds, bookId]),
        }));
      },
      
      clearModified: (bookId: number) => {
        set((state) => {
          const newModified = new Set(state.modifiedBookIds);
          newModified.delete(bookId);
          return { modifiedBookIds: newModified };
        });
      },
    }),
    {
      name: 'publishing-store',
      partialize: (state) => ({
        settingsByBookId: state.settingsByBookId,
      }),
    }
  )
);

// Helper hook to get settings for a specific book
export function useBookPublishingSettings(bookId: number) {
  const store = usePublishingStore();
  return {
    settings: store.getSettings(bookId),
    updateSettings: (updates: Partial<PublishingSettings>) => store.updateSettings(bookId, updates),
    updateTypography: (updates: Partial<TypographySettings>) => store.updateTypography(bookId, updates),
    updateMargins: (updates: Partial<MarginSettings>) => store.updateMargins(bookId, updates),
    updateChapters: (updates: Partial<ChapterSettings>) => store.updateChapters(bookId, updates),
    updateHeaderFooter: (updates: Partial<HeaderFooterSettings>) => store.updateHeaderFooter(bookId, updates),
    updateFrontMatter: (updates: Partial<FrontMatterSettings>) => store.updateFrontMatter(bookId, updates),
    updateBackMatter: (updates: Partial<BackMatterSettings>) => store.updateBackMatter(bookId, updates),
    updateExport: (updates: Partial<ExportSettings>) => store.updateExport(bookId, updates),
    applyStylePreset: (preset: string) => store.applyStylePreset(bookId, preset),
    applyBookTypePreset: (bookType: BookType) => store.applyBookTypePreset(bookId, bookType),
    applyMarginPreset: (preset: string) => store.applyMarginPreset(bookId, preset),
    applyPublishingPreset: (presetId: string) => store.applyPublishingPreset(bookId, presetId),
    resetSettings: () => store.resetSettings(bookId),
    clearModified: () => store.clearModified(bookId),
    hasUnsavedChanges: store.hasUnsavedChanges(bookId),
  };
}



